import { ChatGPT } from "../clases/chatGpt5";
import { ClassCliente } from "../clases/cliente";
import { ClassInformacionPedido } from "../clases/info.pedido.class";
import { ClassInfoSede } from "../clases/sede";
import { getClienteByCelular } from "../controllers/api.restobar";
import { SqliteDatabase } from "../services/sqlite.services";
import { delay, saludosBienvenida } from "../services/utiles";
import { flowComprobante } from "./flowComprobantes";
import { flowPedido } from "./flowPedido";
import { flowTest } from "./flowTest";
import { FlowTest2 } from "./flowTest2";
// const { addKeyword } = require("@bot-whatsapp/bot");
import { addKeyword, EVENTS } from "@bot-whatsapp/bot";

// export const flowPrincipal = (infoPedido: ClassInformacionPedido) => {    
export const flowPrincipal = (infoSede: ClassInfoSede, database: SqliteDatabase) => {    

    // let _flowTest2 = new FlowTest2(database)

    return addKeyword(['hola', 'Buenas', 'Buen dia', 'Buenos', 'ola', 'beunas'])
    .addAnswer('🤖 Hola, soy Piter su asistente virtual.')
    .addAction(
        async (ctx, { endFlow, flowDynamic, provider }) => {     
            
            
            let infoCliente = new ClassCliente();           
            let infoPedido = new ClassInformacionPedido()            
            infoPedido.setSede(infoSede)            

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
        '*3*  📃 para reenviarte un comprobante'
        ], null, null ,
        [
            flowPedido(infoSede, database),
            flowComprobante(infoSede.getSede())
            // flowTest(infoPedido)
            // _flowTest2
            // flowTest(database)
            // getFlow()
            
        ]
    )

}
