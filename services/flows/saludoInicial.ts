import { ChatGPT } from "../../clases/chatGpt5";
import { ClassCliente } from "../../clases/cliente";
import { ClassInformacionPedido } from "../../clases/info.pedido.class";
import { getClienteByCelular } from "../../controllers/api.restobar";
import { PROMPTS } from "../../prompts/prompts";
import endpoint from '../../endpoints.config';
import { SqliteDatabase } from "../sqlite.services";
import { saludosBienvenida } from "../utiles";

export const saludoInicial = async (         
        infoPedido: ClassInformacionPedido
        , _num_telefono
        , sock, jid, isSaludo: boolean, userResponse: string
        ) => {

    let elSaludo = ''
    let infoCliente = new ClassCliente();
    infoCliente = await getClienteByCelular(_num_telefono, infoCliente)
    infoPedido.setCliente(infoCliente)

    if (infoCliente.getIsRegister()) {
        elSaludo = saludosBienvenida(infoCliente.getNombrePila())                 
    } else {
        elSaludo = '🤖 Hola, soy Piter su asistente virtual.'
    }
    
    await sock.sendMessage(jid, { text: elSaludo })

    // INICIA CHATGPT - lanza el prompt
    let chatGpt = new ChatGPT('asistente', 'cliente', infoPedido)
    await chatGpt.sendPrompt(endpoint.rolRecepcion)
    // const modelResponse = await chatGpt.sendMessage(userResponse)

    // return modelResponse;    
} 