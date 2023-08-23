import { ChatGPT } from "../clases/chatGpt5";
import { ClassCliente } from "../clases/cliente";
import { ClassInformacionPedido } from "../clases/info.pedido.class";
import { ClassInfoSede } from "../clases/sede";
import { enviarClienteTiendaLinea, getClienteByCelular } from "../controllers/api.restobar";
import { PROMPTS } from "../prompts/prompts";
import { SqliteDatabase } from "../services/sqlite.services";
import { delay, saludosBienvenida } from "../services/utiles";
import { flowComprobante } from "./flowComprobantes";
import { flowPedido } from "./flowPedido";
import { flowTest } from "./flowTest";
import { FlowTest2 } from "./flowTest2";
// const { addKeyword } = require("@bot-whatsapp/bot");
import { addKeyword, EVENTS } from "@bot-whatsapp/bot";
import endpoint from '../endpoints.config';

// import { flowPrender } from "./flowTest3";
// const flowPrender = require('../flowTest3').flowPrender

// export const flowPrincipal = (infoPedido: ClassInformacionPedido) => {    
export const flowPrincipal = (infoSede: ClassInfoSede, database: SqliteDatabase) => {    

    // let _flowTest2 = new FlowTest2(database)
    // const _flowPedido = flowPedido(infoSede, database)

    const optionsSeletec =`👉 Elige una de las opciones, escribe:\n*1*  🥗 para hacer un pedido\n*2*  🎴 para enviarte la carta\n*3*  📃 para reenviarte un comprobante`

    // return addKeyword(['hola', 'Buenas', 'Buen dia', 'Buenos', 'ola', 'beunas'])
    return addKeyword(EVENTS.WELCOME)
    .addAnswer('🤖...'
    ,{ capture: false },
    // .addAction(
        // , null,
         async (ctx, { endFlow, fallBack, flowDynamic, gotoFlow, provider }) => {
            
            let modelResponse = ''
            let userResponse = ctx.body.trim();
            const isSaludo = ['hola', 'Buenas', 'Buen dia', 'Buenos', 'ola', 'beunas'].includes(userResponse.toLowerCase()) 
            console.log('userResponse' , userResponse);

            let infoCliente = new ClassCliente();
            let infoPedido = new ClassInformacionPedido()
            infoPedido.setSede(infoSede)

            let infoFlowPedido = infoPedido.getVariablesFlowPedido()

            const jid = ctx.key.remoteJid
            const sock = await provider.getInstance(jid)
            await sock.presenceSubscribe(jid)
            await sock.sendPresenceUpdate('composing', jid)     
            
            if (!isSaludo ) {
                // inciar chat gpt
                let chatGpt = new ChatGPT('asistente', 'cliente', infoPedido)
                await chatGpt.sendPrompt(PROMPTS.rolRecepcion)
                guadarInfoDataBase(infoPedido, infoFlowPedido, ctx.from)

                modelResponse = await chatGpt.sendMessage(userResponse)
                guadarInfoDataBase(infoPedido, infoFlowPedido, ctx.from)
            }




            // buscamos al cliente por el numero de telefono
            const _num_telefono = ctx.from
            //console.log('_num_telefono', _num_telefono);
            infoCliente = await getClienteByCelular(_num_telefono, infoCliente)
            infoPedido.setCliente(infoCliente)

            database.delete(ctx.from) // resetea todo el pedido
            database.save(ctx.from, infoPedido)


            // si se encuentra registrado saludamos primero
            if (infoCliente.getIsRegister()) {
                const saludo = saludosBienvenida(infoCliente.getNombrePila())
                if ( isSaludo ) {
                    return flowDynamic(saludo)
                } else {                    
                    await sock.sendMessage(jid, { text: saludo })
                }
            } else {                
                await sock.sendMessage(jid, { text: '🤖 Hola, soy Piter su asistente virtual.' })
            }

            // if (isSaludo) { return ;}

            
            // return flowDynamic('🤖 Hola, soy Piter su asistente virtual.')

            // analizamos la respuesta del modelo
            let isOpcion = modelResponse.includes('opcion:')
            if (isOpcion) {
                let laOpcion = modelResponse.split('opcion:')[1].trim()
                let rptOption = ''

                console.log('laOpcion', laOpcion);

                infoFlowPedido.userResponsePrevius = userResponse
                

                // si es opcion 6 se actualiza el nombre
                const IsUpdateNombreOption6 = laOpcion.includes('6')   
                if (IsUpdateNombreOption6) {
                    const nombre = laOpcion.split('-')[1].trim()
                    infoCliente.setNombre(nombre)
                    infoPedido.setCliente(infoCliente)

                    rptOption = `Ok, ${nombre} actualizare su nombre.`;
                    laOpcion = '6'
                    infoFlowPedido.optionPrevius = laOpcion
                    return flowDynamic(rptOption)
                }

                infoFlowPedido.optionPrevius = laOpcion
                guadarInfoDataBase(infoPedido, infoFlowPedido, ctx.from)
                
                switch (laOpcion) {
                    case '0':
                        infoFlowPedido.intentosEntederPedido += 1
                        guadarInfoDataBase(infoPedido, infoFlowPedido, ctx.from)
                        rptOption = `😔 *Los siento, te puedo ayudar con estas opciones:`;
                        return flowDynamic(rptOption)
                        break;
                    case '1':
                        rptOption = `Ok, entiendo que desea pedir, un momento porfavor.`;                        
                        // enviamos al flujo pedido
                        ctx.body = '1'
                        // await sock.sendMessage(jid, { text: rptOption })
                        await flowDynamic(rptOption)
                        await gotoFlow(flowPedido(infoSede, database))                         
                        break;
                    case '2':
                        rptOption = `Ok, te envio la carta`;
                        await sock.sendMessage(jid, { text: rptOption })                        
                        return await gotoFlow(flowPedido(infoSede, database))                         
                        
                        break;
                    case '3':
                        rptOption = `Ok, estoy consultando un momento por favor.`;
                        break;
                    case '4':
                        rptOption = `Ok, para enviarte el comprobante necesitamos algunos datos.`;
                        // enviamos al flujo comprobante
                        await sock.sendMessage(jid, { text: rptOption })
                        return gotoFlow(flowComprobante(infoSede.getSede()))
                        break;
                    case '5':
                        rptOption = `Un momento, estoy consultando nuestro horario de atención.`;
                        break;                                    
                }

                
            }   
        }, [
            flowPedido(infoSede, database),
            flowComprobante(infoSede.getSede())
        ]
    )    
    .addAnswer(
        [
        '👉 Elige una de las opciones, escribe:',
        '*1*  🥗 para hacer un pedido',
        '*2*  🎴 para enviarte la carta',        
        '*3*  📃 para reenviarte un comprobante'
        ], {
            capture: true
    }, async (ctx, { fallBack, flowDynamic, endFlow, gotoFlow, provider }) => {
            const userResponse = ctx.body.trim();
            const optionEsperada = parseInt(userResponse)
            const isSaludo = ['hola', 'Buenas', 'Buen dia', 'Buenos', 'ola', 'beunas'].includes(userResponse.toLowerCase()) 
            
            

            let infoPedido = new ClassInformacionPedido()
            infoPedido = await database.getInfoPedido(ctx.from)
            let infoFlowPedido = infoPedido.getVariablesFlowPedido()

            if (infoFlowPedido.intentosEntederPedido > 2) {
                const rptReturn = enviarClienteTiendaLinea(infoPedido, infoSede.getSede().idsede, infoSede.getLinkCarta(), endpoint.url_tienda_linea)
                guadarInfoDataBase(infoPedido, infoFlowPedido, ctx.from)
                return endFlow(rptReturn)
            }

            if (isNaN(optionEsperada) === false) {
                if ([1, 2, 3, 4].includes(optionEsperada)) {
                    // guadarInfoDataBase(infoPedido, infoFlowPedido, ctx.from)
                    return flowDynamic('Ok')
                } 
            }


            if (!isSaludo) {
                
                if ([1, 2, 3, 4].includes(optionEsperada)) {                                       
                    return flowDynamic('Ok')
                } else {
                    infoFlowPedido.intentosEntederPedido += 1
                    guadarInfoDataBase(infoPedido, infoFlowPedido, ctx.from)
                    return await fallBack(`😔 *Opción no valida, por favor*\n${optionsSeletec}`)       
                }                
            }


        }
        ,[
            flowPedido(infoSede, database),
            flowComprobante(infoSede.getSede())            
        ]
    )

    function guadarInfoDataBase(infoPedido: ClassInformacionPedido, infoFlowConfirma, ctxFrom) {
        // guardamos en database
        infoPedido.setVariablesFlowPedido(infoFlowConfirma)
        database.update(ctxFrom, infoPedido)
    }

}
