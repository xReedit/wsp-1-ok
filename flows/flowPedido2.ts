// import { addKeyword, EVENTS } from "@bot-whatsapp/bot";
// import { getCartaEstablecimiento, getListCartaHorariosAtencion } from "../controllers/api.restobar";
// import { capitalize, cleanText, convertirHora12hrs, delay, getItemCartaActiva, handlerAI } from "../services/utiles";
// import { flowInstrucciones } from "./flowInstrucciones";
// import { PROMPTS } from "../prompts/prompts";
// import { ChatGPT } from "../clases/chatGpt5";
// import { getData, postData } from "../services/httpClient.services";
// import { buscarCoincidencias, consularLoQueHay, consultarPlato, insertarPlatosEnSeccion } from "../services/search.plato.services";
// // import { flowConfirmaPedido } from "./flowConfirmaPedido";
// import { ClassCliente } from "../clases/cliente";
// import { ClassInformacionPedido } from "../clases/info.pedido.class";
// // import { config } from "../config";

// // import dotenv from 'dotenv';
// // dotenv.config();

// import endpoint from '../endpoints.config';


// // activar 1 hacer pedido
// // activar 2 mostrar carta

// export const flowPedido = (infoPedido: ClassInformacionPedido) => {

//     // indica si estamos atentos al pedido del cliente
//     let url_img_carta = endpoint.url_img_carta
//     let showTomarPedido = false
//     let mensageTomarPedido = 'Dime tu pedido, de manera escrita ✍️ o por voz 🗣️.\nDe prefencia en una sola línea y en este formato, ejemplo:\n*2 ceviches(1 sin aji), 1 pollo al horno*'
//     let _listCartasActivas = []
//     // let chatHistory = PROMPTS.rolMozo;
//     // let listPedidoCliente = []
//     let cartaEstablecimiento: any = []
//     // let data_pedido: any = []
//     let platosNoEcontrados: any = []
//     let platosSinStock: any = []
//     let platosEcontrados: any = []
//     let platosRecomendados: any = []
//     // let seccionesPlatosElegidos = []
//     let isWaitResponse = false
//     let isWaitConfirmar = false
//     let intentosEntederPedido = 0

//     let infoSede = infoPedido.getSede()
//     // let chatGpt: ChatGPT // = new ChatGPT('mesero', 'cliente')    
//     let chatGpt: ChatGPT // = new ChatGPT('mesero', 'cliente')    
//     // let chatGpt = new ChatGPT('mesero', 'cliente')    

//     // const _flowConfirmaPedido = flowConfirmaPedido(data_pedido, classCliente, chatGpt)


//     return addKeyword(['1', '2', EVENTS.VOICE_NOTE])
//         .addAction(
//             async () => {
//                 // reset de variables
//                 // showTomarPedido = false
//                 intentosEntederPedido = 0

//                 try {
//                     chatGpt.clearConversationLog()
//                 } catch (error) {
//                 }

//             }
//         )
//         .addAnswer([
//             'Ya sabe que pedir? ó desea que le envie la carta?, escribe:',
//             '*1* 🗒️ para tomarte el pedido',
//             '*2* 🎴 para enviarte la carta'
//         ]
//             , {
//                 capture: true
//             },
//             async (ctx, { endFlow, flowDynamic, provider }) => {
                

//                 if (isWaitResponse) {
//                     return;
//                 }



//                 let rptUser = ctx.body.toLowerCase().trim()
//                 let isShowCarta = false
//                 let isCartaActiva = false

//                 // si es mensaje de voz
//                 if (rptUser.includes('event_voice')) {
//                     await flowDynamic("dame un momento para escucharte...🙉");
//                     console.log("🤖 voz a texto....");
//                     const text = await handlerAI(ctx);
//                     console.log(`🤖 Fin voz a texto....[TEXT]: ${text}`);
//                     rptUser = text
//                 }


//                 // lista de carta con sus horarios de atencion
//                 // const _listaCartaHorarios = await getListCartaHorariosAtencion(infoSede.sede.idsede)
//                 const _listaCartaHorarios = infoPedido.getHorariosAtencion()

