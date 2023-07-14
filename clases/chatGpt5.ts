// import { config } from "../config";
// import dotenv from 'dotenv';
// dotenv.config();
import endpoint from '../endpoints.config';
import { ClassInformacionPedido } from './info.pedido.class';
import fetch from 'node-fetch';
// import { ClassInformacionPedido } from './info.pedido.class';

export class ChatGPT {
    // flowConfirmaPedido(infoPedido: ClassInformacionPedido) {
    //     throw new Error("Method not implemented.");
    // }    
    private conversationLog: string[];
    private apiKey: string;
    private apiUrl: string;
    private rolResponde: string = 'mesero';
    private rolEnvia: string = 'usuario';
    private infoPedido: ClassInformacionPedido;

    constructor(rolResponde: string = 'mesero', rolEnvia: string = 'usuario', infoPedido: ClassInformacionPedido) {        
        this.apiKey=endpoint.openai_api_key;
        this.apiUrl = 'https://api.openai.com/v1/chat/completions';
        this.rolResponde = rolResponde;
        this.rolEnvia = rolEnvia;
        this.infoPedido = infoPedido;
        this.conversationLog = this.infoPedido.getConversationLog();

        // this.clearConversationLog()
    }



    private async generateResponse(prompt: string, rol: string= 'user'): Promise<string> {
        try {
            const messages = [{ role: rol, content: prompt }];
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages,
                    // max_tokens: 50,
                    temperature: 0,
                    n: 1,
                    stop: '\n',
                }),
            });

            const data = await response.json();
            console.log('data ==== api', data);
            let rptModel = data.choices[0].message.content.trim(); 
            rptModel = rptModel.replace(this.rolResponde+'=', '');
            return rptModel;
        } catch (error) {
            console.error('Error al llamar al API de ChatGPT:', error);
            return 'Lo siento, no pude generar una respuesta en este momento.';
        }
    }

    private checkPreviousResponse(prompt: string): string | null {
        const reversedLog = [...this.conversationLog].reverse();
        const previousIndex = reversedLog.findIndex((entry) => entry.includes(this.rolEnvia+'='));
        if (previousIndex !== -1) {
            const previousUserInput = reversedLog[previousIndex].split('=')[1].trim();
            const previousResponseIndex = reversedLog.findIndex((entry) => entry.includes(this.rolResponde+'='));
            if (previousResponseIndex !== -1) {
                const previousResponse = reversedLog[previousResponseIndex].split('=')[1].trim();
                if (previousUserInput === prompt && previousResponse !== 'consultar' && previousResponse !== 'consultar_plato' && previousResponse !== 'carta') {
                    return previousResponse;
                }
            }
        }
        return null;
    }

    private async sendMessageChatGpt(prompt: any, rol: string = 'user') {        
        // console.log('prompt', prompt);
        return await this.generateResponse(prompt, rol);
        // return response;
    }

    private async respond(message: string, rol: string = 'user'): Promise<string> {
        // this.conversationLog.push(message);

        //// console.log('conversationLog', this.conversationLog);
        const prompt = this.conversationLog.join('\n');
        //console.log('prompt', prompt);
        // let response = await this.generateResponse(prompt, rol);
        let response = await this.sendMessageChatGpt(prompt, rol);

        // verificar si chatgpt no pudo generar una respuesta, entonces enviamos nuevamente el prompt
        if (response === 'Lo siento, no pude generar una respuesta en este momento.') {
            response = await this.sendMessageChatGpt(rol);
        }

            

        const previousResponse = this.checkPreviousResponse(prompt);
        if (previousResponse) {            
            this.conversationLog.push(previousResponse);
            this.infoPedido.setConversationLog(this.conversationLog);

            return previousResponse;
        }

        this.conversationLog.push(`${this.rolResponde}=${response}`);
        this.infoPedido.setConversationLog(this.conversationLog);

        return response;
    }

    public async sendMessage(userInput: string): Promise<string> {
        //console.log('userInput envio', userInput);
        this.conversationLog.push(`${this.rolEnvia}=${userInput}`);
        this.infoPedido.setConversationLog(this.conversationLog);

        const response = await this.respond(userInput);
        // console.log('response responde', response);
        //console.log('this.conversationLog', this.conversationLog);
        return response;
    }

    public async sendPrompt(prompt: string): Promise<string> {
        // console.log('prompt envio', prompt);
        this.conversationLog.push(prompt);
        this.infoPedido.setConversationLog(this.conversationLog);

        const response = await this.respond(prompt, 'system');
        //this.conversationLog.push(`${this.rolResponde}=${response}`);
        //this.infoPedido.setConversationLog(this.conversationLog);
        // console.log('response responde', response);
        return response;
    }

    public setRowConversationLog(row: string): void {
        this.conversationLog.push(row);
        this.infoPedido.setConversationLog(this.conversationLog);
    }

    public getConversationLog(): string[] {
        return this.conversationLog;
    }

    public clearConversationLog(): void {
        this.conversationLog = [];
    }
}