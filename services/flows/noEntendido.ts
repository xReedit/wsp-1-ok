import { ClassInformacionPedido, tituloNivel } from "../../clases/info.pedido.class";
import { ClassInfoSede } from "../../clases/sede";
import { getListOptionsBot } from "./esperaNumeroOpcion";

export const noEntendido = async (paramsFlowInteraction: any, ctx: any, infoPedido: ClassInformacionPedido, _infoSede: ClassInfoSede, { provider }) => {
    let infoFlowPedido = infoPedido.getVariablesFlowPedido()    

    const jid = ctx.key.remoteJid
    const sock = await provider.getInstance(jid)
    await sock.presenceSubscribe(jid)
    await sock.sendPresenceUpdate('composing', jid)
    
    infoFlowPedido.intentosEntederPedido++

    paramsFlowInteraction.nivel_titulo = tituloNivel.estarAtento
    paramsFlowInteraction.showOptionBotNoEntendio = true
    // let rptReturn = '😔 Lo siento no entendi.\n'
    // rptReturn += getListOptionsBot()

    return getListOptionsBot()
}