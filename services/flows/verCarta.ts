import { capitalize, delay } from "../utiles"
import endpoint from '../../endpoints.config';

export async function enviarCarta(
    _listCartasActivas: any,
    sock, jid
    ) {
    
    let url_img_carta = endpoint.url_img_carta
    _listCartasActivas.forEach(async (carta) => {
        await sock.sendMessage(jid, {
            caption: capitalize(carta.descripcion),
            image: { url: `${url_img_carta}${carta.url_carta}` }
        })
    })
    
    await sock.presenceSubscribe(jid)
    await sock.sendPresenceUpdate('composing', jid)  
    await delay(3000)


}