//                 const jid = ctx.key.remoteJid
//                 const sock = await provider.getInstance(jid)
//                 await sock.presenceSubscribe(jid)
//                 await sock.sendPresenceUpdate('composing', jid)

//                 isWaitResponse = true;

//                 // mostrar carta
//                 if (['1', '2'].includes(rptUser) === false) {
//                     await sock.sendMessage(jid, { text: 'No entendí su respuesta, lo tomare como un *si* 🙃' })
//                 }



//                 isShowCarta = rptUser === '1' ? false : true

//                 if (isShowCarta) {
//                     await sock.sendMessage(jid, { text: 'Un momento porfavor, le estoy adjuntando la carta ...🕑' })
//                 } else {
//                     await sock.sendMessage(jid, { text: 'Ok, un momento por favor...🕑' })
//                 }

//                 // cartas activas segun la hora
//                 _listCartasActivas = getItemCartaActiva(_listaCartaHorarios)
//                 isCartaActiva = _listCartasActivas.length === 0 ? false : true


//                 showTomarPedido = true
//                 mensageTomarPedido = 'Dime tu pedido, de manera escrita ✍️ o por voz 🗣️.\nDe prefencia en una sola línea y en este formato, ejemplo:\n*2 ceviches(1 sin aji), 1 pollo al horno*'

//                 // no hay carta disponible
//                 if (!isCartaActiva) {
//                     await sock.sendMessage(jid, { text: '😔 Disculpa, estamos fuera del horario de atencion 🕰️' })
//                     showTomarPedido = false
//                     mensageTomarPedido = '🫡'

//                     let rowHorarios = []
//                     rowHorarios.push('👉 Puede hacer su pedido en el siguiente horario: \n')
//                     const _saltoParrafo = _listaCartaHorarios.length > 1 ? '\n\n' : ''
//                     _listaCartaHorarios.forEach(async (item, index) => {
//                         if (item.hora_ini !== '') {
//                             rowHorarios.push(`*${capitalize(item.descripcion)}* de ${convertirHora12hrs(item.hora_ini)} a ${convertirHora12hrs(item.hora_fin)}\nlos dias ${item.nom_dias}${_saltoParrafo}`)
//                         }
//                     })


//                     await delay(500)
//                     //quitar comas                            
//                     await sock.sendMessage(jid, { text: rowHorarios.join(',').replace(/,/g, '') })

//                     isWaitResponse = false
//                     return endFlow(mensageTomarPedido)
//                     // return flowDynamic(mensageTomarPedido)
//                 }

//                 // obtenemos la carta del establecimiento
//                 cartaEstablecimiento = await getCartaEstablecimiento(infoSede.idsede)

//                 if (isShowCarta) {
//                     adjuntarCarta(sock, jid)
//                     await delay(3000)
//                 }

//                 // preparamos la ia con el prompt de mozo
//                 chatGpt = new ChatGPT('mesero', 'cliente')
//                 chatGpt.sendPrompt(PROMPTS.rolMozo)
//             }
//         )
//         .addAnswer(mensageTomarPedido,
//             {
//                 capture: true
//             },
//             async (ctx, { endFlow, flowDynamic, provider, fallBack }) => {
//                 if (!showTomarPedido) {
//                     // return endFlow()
//                     return flowDynamic('vamos')
//                 }

//                 // escribiendo
//                 const jid = ctx.key.remoteJid
//                 const sock = await provider.getInstance(jid)
//                 await sock.presenceSubscribe(jid)
//                 await sock.sendPresenceUpdate('composing', jid)
//                 let userResponse = ctx.body.toLowerCase().trim()

//                 // si es mensaje de voz
//                 if (userResponse.includes('event_voice')) {
//                     await flowDynamic("dame un momento para escucharte...🙉");
//                     console.log("🤖 voz a texto....");
//                     const text = await handlerAI(ctx);
//                     console.log(`🤖 Fin voz a texto....[TEXT]: ${text}`);
//                     userResponse = text
//                 }

