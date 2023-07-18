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

// export const flowPrincipal = (infoPedido: ClassInformacionPedido) => {    
export const flowPrincipal = (infoSede: ClassInfoSede, database: SqliteDatabase) => {    

    // let _flowTest2 = new FlowTest2(database)

    const optionsSeletec =`👉 Elige una de las opciones, escribe:\n*1*  🥗 para hacer un pedido\n*2*  🎴 para enviarte la carta\n'*3*  🔍 para preguntar stock'\n*4*  📃 para reenviarte un comprobante`

    return addKeyword(['hola', 'Buenas', 'Buen dia', 'Buenos', 'ola', 'beunas'])
    .addAnswer('🤖 Hola, soy Piter su asistente virtual.')
    .addAction(
        async (ctx, { endFlow, flowDynamic, provider }) => {     
                        
            
            let infoCliente = new ClassCliente();           
            let infoPedido = new ClassInformacionPedido()            
            infoPedido.setSede(infoSede)           
            
            let infoFlowPedido = infoPedido.getVariablesFlowPedido()

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
                return flowDynamic(saludo)
            } 
            

            
            
            
            // await delay(1000)                                                                 
        }

    )
    .addAnswer(
        [
        '👉 Elige una de las opciones, escribe:',
        '*1*  🥗 para hacer un pedido',
        '*2*  🎴 para enviarte la carta',
        '*3*  🔍 para preguntar stock',
        '*4*  📃 para reenviarte un comprobante'
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


        },
        [
            flowPedido(infoSede, database),
            flowComprobante(infoSede.getSede())
            // flowTest(infoPedido)
            // _flowTest2
            // flowTest(database)
            // getFlow()
            
        ]
    )

    function guadarInfoDataBase(infoPedido: ClassInformacionPedido, infoFlowConfirma, ctxFrom) {
        // guardamos en database
        infoPedido.setVariablesFlowPedido(infoFlowConfirma)
        database.update(ctxFrom, infoPedido)
    }

}
