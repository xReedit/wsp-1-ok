import { ClassInformacionPedido, tituloNivel } from "../../clases/info.pedido.class";
import { ClassInfoSede } from "../../clases/sede";
import { enviarClienteTiendaLinea } from "../../controllers/api.restobar";
import { getListOptionsBot } from "./esperaNumeroOpcion";
import endpoint from '../../endpoints.config';

// esta funcion devolver un objeto {desactivar: true, mensaje:''}
export const noEntendido = async (paramsFlowInteraction: any, ctx: any, infoPedido: ClassInformacionPedido, _infoSede: ClassInfoSede, isFromPedido = true, { provider }): Promise<{desactivar: boolean, msj: string}> => {   
    let infoFlowPedido = infoPedido.getVariablesFlowPedido()    

    const jid = ctx.key.remoteJid
    const sock = await provider.getInstance(jid)
    await sock.presenceSubscribe(jid)
    await sock.sendPresenceUpdate('composing', jid)
    
    if (isFromPedido) {

        infoFlowPedido.intentosEntederPedido++
    
        if (infoFlowPedido.intentosEntederPedido > 2) {
            const rptReturn = enviarClienteTiendaLinea(infoPedido, _infoSede.getSede().idsede, _infoSede.getLinkCarta(), endpoint.url_tienda_linea)
    
            infoFlowPedido.isWaitConfirmar = false
            infoFlowPedido.intentosEntederPedido = 0
    
            infoPedido.setBotOnline(false)
            await sock.sendMessage(jid, { text: rptReturn })
            // enviar un mensaje que esperara 15min para que un asistente humano lo atienda.
            // await sock.sendMessage(jid, { text: 'Un asistente humano te atendera en unos minutos.' })           
            
            return {
                desactivar: true,
                msj: '💔 Me desactivare por 15min para que un asistente humano lo atienda. Que tenga un buen día.'
            }
        } else {
            return {
                desactivar: false,
                msj: getListOptionsBot()
            }        
        }
    } else {
        // viene de inicio

        infoFlowPedido.intentosEntederInicio++;

        if (infoFlowPedido.intentosEntederInicio > 2) {
            const rptReturn = enviarClienteTiendaLinea(infoPedido, _infoSede.getSede().idsede, _infoSede.getLinkCarta(), endpoint.url_tienda_linea)
    
            infoFlowPedido.isWaitConfirmar = false
            infoFlowPedido.intentosEntederInicio = 0
    
            infoPedido.setBotOnline(false)
            await sock.sendMessage(jid, { text: rptReturn })
            // enviar un mensaje que esperara 15min para que un asistente humano lo atienda.
            // await sock.sendMessage(jid, { text: 'Un asistente humano te atendera en unos minutos.' })           
            
            return {
                desactivar: true,
                msj: '💔 Me desactivare por 15min para que un asistente humano lo atienda. Que tenga un buen día.'
            }
        } else {
            return {
                desactivar: false,
                msj: getListOptionsBot()
            }        
        }
    }


    // return getListOptionsBot()
}