import { ChatGPT } from "../../clases/chatGpt5"
import { ClassInformacionPedido, tituloNivel } from "../../clases/info.pedido.class"
import { ClassInfoSede } from "../../clases/sede"
import { enviarClienteTiendaLinea, getCartaEstablecimiento } from "../../controllers/api.restobar"
import { PROMPTS } from "../../prompts/prompts"
import { buscarCoincidencias, insertarPlatosEnSeccion } from "../search.plato.services"
import { handlerAI } from "../utiles"
import endpoint from '../../endpoints.config';

let msjFormatoPedido = `De prefencia en una sola línea y en este formato:\n*cantidad nombre_del_producto(indiciaciones)*\nPor ejemplo:\nQuiero *2 ceviches(1 sin aji), 1 pollo al horno*`


export const tomarPedido = async (ctx: any, infoPedido: ClassInformacionPedido, _infoSede: ClassInfoSede, { provider, flowDynamic }) => {
    // console.log('tomarPedido')
    
    let infoFlowPedido = infoPedido.getVariablesFlowPedido()
    let paramsFlowInteraction = infoPedido.getVariablesFlowInteraccion()
    let infoSede: ClassInfoSede = _infoSede
    

    const jid = ctx.key.remoteJid
    const sock = await provider.getInstance(jid)
    await sock.presenceSubscribe(jid)
    await sock.sendPresenceUpdate('composing', jid)
    let userResponse = ctx.body.toLowerCase().trim()


    // console.log('infoFlowPedido.userResponsePrevius', infoFlowPedido.userResponsePrevius);
    userResponse = infoFlowPedido.userResponsePrevius === '' ? userResponse : infoFlowPedido.userResponsePrevius
    infoFlowPedido.userResponsePrevius = ''

    // si es mensaje de voz
    if (userResponse.includes('event_voice')) {
        await flowDynamic("dame un momento para escucharte...🙉");
        console.log("🤖 voz a texto....");
        const text = await handlerAI(ctx);
        console.log(`🤖 Fin voz a texto....[TEXT]: ${text}`);
        userResponse = text
    }

    // espera a confirmar el pedido
    // console.log('infoFlowPedido.isWaitConfirmar', infoFlowPedido.isWaitConfirmar);
    if (infoFlowPedido.isWaitConfirmar === true) {
        // console.log('confirmar pedido');
        const isConfirmaPedido = ['confirmar', 'confirmo', 'confirmado', 'confirma', 'confirm', 'dale', 'ok', 'listo', 'si'].includes(userResponse)
        
        // console.log('isConfirmaPedido', isConfirmaPedido);
        if (isConfirmaPedido) {
            infoFlowPedido.isWaitConfirmar = false
            paramsFlowInteraction.nivel_titulo = tituloNivel.confirmarPedido
            return 'Listo 👍'
        }
    }

    // INICIA CHATGPT
    let chatGpt = new ChatGPT('mesero', 'cliente', infoPedido)

    // console.log('userResponse tomar pedido', userResponse);

    // envamos el prompt
    if (infoFlowPedido.isWaitResponse === false ) {
        // console.log('enviamos el prompt mozo');
        await chatGpt.sendPrompt(endpoint.rolMozo2)
    }

    infoFlowPedido.isWaitResponse = true;

    let modelResponse = await chatGpt.sendMessage(userResponse)

    // console.log('modelResponse', modelResponse);

    const isPedido = modelResponse.includes('pedido=')

    let rptReturn = modelResponse;

    if (isPedido) {
        const cartaEstablecimiento = await getCartaEstablecimiento(infoSede.getSede().idsede) 
        const _modelResponse = modelResponse.replace('pedido=', '').replace('¿Desea algo más?', '').replace('¿desea algo más?', '')        
        const listPedidoCliente = _modelResponse.split(',').filter(item => item.trim() !== '')                

        const _rptDisponibilidad = await getDisponibilidad(listPedidoCliente, infoFlowPedido, infoPedido, ctx.from, cartaEstablecimiento)

        if (_rptDisponibilidad === '') {
            rptReturn = '¿Desea algo más?'
            chatGpt.setRowConversationLog(`mesero=¿Desea algo más?`)
        } else {
            rptReturn = `Ups! 😔\n${_rptDisponibilidad}`
            chatGpt.setRowConversationLog(`mesero=ups! ${_rptDisponibilidad}`)
        }
        
        infoPedido.setVariablesFlowPedido(infoFlowPedido)        
        return rptReturn
    }

    const posibleRespuesta = [
        { op: 1, resp: 'consultar_plato' },
        { op: 1, resp: 'consultar_plato.' },
        { op: 2, resp: 'carta' },
        { op: 2, resp: 'carta.' },
        { op: 3, resp: 'consultar' },
        { op: 3, resp: 'consultar.' },
        { op: 4, resp: 'confirmar' },
        { op: 4, resp: 'confirmar.' },
        { op: 4, resp: 'confirmar_pedido' },
        { op: 4, resp: 'confirmar_pedido.' },
        { op: 5, resp: 'no_entendido' },
        { op: 5, resp: 'no_entendido.' },
    ]

    const opSelected = posibleRespuesta.find(item => modelResponse.includes(item.resp))

    if (opSelected === undefined) {     
        infoFlowPedido.intentosEntederPedido += 1
        return rptReturn = 'No entendí su respuesta, repita por favor.';
    }

    if (infoFlowPedido.intentosEntederPedido > 2) {
        rptReturn = enviarClienteTiendaLinea(infoPedido, infoSede.getSede().idsede, infoSede.getLinkCarta(), endpoint.url_tienda_linea)

        infoFlowPedido.isWaitConfirmar = false
        infoFlowPedido.intentosEntederPedido = 0

        sock.sendMessage(jid, { text: rptReturn })
        return 'go tienda en linea';
    }

    switch (opSelected.op) {
       case 4:
            infoFlowPedido.isWaitConfirmar = true
            const _nomPlatosEncontrados = infoFlowPedido.platosEcontrados.map(item => `${item.cantidad_seleccionada} ${item.des}`)
            rptReturn = `Confirme, esto es lo que entendi:\n${_nomPlatosEncontrados.join('\n').toLowerCase().trim()}\n\nEscriba *CONFIRMAR* para continuar.`
            chatGpt.setRowConversationLog(`mesero=escriba confirmar, para enviar su pedido. O desea agregar algo mas?`)
            // return await fallBack(rptReturn);
            break;
        case 5: // no entendi lo que dijo el cliente
            rptReturn = 'No entendí su respuesta, verifique la ortografía y vuelva a escribirlo.'
            chatGpt.setRowConversationLog(`mesero=${rptReturn}`)
            infoFlowPedido.intentosEntederPedido += 1
            break;
    }

    return rptReturn;

}


