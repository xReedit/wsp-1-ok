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
        
        const _flowPrincipal = flowPrincipal(this.infoSede, database);
        const _flowConfirmar = flowConfirmaPedido(this.infoSede, database)
        

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

    }

    // funcion que actualiza la informacion de la sede
    public updateInfoSede(infoSede: any) {
        this.infoSede.setSede(infoSede)
    }
    
}

export default BotApp;