//                 // const isConfirmar = userResponse.includes('confirmar')    
//                 if (isWaitConfirmar) {
//                     const isConfirmar = ['confirmar', 'confirmo', 'confirmado', 'confirma', 'confirm'].includes(userResponse.toLowerCase());
//                     if (isConfirmar) {
//                         isWaitConfirmar = false
//                         isWaitResponse = false
//                         return await flowDynamic('Ok')
//                     }
//                 }

//                 // enviamos la respuesta del usuario
//                 let modelResponse = await chatGpt.sendMessage(userResponse)
//                 // console.log('modelResponse', modelResponse);            

//                 // const isConsultarPlato = modelResponse.includes('consular_plato=')

//                 // si interpreta que es un pedido
//                 const isPedido = modelResponse.includes('pedido=')
//                 // console.log('isPedido', isPedido);
//                 // const isConfirmar = userResponse.includes('confirmar')
//                 let rptReturn = modelResponse;


//                 if (isPedido) {
//                     const _modelResponse = modelResponse.replace('pedido=', '').replace('¿Desea algo más?', '')                            
//                     const listPedidoCliente = _modelResponse.split(',')                    

//                     const _rptDisponibilidad = await getDisponibilidad(listPedidoCliente)

//                     if (_rptDisponibilidad === '') {
//                         rptReturn = '¿Desea algo más?'
//                     } else {
//                         rptReturn = `Ups! 😔\n${_rptDisponibilidad}`
//                         chatGpt.setRowConversationLog(`mesero=ups! ${_rptDisponibilidad}`)
//                     }
//                     return await fallBack(rptReturn);
//                 }

//                 const posibleRespuesta = [
//                     { op: 1, resp: 'consultar_plato' },
//                     { op: 1, resp: 'consultar_plato.' },
//                     { op: 2, resp: 'carta' },
//                     { op: 2, resp: 'carta.' },
//                     { op: 3, resp: 'consultar' },
//                     { op: 3, resp: 'consultar.' },
//                     { op: 4, resp: 'confirmar' },
//                     { op: 4, resp: 'confirmar.' },
//                     { op: 4, resp: 'confirmar_pedido' },
//                     { op: 4, resp: 'confirmar_pedido.' },
//                 ]

//                 const opSelected = posibleRespuesta.find(item => modelResponse.includes(item.resp))
//                 // console.log('opSelected', opSelected);
//                 if (opSelected === undefined) {
//                     return await fallBack('No entendí su respuesta, repita por favor.');
//                 }


//                 // console.log('modelResponse', modelResponse);
//                 switch (opSelected.op) {
//                     case 1:
//                         // rptReturn = 'Un momento...'
//                         const platoConsular = modelResponse.split(':')[1].trim()

//                         // agregamos al historia de conversacion
//                         rptReturn = consultar_plato(platoConsular)
//                         chatGpt.setRowConversationLog(`mesero=${rptReturn}`)
//                         break;
//                     case 2:
//                         // el cliente solicita la carta, lo adjuntamos
//                         console.log('adjuntar carta');
//                         rptReturn = 'Ya le adjunte'
//                         await sock.sendMessage(jid, { text: 'Ok, estoy adjuntado la carta 📎' })
//                         adjuntarCarta(sock, jid)
//                         break;
//                     case 3:
//                         // consultamos que es lo que hay
//                         rptReturn = consultar_platos_que_hay()
//                         chatGpt.setRowConversationLog(`mesero=${rptReturn}`)
//                         break;
//                     case 4:                        
//                         isWaitConfirmar = true
//                         const _nomPlatosEncontrados = platosEcontrados.map(item => `${item.cantidad_seleccionada} ${item.des}`)
//                         rptReturn = `Confirme, esto es lo que entendi:\n${_nomPlatosEncontrados.join('\n').toLowerCase().trim()}\n\nEscriba *CONFIRMAR* para continuar.`
//                         chatGpt.setRowConversationLog(`mesero=escriba confirmar, para enviar su pedido. O desea agregar algo mas?`)
//                         // return await fallBack(rptReturn);
//                         break;
//                 }

