import { ChatGPT } from "../../clases/chatGpt5";
import { ClassInformacionPedido, tituloNivel } from "../../clases/info.pedido.class";
import { ClassInfoSede } from "../../clases/sede";
import { getCartaEstablecimiento } from "../../controllers/api.restobar";
import { buscarCoincidencias, consularLoQueHay, consultarPlato, insertarPlatosEnSeccion } from "../../services/search.plato.services";

// consulta la disponible de un plato
export const consultarDisponibilidadPlato = async (paramsFlowInteraction: any, ctx: any, infoPedido: ClassInformacionPedido, _infoSede: ClassInfoSede, { provider }) => {   

    let infoFlowPedido = infoPedido.getVariablesFlowPedido()    
    let infoSede: ClassInfoSede = _infoSede

    let rptReturn = ''

    console.log('0infoSede.getSede().idsede', infoSede.getSede().idsede);
    let cartaEstablecimiento = await getCartaEstablecimiento(infoSede.getSede().idsede) 

    const jid = ctx.key.remoteJid
    const sock = await provider.getInstance(jid)
    await sock.presenceSubscribe(jid)
    await sock.sendPresenceUpdate('composing', jid)
    let userResponse = ctx.body.toLowerCase().trim()

    // el modelo respondera con el ultimo mensaje enviado
    const modelResponse = infoFlowPedido.userResponsePrevius === '' ? userResponse : infoFlowPedido.userResponsePrevius
    infoFlowPedido.userResponsePrevius = ''

    console.log('userResponse', modelResponse);

    
    if (paramsFlowInteraction.nivel_titulo === tituloNivel.consultarPlato) {
        const _platConsultar = modelResponse.split('-')[1]
        console.log('_platConsultar', _platConsultar);
        resetValuesItenraction(paramsFlowInteraction)
        return consultar_plato(_platConsultar, cartaEstablecimiento)
    }

    if (paramsFlowInteraction.nivel_titulo === tituloNivel.consultarQueHay) {
        resetValuesItenraction(paramsFlowInteraction)
        return consultar_platos_que_hay(cartaEstablecimiento, infoSede, infoPedido)
    }

}

function resetValuesItenraction(paramsFlowInteraction) {
    paramsFlowInteraction.nivel_titulo = tituloNivel.estarAtento
    paramsFlowInteraction.nivel = '0'
}

// consultar plato
function consultar_plato(plato: string, cartaEstablecimiento): string {
    let rptConsulta = ''
    const platoConsular = `0-${plato}`    

    console.log('platoConsular', platoConsular);

    const itemsCarta = cartaEstablecimiento.carta.flatMap(item => item.secciones.flatMap(seccion => seccion.items)) || [];
    let platoEncontrado = consultarPlato(itemsCarta, platoConsular)
    console.log('platoEncontrado', platoEncontrado);

    if (platoEncontrado) {
        // informamos al cliente que si tenemos disponible este plato
        const stock = platoEncontrado.cantidad === 'ND' ? 100 : parseFloat(platoEncontrado.cantidad)
        const stockDisponible = stock > 0
        if (stockDisponible) {
            const strStock = stock > 10 ? 'tenemos disponible' : `aún nos quedan disponible ${stock}`
            rptConsulta = `Si, ${strStock} ${platoEncontrado.des.toLowerCase()}`
        } else {
            rptConsulta = `No, ya no tenemos disponible ${platoEncontrado.des.toLowerCase()}`
        }
    } else {
        // informamos al cliente que no tenemos disponible este plato
        rptConsulta = `No, no tenemos disponible ${plato}`
    }

    return rptConsulta;
}

// consultar lo que hay
function consultar_platos_que_hay(cartaEstablecimiento, infoSede: ClassInfoSede, infoPedido: ClassInformacionPedido): string {
    const itemsCarta = cartaEstablecimiento.carta.flatMap(item => item.secciones.flatMap(seccion => seccion.items)) || [];
    const listSeccionMasPedida = infoSede.getSeccionMasItems()
    const idSeccionMasPedida = listSeccionMasPedida[0].idseccion
    const rptPlatosHay = consularLoQueHay(itemsCarta, idSeccionMasPedida)
    // console.log('¿rptPlatosHay', rptPlatosHay);

    const _msjAdjuntarCarta = `Desea que le adjunte la carta?🖇️`

    // chat asistente para que siga el contexto de la conversacion
    let _conversationAsistente = infoPedido.getConversationLog('asistente')
    _conversationAsistente.push(`asistente=${_msjAdjuntarCarta}`)	
    infoPedido.setConversationLogUser(_conversationAsistente, 'asistente')    
    
    if (rptPlatosHay.length > 0) {
        return `Tenemos disponible:\n${rptPlatosHay.join('\n')}\n\n${_msjAdjuntarCarta}`
    } else {
        return _msjAdjuntarCarta
    }
}