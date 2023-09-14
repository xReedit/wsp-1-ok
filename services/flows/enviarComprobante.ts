import { ChatGPT } from "../../clases/chatGpt5";
import { ClassInformacionPedido, tituloNivel } from "../../clases/info.pedido.class";
import { ClassInfoSede } from "../../clases/sede";
import { getComprobanteElectronico } from "../../controllers/api.restobar";
import { PROMPTS } from "../../prompts/prompts";
import endpoint from '../../endpoints.config';
import { fechaGuionASlash, quitarTildes, transformarFecha } from "../utiles";


// envia los comprobantes de pago
export const enviarComprobante = async (paramsFlowInteraction: any, ctx: any, infoPedido: ClassInformacionPedido, _infoSede: ClassInfoSede, { provider }) => {
    console.log('consultar Plato')

    let infoFlowPedido = infoPedido.getVariablesFlowPedido()
    let infoSede: ClassInfoSede = _infoSede
    const xinfoSede = infoSede.getSede()

    let rptReturn = ''
    let modelResponse = ''

    const jid = ctx.key.remoteJid
    const sock = await provider.getInstance(jid)
    await sock.presenceSubscribe(jid)
    await sock.sendPresenceUpdate('composing', jid)
    let userResponse = ctx.body.toLowerCase().trim()

    // userResponse = infoFlowPedido.userResponsePrevius === '' ? userResponse : infoFlowPedido.userResponsePrevius
    // infoFlowPedido.userResponsePrevius = ''

    let chatGptComprobante = new ChatGPT('callcenter', 'cliente', infoPedido)

    // solicita ruc o dni
    if (infoFlowPedido.nivelSolicitarComprobante === 0 ) {

        // INCIAR CHATGPT
        let _prompt = endpoint.rolAyudanteComprobante        
        await chatGptComprobante.sendPrompt(_prompt)

        infoFlowPedido.nivelSolicitarComprobante=1        
        return 'Por favor digame el *RUC* o *DNI* del cliente -a quien fue emitido-'
    }

    // confirma lo que entendio
    if (infoFlowPedido.nivelSolicitarComprobante === 3) {
        console.log('userResponse', userResponse);
        if (['confirmar', 'confirmo', 'confirmado', 'confirma', 'confirm', 'dale', 'ok', 'listo', 'si', 'ya'].includes(userResponse)) {
            await sock.sendMessage(jid, { text: 'Un momento por favor, estoy buscando el comprobante 🕑' })
            const _dataSend = {
                dni: infoFlowPedido.rucDniCliente,
                serie: infoFlowPedido.numeroComprobante ? infoFlowPedido.numeroComprobante.split('-')[0].toUpperCase() : '0',
                numero: infoFlowPedido.numeroComprobante ? parseInt(infoFlowPedido.numeroComprobante.split('-')[1]): '0', // entero sin ceros
                fechaComprobante: infoFlowPedido.fechaComprobante ? infoFlowPedido.fechaComprobante : '0',
                idsede: xinfoSede.idsede
            }

            console.log('¿_dataSend', _dataSend);

            const rpt = <any>await getComprobanteElectronico(_dataSend.idsede, _dataSend.dni, _dataSend.serie, _dataSend.numero, _dataSend.fechaComprobante)
            console.log('rpt', rpt);
            if (rpt.success) {
                // const _data = rpt.external_id
                const user_id = xinfoSede.id_api_comprobante
                const numero_comprobante = rpt.numero_comprobante

                // adjuntar comprobante electronico
                const _ulrPdf = `https://apifac.papaya.com.pe/downloads/document/pdf/${rpt.external_id}/${user_id}`;
                const _ulrXmlComprobante = `https://apifac.papaya.com.pe/downloads/document/xml/${rpt.external_id}/${user_id}`;

                // enviarlo                
                const _nomComprobante = numero_comprobante;  //infoFlowPedido.numeroComprobante.toUpperCase()

                const documentUrl = {
                    document: {
                        url: _ulrPdf
                    },
                    caption: _nomComprobante,
                    mimetype: "application/pdf",
                    fileName: `${_nomComprobante}.pdf`,
                }

                await sock.sendMessage(jid, documentUrl)

                // xml
                const documentUrlXml = {
                    document: {
                        url: _ulrXmlComprobante
                    },
                    caption: _nomComprobante,
                    mimetype: "application/xml",
                    fileName: `${_nomComprobante}.xml`,
                }

                paramsFlowInteraction.nivel_titulo = tituloNivel.estarAtento
                await sock.sendMessage(jid, documentUrlXml)

                return `Le adjunte el comprobante solicitado, también lo puedo consultar en papaya.com.pe\nQue tenga un buen dia! 🙂`
            } else {
                infoFlowPedido.nivelSolicitarComprobante = 0
                return 'No encontre ningun comprobante con esos datos, por favor verifique y vuelva a escribir. \nTambién lo puedo consultar en papaya.com.pe'
            }
        } else {
            infoFlowPedido.nivelSolicitarComprobante = 0
            return 'Por favor vuelva a escribir los datos, primero el ruc o dni a quien fue emitido el comprobante'
        }
    }

    modelResponse = await chatGptComprobante.sendMessage(userResponse)
    console.log('modelResponse', modelResponse);
    // si el modelo responde "salir_conversacion"
    modelResponse = quitarTildes(modelResponse.toLowerCase().trim())
    if (modelResponse.includes('salir_conversacion')) {
        return exitFlowComprobante(infoFlowPedido, paramsFlowInteraction, userResponse)
    }


    // numero de comprobante
    if (infoFlowPedido.nivelSolicitarComprobante === 1) {
        infoFlowPedido.nivelSolicitarComprobante = 2
        infoFlowPedido.rucDniCliente = userResponse
        return 'Ahora necesito el numero de comprobante\n*Ejemplo:F001-150*\n O sino tiene el numero me pasa la fecha de consumo\n*Ejemplo: 15/05/2023*'
    }
    
    // confirma lo que entendio
    if (infoFlowPedido.nivelSolicitarComprobante === 2) {
        infoFlowPedido.nivelSolicitarComprobante = 3   
        const nomRucDNI = infoFlowPedido.rucDniCliente.length > 8 ? 'Ruc' : 'DNI'
        infoFlowPedido.fechaComprobante = ''        


        // evaluar si es fecha
        const isFecha = userResponse.includes('/')
        if (isFecha) {
            // solo obtener la fecha            
            infoFlowPedido.fechaComprobante = transformarFecha(userResponse)
            return `Esto es lo que entendi:\n${nomRucDNI}: ${infoFlowPedido.rucDniCliente}\nFecha Comprobante: ${fechaGuionASlash(infoFlowPedido.fechaComprobante)}\n\n¿Es correcto? escriba *Si* o *No*`
        }
        
        infoFlowPedido.numeroComprobante = userResponse        
        return `Esto es lo que entendi:\n${nomRucDNI}= ${infoFlowPedido.rucDniCliente}\nNumero= ${infoFlowPedido.numeroComprobante}\n\n¿Es correcto? escriba *Si* o *no*`
    }

   
}


function exitFlowComprobante(infoFlowPedido, paramsFlowInteraction, userResponse) {
    infoFlowPedido.nivelSolicitarComprobante = 0
    // infoFlowPedido.userResponsePrevius = userResponse
    paramsFlowInteraction.nivel_titulo = tituloNivel.estarAtento
    return 'Ok, entiendo que quieres salir de este flujo. ¿En que te puedo ayudar ahora?'
}