//                 // await delay(4000)
//                 return await fallBack(rptReturn);


//                 // pasamos al flow de confirmacion
//             }
//             ///, [flowConfirmaPedido(infoPedido)]
//         )





//     function adjuntarCarta(sock, jid) {
//         _listCartasActivas.forEach(async (carta) => {
//             await sock.sendMessage(jid, {
//                 caption: capitalize(carta.descripcion),
//                 image: { url: `${url_img_carta}${carta.url_carta}` }
//             })
//         })
//     }

//     // consultar plato
//     function consultar_plato(plato: string) {
//         let rptConsulta = ''
//         const platoConsular = `0-${plato}`

//         const itemsCarta = cartaEstablecimiento.carta.flatMap(item => item.secciones.flatMap(seccion => seccion.items)) || [];
//         let platoEncontrado = consultarPlato(itemsCarta, platoConsular)

//         if (platoEncontrado) {
//             // informamos al cliente que si tenemos disponible este plato
//             const stock = platoEncontrado.cantidad === 'ND' ? 100 : parseFloat(platoEncontrado.cantidad)
//             const stockDisponible = stock > 0
//             if (stockDisponible) {
//                 const strStock = stock > 10 ? 'tenemos disponible' : `aún nos quedan disponible ${stock}`
//                 rptConsulta = `Si, ${strStock} ${platoEncontrado.des.toLowerCase()}`
//             } else {
//                 rptConsulta = `No, ya no tenemos disponible ${platoEncontrado.des.toLowerCase()}`
//             }
//         } else {
//             // informamos al cliente que no tenemos disponible este plato
//             rptConsulta = `No, no tenemos disponible ${plato}`
//         }

//         return rptConsulta;
//     }

//     // consultar lo que hay
//     function consultar_platos_que_hay() {
//         const itemsCarta = cartaEstablecimiento.carta.flatMap(item => item.secciones.flatMap(seccion => seccion.items)) || [];
//         const listSeccionMasPedida = infoSede.getSeccionMasItems()
//         const idSeccionMasPedida = listSeccionMasPedida[0]
//         const rptPlatosHay = consularLoQueHay(itemsCarta, idSeccionMasPedida)
//         if (rptPlatosHay.length > 0) {
//             return `Tenemos disponible:\n${rptPlatosHay.join('\n')}\n\n¿Desea que le adjunte la carta?`
//         }
//     }

//     // evaluar que todo lo que pide exista
//     async function getDisponibilidad(listPedidoCliente) {
//         const itemsCarta = cartaEstablecimiento.carta.flatMap(item => item.secciones.flatMap(seccion => seccion.items)) || [];

//         [platosEcontrados, platosNoEcontrados, platosSinStock, platosRecomendados] = buscarCoincidencias(itemsCarta, listPedidoCliente)

//         // console.log('encontrados', platosEcontrados);
//         // console.log('noEncontrados', platosNoEcontrados);
//         // console.log('cantidadesMayores', platosSinStock);  

//         const seccionesPlatosElegidos = insertarPlatosEnSeccion(cartaEstablecimiento.carta, platosEcontrados);
//         infoPedido.setPedidoCliente(seccionesPlatosElegidos);
//         // pedidoValidadoCliente = platosEcontrados; 

//         // vamos a evaluar y devolver una respuesta
//         let rpt = ''
//         if (platosSinStock.length > 0) {
//             const resumenPlatosSinStock = platosSinStock.map(item => `${item.cantidad} ${item.des}`)
//             rpt += `No tenemos la cantidad solicitada, solo tenemos:\n*${resumenPlatosSinStock.join(', ')}*\n\n`
//             if (platosRecomendados.length > 0) {
//                 rpt += `Pero tenemos disponible:\n${platosRecomendados.join('\n')}`
//             }
//         }

//         if (platosNoEcontrados.length > 0) {
//             rpt += `No encontré los siguientes platos:\n*${platosNoEcontrados.join('\n')}*\n\nPor favor, verifique la ortografía y vuelva a escribirlo.`
//         }


//         return rpt
//     }
// }

