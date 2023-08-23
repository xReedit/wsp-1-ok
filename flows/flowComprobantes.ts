import { addKeyword } from "@bot-whatsapp/bot";
import { getData } from "../services/httpClient.services";
import { getComprobanteElectronico } from "../controllers/api.restobar";
// import { Mimetype } from '@whiskeysockets/baileys'

const { Mimetype } = require('@adiwajshing/baileys');

export const flowComprobante = (infoSede: any) => {
    let pideRuc = true
    let pideNumero = false
    let pideConfirmar = false
    let datosComprobante = {
        dni:'',
        numero:'',
        id_api_comprobante: ''
    }
    

    return addKeyword(['4', 'comprobante', 'reenviar comprobante'])
    .addAnswer([
        '📃 Para poder encontrar el comprobante:',
        'Por favor digame el *ruc* o *dni* del cliente -a quien fue emitido-'        
    ],
    { capture: true },
        async (ctx, { endFlow, fallBack, flowDynamic, provider }) => {
        const userResponse = ctx.body.toLowerCase().trim()            

        if (pideRuc ) {
            datosComprobante.dni = userResponse
            pideRuc = false
            pideNumero = true
            return await fallBack('Ahora necesito el numero de comprobante\n*Ejemplo:F001-150*')
        }

        if (pideNumero) {
            datosComprobante.numero = userResponse
            pideNumero = false
            pideConfirmar = true   
            
            const nomRucDNI = datosComprobante.dni.length > 8 ? 'Ruc' : 'DNI'

            const msjConfirmar = `Esto es lo que entendi:\n${nomRucDNI}= ${datosComprobante.dni}\nNumero= ${datosComprobante.numero}\n\n¿Es correcto? escriba *SI* o *NO*`    
            return await fallBack(msjConfirmar)
        }

        if (pideConfirmar) {
            pideConfirmar = false
            if ( userResponse.includes('si') ){
                // buscar comprobante en la api
                const _dataSend = {
                    dni: datosComprobante.dni,
                    serie: datosComprobante.numero.split('-')[0].toUpperCase(),
                    numero: datosComprobante.numero.split('-')[1],
                    idsede: infoSede.idsede
                }
                
                const rpt = <any>await getComprobanteElectronico(_dataSend.idsede, _dataSend.dni, _dataSend.serie, _dataSend.numero)
                if (rpt.success) {
                    // const _data = rpt.external_id
                    const user_id = infoSede.id_api_comprobante                    

                    // adjuntar comprobante electronico
                    const _ulrPdf = `https://apifac.papaya.com.pe/downloads/document/pdf/${rpt.external_id}/${user_id}`;
                    const _ulrXmlComprobante = `https://apifac.papaya.com.pe/downloads/document/xml/${rpt.external_id}/${user_id}`;

                    // enviarlo
                    const jid = ctx.key.remoteJid
                    const sock = await provider.getInstance(jid)
                    await sock.presenceSubscribe(jid)
                    await sock.sendPresenceUpdate('composing', jid)

                    const _nomComprobante = datosComprobante.numero.toUpperCase()                  

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

                    await sock.sendMessage(jid, documentUrlXml)                    
                    return endFlow(`Le adjunte el comprobante solicitado, también lo puedo consultar en papaya.com.pe\n\n Que tenga un buen dia! 🙂`)
                } else {
                    pideRuc = true
                    pideNumero = false
                    pideConfirmar = false
                    return await fallBack('No encontre ningun comprobante con esos datos, por favor verifique y vuelva a escribir. \nTambién lo puedo consultar en papaya.com.pe')
                }
            } else {
                pideRuc = true
                pideNumero = false
                pideConfirmar = false
                return await fallBack('Por favor vuelva a escribir los datos, primero el ruc o dni a quien fue emitido el comprobante')
            }
        }
    }
    )
}