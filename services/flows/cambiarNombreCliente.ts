import { ClassCliente } from "../../clases/cliente";
import { ClassInformacionPedido, tituloNivel } from "../../clases/info.pedido.class";
import { ClassInfoSede } from "../../clases/sede";
import { putChangeNameCliente } from "../../controllers/api.restobar";
import { capitalize, delay } from "../utiles";

export const cambiarNombreCliente = async (paramsFlowInteraction: any, ctx: any, infoPedido: ClassInformacionPedido, _infoSede: ClassInfoSede, { provider }) => {
    let infoFlowPedido = infoPedido.getVariablesFlowPedido()
    let infoSede: ClassInfoSede = _infoSede

    const _infoCliente = infoPedido.getCliente();
    let infoCliente = new ClassCliente()
    infoCliente.setCliente(_infoCliente) 

    let rptReturn = ''

    const jid = ctx.key.remoteJid
    const sock = await provider.getInstance(jid)
    await sock.presenceSubscribe(jid)
    await sock.sendPresenceUpdate('composing', jid)
    let userResponse = ctx.body.toLowerCase().trim()
    
    if (paramsFlowInteraction.nivel_titulo === tituloNivel.actualizarNombre) {
        return await actualizarNombreCliente(infoCliente, infoFlowPedido, paramsFlowInteraction)
    }


    // solicitar nombre
    if (paramsFlowInteraction.nivel_titulo === tituloNivel.solicitarNombre ) {

        if (infoFlowPedido.nivelCambiarNombre === 0 ) {
            infoFlowPedido.nivelCambiarNombre = 1
            return `Ok, digame su nombre para actualizarlo.`
        }

        // espera el nombre
        if (infoFlowPedido.nivelCambiarNombre === 1 ) {
            infoFlowPedido.nivelCambiarNombre = 2  
            infoFlowPedido.nombreClienteCambiar = capitalize(userResponse.trim())          
            return `Ok, entonces su nombre es: *${infoFlowPedido.nombreClienteCambiar}*, verdad?.`
        }

        // confirma nombre
        if (infoFlowPedido.nivelCambiarNombre === 2) {
            // evaluamos si userResponse responde "si, ok, exacto, o si confirmar"
            const isConfirmarNombre = ["si", "ok", "exacto", "confirmar", "dale"].includes(userResponse)
            if (isConfirmarNombre ) {
                return await actualizarNombreCliente(infoCliente, infoFlowPedido, paramsFlowInteraction)                 
            }

        }
    }
}

async function actualizarNombreCliente(infoCliente: ClassCliente, infoFlowPedido: any, paramsFlowInteraction: any ): Promise<string> {
    infoFlowPedido.nivelCambiarNombre = 3
    infoCliente.setNombre(infoFlowPedido.nombreClienteCambiar)
    infoCliente.setNombrePila(infoFlowPedido.nombreClienteCambiar)

    infoFlowPedido.nivelCambiarNombre = 0
    paramsFlowInteraction.nivel_titulo = tituloNivel.estarAtento

    setBdChangeName(infoCliente.getIdCliente(), infoFlowPedido.nombreClienteCambiar)

    await delay(1000)
    return `Listo, *${infoFlowPedido.nombreClienteCambiar}*, actualize su nombre, en que te puedo ayudar ahora?.`
}

function setBdChangeName(idCliente, nameChange) {
    const _payload = {
        idcliente: idCliente,
        nombres: nameChange,
    }

    console.log('_payload', _payload);
    putChangeNameCliente(_payload)
}