// evaluar que todo lo que pide exista
async function getDisponibilidad(listPedidoCliente, infoFlowPedido, infoPedido, ctxFrom, cartaEstablecimiento) {

    const itemsCarta = cartaEstablecimiento.carta.flatMap(item => item.secciones.flatMap(seccion => seccion.items)) || [];    
    const [platosEcontrados, platosNoEcontrados, platosSinStock, platosRecomendados] = buscarCoincidencias(itemsCarta, listPedidoCliente)

    // console.log('encontrados', platosEcontrados);
    // console.log('noEncontrados', platosNoEcontrados);
    // console.log('cantidadesMayores', platosSinStock);  

    infoFlowPedido.platosEcontrados = platosEcontrados

    const seccionesPlatosElegidos = insertarPlatosEnSeccion(cartaEstablecimiento.carta, platosEcontrados);
    infoPedido.setPedidoCliente(seccionesPlatosElegidos);
    // pedidoValidadoCliente = platosEcontrados; 

    // vamos a evaluar y devolver una respuesta
    let rpt = ''
    if (platosSinStock.length > 0) {
        const resumenPlatosSinStock = platosSinStock.map(item => `${item.cantidad} ${item.des}`)
        rpt += `No tenemos la cantidad solicitada, solo tenemos:\n*${resumenPlatosSinStock.join(', ')}*\n\n`
        if (platosRecomendados.length > 0) {
            rpt += `Pero tenemos disponible:\n${platosRecomendados.join('\n')}`
        }
    }

    if (platosNoEcontrados.length > 0) {
        infoPedido.intentosEntederPedido += 1
        rpt += `No encontré los siguientes platos:\n*${platosNoEcontrados.join('\n')}*\n\nPor favor, verifique la ortografía y vuelva a escribirlo.\n${msjFormatoPedido}`
    }

    // guardamos en database
    infoPedido.setVariablesFlowPedido(infoFlowPedido)
    // database.update(ctxFrom, infoPedido)
    return rpt
}  