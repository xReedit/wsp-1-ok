import { createBot, createProvider, createFlow, addKeyword, EVENTS } from '@bot-whatsapp/bot';
// import { init } from "bot-ws-plugin-openai";
// import BaileysProvider from '@bot-whatsapp/provider/baileys';

import { ClassCliente } from "../clases/cliente";
import { flowPrincipal } from "../flows/flowPrincipal";
// import { config } from '../config';
// import { handlerAI } from '../services/utiles';
// import { ChatGPT } from '../clases/chatGpt5';
import { ClassInformacionPedido } from '../clases/info.pedido.class';
import { flowConfirmaPedido } from '../flows/flowConfirmaPedido';
import { ClassInfoSede } from '../clases/sede';
import { SqliteDatabase } from '../services/sqlite.services';



const { createBot, createProvider, createFlow, addKeyword } = require('@bot-whatsapp/bot')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
// const WPPConnectProviderClass = require('@bot-whatsapp/provider/wppconnect')
// const WebWhatsappProvider = require('@bot-whatsapp/provider/web-whatsapp')
const JsonFileAdapter = require('@bot-whatsapp/database/json')

// import * as fs from 'fs'





// let classCliente = new ClassCliente();

class BotApp {
    public adapterProviderEvent: any;
    public elBot: any;
    private nameSession: string;
    private infoSede: ClassInfoSede;
    // private socket: any;
    // private infoPedido: ClassInformacionPedido;
    // private chatGpt2: ChatGPT;

    
    

    constructor(nameSession: string, infoSede: any) {
        this.nameSession = nameSession;
        this.infoSede = new ClassInfoSede(infoSede)
        this.infoSede.setSede(infoSede);        
        // this.socket = socket;
    }

    public async init(database: SqliteDatabase): Promise<void> {     

        // envia las instrucciones a chatgpt       
        // this.infoPedido = new ClassInformacionPedido()
        // this.infoPedido.setSede(this.infoSede) //quitar
        // this.infoPedido.setCliente(classCliente)        
        // const _flowConfirmar = flowConfirmaPedido(this.infoPedido)
        const _flowPrincipal = flowPrincipal(this.infoSede, database);
        const _flowConfirmar = flowConfirmaPedido(this.infoSede, database)
        

        // console.log('this.infoSede', infoPedido.getSede());
        // const _flowTest2 = new FlowTest2(this.infoPedido);

        const adapterDB = new JsonFileAdapter()
        const adapterFlow = createFlow([                        
            _flowPrincipal
            ,_flowConfirmar
            // flowVoiceNote
            // _flowTest2
        ]);

        const adapterProvider = createProvider(BaileysProvider, {
            name: this.nameSession
        });
        
       
        this.adapterProviderEvent = adapterProvider        

        createBot({
            flow: adapterFlow,
            provider: adapterProvider,
            database: adapterDB      
        }); 

        

        // this.adapterProviderEvent.on('require_action', (data) => {
        //     // muestra el codigo QR -session NO inciada-
        //     console.log('Session no iniciada ', data)
        //     this.socket.emit('session_init', false)

        //     const _nameQr = `${this.nameSession}.qr.png`
        //     setTimeout(() => {
        //         fs.readFile(_nameQr, function (err, data) {
        //             this.socket.emit('image_qr_session', "data:image/png;base64," + data.toString("base64"));
        //         })
        //     }, 1500);

        // });

        // this.adapterProviderEvent.on('ready', (data) => {
        //     console.log('Session Iniciada ', data)
        //     this.socket.emit('session_init', true)
        // });   
    }

    // funcion que actualiza la informacion de la sede
    public updateInfoSede(infoSede: any) {
        this.infoSede.setSede(infoSede)
        // this.infoPedido.setSede(this.infoSede)
        // this.infoSede = infoSede
    }
    
}

export default BotApp;

// const botApp = new BotApp('aaa');
// botApp.main();



        // const _flowPrueba = addKeyword('prueba')
        //     .addAnswer('De preferencia escribalo en una solo linea. 2',
        //         { capture: true },
        //         async (ctx, { endFlow, flowDynamic, provider }) => {
        //             console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaa');
        //             return await flowDynamic('aaa1')
        //         }
        //     )
        //     .addAnswer('De preferencia escribalo en una solo linea. 2',
        //         { capture: true },
        //         async (ctx, { endFlow, flowDynamic, provider }) => {
        //             console.log('eeeeeeee');
        //             return await endFlow('aaa2')
        //         }
        //     )

        // const pruebaLocation = addKeyword(EVENTS.LOCATION).addAction(
        //     async (ctx, ctxFn) => {
        //         console.log('🤖 pruebaLocation', ctx);
        //     }
        // )


        // const flowVoiceNote = addKeyword('1', '2',EVENTS.VOICE_NOTE)
        //     .addAnswer(
        //     async (ctx, { flowDynamic }) => {
        //         console.log('ctx', ctx);
        //         // console.log('ctxFn', ctxFn);
        //         await flowDynamic("dame un momento para escucharte...🙉");
        //         console.log("🤖 voz a texto....");
        //         const text = await handlerAI(ctx);
        //         console.log(`🤖 Fin voz a texto....[TEXT]: ${text}`);                
        //     }
        // )
        // .addAnswer([
        //     'Ya sabe que pedir? ó desea que le envie la carta?, escribe:',
        //     '*1* 🗒️ para tomarte el pedido',
        //     '*2* 🎴 para enviarte la carta'
        //     ]
        //         , {
        //             capture: true
        //         },
        //         async (ctx, { endFlow, flowDynamic, provider }) => {                      
        //             let rptUser = ctx.body.toLowerCase().trim()

        //             if (rptUser.includes('event_voice')) { 
        //                 await flowDynamic("dame un momento para escucharte...🙉");
        //                 console.log("🤖 voz a texto....");
        //                 const text = await handlerAI(ctx);
        //                 console.log(`🤖 Fin voz a texto....[TEXT]: ${text}`); 
        //                 rptUser = text
        //             }

        //             console.log('rptUser', rptUser);
        //         }

        // )
        