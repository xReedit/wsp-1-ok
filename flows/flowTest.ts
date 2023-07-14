import { addKeyword, EVENTS } from "@bot-whatsapp/bot";
import { ClassInformacionPedido } from "../clases/info.pedido.class";
import { SqliteDatabase } from "../services/sqlite.services";
import { info } from "console";
import { ClassCliente } from "../clases/cliente";

export const flowTest = (database: SqliteDatabase) => {
    let _cliente: any
    let _nomCliente: any
    let _num_telefono: any
    let infoPedido: ClassInformacionPedido
    

    return addKeyword(['1', '2', EVENTS.VOICE_NOTE])
    .addAction(
        async (ctx, { endFlow, flowDynamic, provider }) => {
            console.log('numTelefefonoID', ctx.from);
            infoPedido = new ClassInformacionPedido()
            // const _infoPedidoBD = <ClassInformacionPedido> await database.get(ctx.from)
            // infoPedido.setInfoPedidoFromSql(_infoPedidoBD)

            infoPedido = await database.getInfoPedido(ctx.from)
            _cliente = infoPedido.getCliente()
            

            console.log('_cliente', _cliente);

            _nomCliente = _cliente.nombre_pila
            console.log('_nomCliente ====== ', _nomCliente);
            _num_telefono = _cliente.celular;
        }
    )
    .addAnswer(
        '🤖 Hola, soy Piter su asistente virtual.'
        ,null
        ,async (ctx, { endFlow, flowDynamic, provider }) => {
            flowDynamic(`👋 Hola *${_cliente.nombre_pila}* tel: *${_cliente.celular}*, bienvenido a Restobar. , escribe:`)
        }
    )
    .addAnswer(
        'dime tu pedido'
        , {
            capture: true
        },
        async (ctx, { fallBack, flowDynamic, provider }) => {
            console.log('ctx', ctx);        
            infoPedido = await database.getInfoPedido(ctx.from)    
            // const _cliente = <any>infoPedido.getCliente()

            const _cliente = infoPedido.getCliente()
            const clienteInfo = new ClassCliente()
            clienteInfo.setCliente(_cliente)

            console.log('_cliente', clienteInfo);

            console.log('_cliente.getNombrePila()', clienteInfo.getNombrePila());
            console.log('_cliente.getNombre()', clienteInfo.getNombre());
            

            const userResponse = ctx.body.toLowerCase().trim()
            const _rpt = `tu: *${clienteInfo.getNombrePila() }* escribiste: *->* ${userResponse}`
            await fallBack(_rpt)
        }
    )


}