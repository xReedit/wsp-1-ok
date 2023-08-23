// import { config } from "../config";
// import dotenv from 'dotenv';
// dotenv.config();
import axios from 'axios';
import endpoint from '../endpoints.config';
import { ClassInformacionPedido } from './info.pedido.class';
import fetch from 'node-fetch';
import e from 'express';
// import { ClassInformacionPedido } from './info.pedido.class';

export class ChatGPT {
    // flowConfirmaPedido(infoPedido: ClassInformacionPedido) {
    //     throw new Error("Method not implemented.");
    // }    
    // private conversationLog: any;
    private conversationLog: { [key: string]: any[] } = {};
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

        this.conversationLog = infoPedido.getAllConversationLog() || []

        if (!this.conversationLog[this.rolResponde]) {
            this.conversationLog[this.rolResponde] = [];
        } 
        // else {
        //     this.conversationLog[this.rolResponde] = this.infoPedido.getConversationLog(this.rolResponde);
        // }                

        // console.log('this.conversationLog', this.conversationLog);
        // this.clearConversationLog()
    }



    private async generateResponse(prompt: string, rol: string= 'user'): Promise<string> {
        try {
            const messages = [{ role: rol, content: prompt }];

            const timeoutMillis = 7000; // Tiempo de espera en milisegundos

            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => {
                    reject(new Error('La petición ha excedido el tiempo de espera.'));
                    return 'Lo siento, puede repetirlo porfavor.'
                }, timeoutMillis);
            });

            // const data_body_axios = JSON.stringify({
            //     model: 'gpt-3.5-turbo',
            //     messages,                
            //     temperature: 0,
            //     n: 1,
            //     stop: '\n',
            // });

            // const config_axios = {
            //     headers: {
            //         'Authorization': `Bearer ${this.apiKey}`,
            //         'Content-Type': 'application/json'
            //     }
            // };

            // const response = await axios.post(this.apiUrl, data_body_axios, config_axios);

            // const response = await fetch(this.apiUrl, {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //         'Authorization': `Bearer ${this.apiKey}`,
            //     },
            //     body: JSON.stringify({
            //         model: 'gpt-3.5-turbo',
            //         messages,
            //         // max_tokens: 50,
            //         temperature: 0,
            //         n: 1,
            //         stop: '\n',
            //     }),
            // });

            let data;
            try {
            const response = await Promise.race([
                fetch(this.apiUrl, {
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
                }),
                timeoutPromise,
            ])

            data = await response.json();

            } catch (error) {
                if (error.message === 'La petición ha excedido el tiempo de espera.') {
                    console.log('La petición fue cancelada debido al tiempo de espera excedido.');
                    return 'Lo siento, puede repetirlo porfavor.'
                } else {
                    console.error('Error en la petición:', error.message);
                    return 'Lo siento, puede repetirlo porfavor.'
                }
            }

            

            
            // const data = response.data;
            // console.log('data ==== api', data);
            let rptModel = data.choices[0].message.content.trim(); 
            rptModel = rptModel.replace(this.rolResponde+'=', '');
            return rptModel;
        } catch (error) {
            console.error('Error al llamar al API de ChatGPT:', error);
            return 'Lo siento, no pude generar una respuesta en este momento.';
        }
    }

    private checkPreviousResponse(prompt: string): string | null {
        const reversedLog = [...this.conversationLog[this.rolResponde]].reverse();
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
        const prompt = this.conversationLog[this.rolResponde].join('\n');
        //console.log('prompt', prompt);
        // let response = await this.generateResponse(prompt, rol);
        let response = await this.sendMessageChatGpt(prompt, rol);

        // verificar si chatgpt no pudo generar una respuesta, entonces enviamos nuevamente el prompt
        if (response === 'Lo siento, no pude generar una respuesta en este momento.') {
            response = await this.sendMessageChatGpt(rol);
        }

            

        const previousResponse = this.checkPreviousResponse(prompt);
        if (previousResponse) {            
            // this.conversationLog.push(previousResponse);
            this.setRowConversationLog(previousResponse)
            // this.infoPedido.setConversationLog(this.conversationLog);

            return previousResponse;
        }

        // this.conversationLog.push(`${this.rolResponde}=${response}`);
        this.setRowConversationLog(`${this.rolResponde}=${response}`);
        // this.infoPedido.setConversationLog(this.conversationLog);

        return response;
    }

    public async sendMessage(userInput: string): Promise<string> {
        //console.log('userInput envio', userInput);
        // this.conversationLog.push(`${this.rolEnvia}=${userInput}`);
        this.setRowConversationLog(`${this.rolEnvia}=${userInput}`);
        // this.infoPedido.setConversationLog(this.conversationLog);

        const response = await this.respond(userInput);
        // console.log('response responde', response);
        //console.log('this.conversationLog', this.conversationLog);
        return response;
    }

    public async sendPrompt(prompt: string): Promise<string> {
        // console.log('prompt envio', prompt);
        // this.conversationLog.push(prompt);
        this.setRowConversationLog(prompt);
        // this.infoPedido.setConversationLog(this.conversationLog);

        const response = await this.respond(prompt, 'system');
        //this.conversationLog.push(`${this.rolResponde}=${response}`);
        //this.infoPedido.setConversationLog(this.conversationLog);
        // console.log('response responde', response);
        return response;
    }

    public setRowConversationLog(row: string): void {
        if (!this.conversationLog[this.rolResponde]) {
            this.conversationLog[this.rolResponde] = [];
        }

        this.conversationLog[this.rolResponde].push(row);
        // this.conversationLog.push(row);         
        this.infoPedido.setConversationLogUser(this.rolResponde, this.conversationLog[this.rolResponde]);
        console.log('Conversacion == ', this.conversationLog[this.rolResponde]);
    }

    public getConversationLog(): string[] {
        return this.conversationLog[this.rolResponde];
    }

    public clearConversationLog(): void {
        this.conversationLog[this.rolResponde] = [];
    }
}