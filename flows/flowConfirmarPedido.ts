// import { addKeyword, EVENTS } from "@bot-whatsapp/bot";
// import { ChatGPT } from "../clases/chatGpt5";
// import { ClassCliente } from "../clases/cliente";
// import { ClassInformacionPedido } from "../clases/info.pedido.class";
// import { capitalize, delay, handlerAI, obtenerClavesSinDatos } from "../services/utiles";
// import { getClienteByCelular } from "../controllers/api.restobar";
// import { PROMPTS } from "../prompts/prompts";
// import { ClassEstructuraPedido } from "../clases/estructura.pedido.class";
// import { GeolocationServices } from "../services/geolocation.service";


// // entra en accion cuando el cliente confirma el pedido
// export const flowConfirmaPedido = (infoPedido: ClassInformacionPedido) => {
//     let infoCliente: ClassCliente = infoPedido.getCliente();
//     let listCanalesConsumo = infoPedido.getlistCanalConsumo()
//     let listTipoPago = infoPedido.getlistTipoPago()
//     const infoSede = infoPedido.getSede()
//     let tileAddAnswerDatosfaltantes = ''
//     let datosFaltantes = []
//     let canalConsumoSeleted = null
//     let datosRecopiladosDelCliente: any = {}
//     let keyDatoFalta = ''

//     // configuramos el chatgpt
//     let chatGptConfirmaPedido: ChatGPT // = new ChatGPT('asistente', 'cliente')
//     // let chatGptConfirmaPedido = new ChatGPT('asistente', 'cliente')
//     let isRecopilandoDatos = false
//     let isClienteConfirmaDireccion = false
//     let isClienteEligeListDireccion = false
//     let isCuantoPagara = false
//     let tipoPagoSeleted: any = {}
//     let pedidoEnviar = new ClassEstructuraPedido()
//     const geolocationServices = new GeolocationServices()
//     let isCanalDelivery = false;
//     let isCanalReserva = false;
//     let preguntaSiDeseaCubiertos = false
//     let _totalPagarMsj = ''
//     let preguntaSiEstaConformeOk = false
//     let _listDireccionesShow: any;
//     let _listDirecciones: any

//     // ordenar los canales de consumo por el nombre en orden alfabetico
//     listCanalesConsumo = listCanalesConsumo.sort((a, b) => a.descripcion.localeCompare(b.descripcion));

//     listCanalesConsumo = listCanalesConsumo.map((item: any, index) => {
//         const _idShow = index + 1
//         item.idshow = _idShow
//         item.titulo = item.descripcion
//         if (item.descripcion.toLowerCase() === 'para llevar') {
//             item.titulo = 'Recoger'
//             // item.descripcion = 'Recoger en Tienda'
//         }
//         return item
//     })


//     const _listShowCanalConsumo = listCanalesConsumo.map((item: any) => {
//         const _icon = item.idshow === 1 ? '🛵' : item.idshow === 2 ? '👜' : '🕜'
//         return `*${item.idshow}* Para ${capitalize(item.titulo)} ${_icon}`
//     })

//     const _listTipoPago = listTipoPago.map((item: any, index) => {
//         const _idShow = index + 1
//         item.idshow = _idShow
//         return `*${item.idshow}* Para ${capitalize(item.descripcion)}`
//     })

//     // costo de entrega
//     let subtotalCostoEntrega: any

//     // si comparte ubicacion
//     // addKeyword(EVENTS.LOCATION).addAction(
//     //     async (ctx, fallBack) => {
//     //         if (isCanalDelivery) {
//     //             console.log('🤖 pruebaLocation', ctx);
//     //             const coordenadasCliente = `${ctx.message.locationMessage.degreesLatitude}, ${ctx.message.locationMessage.degreesLongitude}`
//     //             return await validarDireccion(coordenadasCliente, fallBack);
//     //         }
//     //     }
//     // )


//     return addKeyword(['confirmar', 'confirmo', 'confirmado', 'confirma', 'confirm', EVENTS.LOCATION, EVENTS.VOICE_NOTE])
//         .addAction(
//             async () => {
//                 // reset de variables            

//                 datosRecopiladosDelCliente = {}
//                 isClienteEligeListDireccion = false
//                 isClienteConfirmaDireccion = false
//                 isRecopilandoDatos = false
//                 isCuantoPagara = false
//                 preguntaSiDeseaCubiertos = false
//                 preguntaSiEstaConformeOk = false
//                 isCanalDelivery = false;
//                 isCanalReserva = false;

//                 console.log('datosRecopiladosDelCliente 88', datosRecopiladosDelCliente);
//                 try {
//                     chatGptConfirmaPedido.clearConversationLog()
//                 } catch (error) {

//                 }
//             }
//         )
//         .addAnswer([
//             `Ahora, seleccione el canal, escriba:`,
//             `${_listShowCanalConsumo.join('\n')}`,
//         ],
//             { capture: true },
//             async (ctx, { endFlow, flowDynamic, provider, fallBack }) => {

//                 // escribiendo
//                 const jid = ctx.key.remoteJid
//                 const sock = await provider.getInstance(jid)
//                 await sock.presenceSubscribe(jid)
//                 await sock.sendPresenceUpdate('composing', jid)

//                 // enviamos la respuesta del usuario
//                 let userResponse = ctx.body.toLowerCase().trim()


//                 // si es mensaje de voz
//                 if (userResponse.includes('event_voice')) {
//                     await flowDynamic("dame un momento para escucharte...🙉");
//                     console.log("🤖 voz a texto....");
//                     const text = await handlerAI(ctx);
//                     console.log(`🤖 Fin voz a texto....[TEXT]: ${text}`);
//                     userResponse = text
//                 }

//                 if (preguntaSiEstaConformeOk) {
//                     if (userResponse.includes('ok')) {
//                         enviarPedido()

//                         try {
//                             chatGptConfirmaPedido.clearConversationLog()
//                         } catch (error) {
//                         }

//                         return await endFlow('Listo 🤙 *Pedido confirmado*') // enviar pedido
//                     }
//                 }

//                 // recolectando datos del cliente
//                 if (isRecopilandoDatos) {

//                     if (infoPedido.getIsDelivery()) {

//                         if (isClienteConfirmaDireccion) {
//                             if (userResponse.includes('si')) {
//                                 const _direccion = infoCliente.getDirecciones()[0]
//                                 await setearDireccionSeleccionada(_direccion, true)
//                                 console.log('ingresa aca verificarDatosFaltantesDelCliente 139');
//                                 return await verificarDatosFaltantesDelCliente(fallBack, flowDynamic)
//                             }
//                         }

//                         if (isClienteEligeListDireccion) {
//                             // obtenemos la direccion que eligio el cliente segun el idshow de la lista _listDireccionesShow
//                             const _idShowDireccionElegido = userResponse
//                             // console.log('_listDirecciones', _listDirecciones);
//                             const _direccionElegida = _listDirecciones.find((item: any) => item.idshow === parseInt(_idShowDireccionElegido))
//                             // console.log('_direccionElegida', _direccionElegida);
//                             if (_direccionElegida) {
//                                 await setearDireccionSeleccionada(_direccionElegida, true)
//                                 console.log('ingresa aca verificarDatosFaltantesDelCliente 152');
//                                 return await verificarDatosFaltantesDelCliente(fallBack, flowDynamic)
//                             }


//                         }

//                         // si envia su localizacion                  
//                         if (userResponse.includes('_event_location')) {
//                             const coordenadasCliente = `${ctx.message.locationMessage.degreesLatitude}, ${ctx.message.locationMessage.degreesLongitude}`
//                             const rptCoordenadas = await getDireccionFromCoordenadas(coordenadasCliente);
//                             if (rptCoordenadas) {
//                                 // seteo la direccion del cliente
//                                 await setearDireccionSeleccionada(rptCoordenadas);
//                                 console.log('llama desde aca verificarDatosFaltantesDelCliente 166');
//                                 return await verificarDatosFaltantesDelCliente(fallBack, flowDynamic)

//                             }
//                         }
//                     }


//                     let modelResponse = await chatGptConfirmaPedido.sendMessage(userResponse)
//                     // console.log('modelResponse', modelResponse);



//                     // si obtiene ya la respuesta con todos los datos
//                     const isRptJson = modelResponse.includes('respuesta=')
//                     if (!isRptJson) {
//                         return await fallBack(modelResponse);
//                     } else {
//                         datosRecopiladosDelCliente = modelResponse.split('respuesta=')[1]
//                         console.log('respuesta completa = ', datosRecopiladosDelCliente);
//                         datosRecopiladosDelCliente = JSON.parse(datosRecopiladosDelCliente)

//                         // if (infoPedido.getIsDelivery()) {
//                         //     await setearDireccionSeleccionada(datosRecopiladosDelCliente);
//                         // }
//                         // infoCliente.setDireccionSelected(datosRecopiladosDelCliente.direccion)
//                         // infoCliente.setReferenciaDireccion(datosRecopiladosDelCliente.referencia_de_la_direccion)

//                         infoCliente.setNombrePila(datosRecopiladosDelCliente.nombre)
//                         infoCliente.setNombre(datosRecopiladosDelCliente.nombre)
//                         infoCliente.setCelular(datosRecopiladosDelCliente.telefono)
//                         infoPedido.setCliente(infoCliente)

//                         isCanalDelivery = infoPedido.getIsDelivery();
//                         isCanalReserva = infoPedido.getIsReserva();

//                         if (isCanalReserva) {
//                             infoCliente.setNumPersonas(datosRecopiladosDelCliente.numero_de_personas)
//                             infoCliente.setHoraLlegada(datosRecopiladosDelCliente.hora_llegada)
//                         }


//                         // validamos direccion
//                         if (isCanalDelivery) {

//                             await setearDireccionSeleccionada(datosRecopiladosDelCliente);

//                             const _confgDelivery = infoPedido.getConfigDelivery()
//                             // console.log('datosRecopiladosDelCliente.direccion --1', datosRecopiladosDelCliente);
//                             let direccionClienteSeletedCoordenadas = await <any>geolocationServices.getCoordenadas(datosRecopiladosDelCliente.direccion, _confgDelivery.ciudades)
//                             // console.log('direccionClienteSeletedCoordenadas', direccionClienteSeletedCoordenadas);

//                             if (!direccionClienteSeletedCoordenadas) {
//                                 const _rptMsj = 'No pude encontrar la direccion en el mapa, escriba por favor una direccion válida.'
//                                 chatGptConfirmaPedido.setRowConversationLog(`asisente=${_rptMsj}`)
//                                 return await fallBack(_rptMsj)
//                             }

//                             // seteamos la direccion geolocalizada
//                             direccionClienteSeletedCoordenadas.referencia = datosRecopiladosDelCliente.referencia_de_la_direccion
//                             infoPedido.setDireccionGeolocalizada(direccionClienteSeletedCoordenadas)


//                             const coordenadas_origen = `${infoSede.latitude}, ${infoSede.longitude}`
//                             const coordenadas_destino = `${direccionClienteSeletedCoordenadas.latitude}, ${direccionClienteSeletedCoordenadas.longitude}`
//                             subtotalCostoEntrega = await geolocationServices.calcularSubtotaCostoEntrega(coordenadas_origen, coordenadas_destino, _confgDelivery.parametros)
//                             // console.log('subtotalCostoEntrega ============= ', subtotalCostoEntrega);
//                             if (subtotalCostoEntrega.success) {
//                                 infoPedido.setSubtotalCostoEntrega(subtotalCostoEntrega)
//                             } else {
//                                 chatGptConfirmaPedido.setRowConversationLog(`asisente=${subtotalCostoEntrega.mensaje}`)
//                                 return await fallBack(subtotalCostoEntrega.mensaje)
//                             }

//                         }

//                         // enviamos el total a pagar
//                         return await pasarFlowSegunCanalConsumo(fallBack, flowDynamic)
//                     }

//                 }

//                 const _idCanalConsumo = ctx.body.toLowerCase().trim()
//                 canalConsumoSeleted = listCanalesConsumo.find((item: any) => item.idshow === parseInt(_idCanalConsumo))


//                 if (!canalConsumoSeleted) {
//                     return fallBack('Escriba un numero valido, para seleccionar el canal de consumo')
//                 }

//                 // solicitar datos segun canal de consumo
//                 datosRecopiladosDelCliente = datosSolicitarSegunCanal(canalConsumoSeleted.idshow)
//                 console.log('datosRecopiladosDelCliente --- 250', datosRecopiladosDelCliente);
//                 datosRecopiladosDelCliente.telefono = infoCliente.getCelular()
//                 datosRecopiladosDelCliente.nombre = infoCliente.getNombrePila()

//                 // console.log('datosRecopiladosDelCliente', datosRecopiladosDelCliente);

//                 canalConsumoSeleted.secciones = infoPedido.getPedidoCliente();
//                 pedidoEnviar.setTipoConsumo(canalConsumoSeleted)
//                 setTipoCanalConsumoSeleted(canalConsumoSeleted)

//                 console.log('datosRecopiladosDelCliente --- 260', datosRecopiladosDelCliente);
//                 datosFaltantes = obtenerClavesSinDatos(datosRecopiladosDelCliente)

//                 console.log('datosFaltantes -263', datosFaltantes);



//                 // si faltan datos por recopilar
//                 if (datosFaltantes.length > 0) {
//                     // informar al cliente los datos que faltan
//                     tileAddAnswerDatosfaltantes = `📝 Para *${capitalize(canalConsumoSeleted.descripcion)}* necesitamos los siguientes datos:\n*${datosFaltantes.join(',')}*`

//                     // enviamos el prompt
//                     let _prompt = PROMPTS.rolRecopiladorDatos
//                     _prompt = _prompt.replace('{lista}', JSON.stringify(datosRecopiladosDelCliente))
//                     // canal de consumo
//                     _prompt = _prompt.replace('{canal_consumo}', canalConsumoSeleted.descripcion)

//                     chatGptConfirmaPedido = new ChatGPT('asistente', 'cliente')
//                     const _rptChatGpt = await chatGptConfirmaPedido.sendPrompt(_prompt)
//                     chatGptConfirmaPedido.setRowConversationLog(`asistente=escriba los siguientes datos: ${datosFaltantes.join(', ')}.`)
//                     // console.log('_rptChatGpt', _rptChatGpt);

//                     isRecopilandoDatos = true;


//                     // si es delivery verifica si ya tiene una direccion registrada
//                     if (infoPedido.getIsDelivery()) {
//                         if (infoCliente.getIsDireccionRegistrada()) {
//                             // si hay varias direcciones debe seleccionar una, y si solo hay una debe confirmarla

//                             _listDirecciones = infoCliente.getDirecciones()
//                             // console.log('_listDirecciones', _listDirecciones);
//                             if (_listDirecciones.length > 1) {
//                                 // si hay varias direcciones debe seleccionar una
//                                 _listDirecciones = _listDirecciones.map((item: any, index) => {
//                                     const _idShow = index + 1
//                                     item.idshow = _idShow
//                                     return item
//                                 })

//                                 _listDireccionesShow = _listDirecciones.map((item: any, index) => {
//                                     const _idShow = item.idshow
//                                     const _nomDireccion = item.direccion.includes(',') ? item.direccion.split(',')[0] : item.direccion
//                                     return `*${_idShow}* ${_nomDireccion}`
//                                 })


//                                 // le ofrecemos seleccionar una opcion
//                                 tileAddAnswerDatosfaltantes = `Tenemos registrado las siguientes direcciones:\n${_listDireccionesShow.join('\n')}\n\nEscriba el numero de la direccion que desea seleccionar.`
//                                 isClienteEligeListDireccion = true;

//                             } else {
//                                 // si solo hay una debe confirmarla
//                                 _listDireccionesShow = _listDirecciones[0]
//                                 tileAddAnswerDatosfaltantes = `Tenemos registrado la siguiente direccion:\n*${_listDireccionesShow.direccion.split(',')[0]}*\n\nSe la enviamos a esta direccion? escriba: *si* o *no*`
//                                 isClienteConfirmaDireccion = true;
//                             }

//                             chatGptConfirmaPedido.setRowConversationLog(`asistente=${tileAddAnswerDatosfaltantes}`)
//                         }
//                     }

//                     delay(1000)
//                     return await fallBack(tileAddAnswerDatosfaltantes)
//                 } else {
//                     // // si no faltan datos
//                     // enviamos el total a pagar
//                     return await pasarFlowSegunCanalConsumo(fallBack, flowDynamic)
//                 }


//             }
//         )
//         .addAnswer([
//             `Ahora seleccione como desea pagar, escriba:`,
//             `${_listTipoPago.join('\n')}`
//         ]
//             , { capture: true }
//             , async (ctx, { endFlow, flowDynamic, provider, fallBack, gotoFlow }) => {
//                 let userResponse = ctx.body.toLowerCase().trim()


//                 // si es mensaje de voz
//                 if (userResponse.includes('event_voice')) {
//                     await flowDynamic("dame un momento para escucharte...🙉");
//                     console.log("🤖 voz a texto....");
//                     const text = await handlerAI(ctx);
//                     console.log(`🤖 Fin voz a texto....[TEXT]: ${text}`);
//                     userResponse = text
//                 }

//                 if (preguntaSiDeseaCubiertos) {
//                     preguntaSiDeseaCubiertos = userResponse.toLowerCase().includes('si') ? true : false
//                     infoPedido.setSolicitaCubiertos(preguntaSiDeseaCubiertos)

//                     enviarPedido()

//                     try {
//                         chatGptConfirmaPedido.clearConversationLog()
//                     } catch (error) {
//                     }

//                     return await endFlow('Listo 🤙 *Pedido confirmado*') // enviar pedido
//                 }


//                 if (isCuantoPagara) {
//                     tipoPagoSeleted.descripcion = `${tipoPagoSeleted.descripcion} ${userResponse}`

//                     // pregunta si desea cubiertos
//                     if (infoPedido.getIsDelivery()) {
//                         preguntaSiDeseaCubiertos = true
//                         return await fallBack('¿Desea cubiertos?')
//                     } else {
//                         enviarPedido()
//                         return endFlow('Listo 🤙 *Pedido confirmado*') // enviar pedido
//                     }
//                 }

//                 const _idTipoPago = ctx.body.toLowerCase().trim()
//                 tipoPagoSeleted = listTipoPago.find((item: any) => item.idshow === parseInt(_idTipoPago))
//                 // console.log('_tipoPago', tipoPagoSeleted);

//                 if (!tipoPagoSeleted) {
//                     return fallBack('Escriba un numero valido, para seleccionar el tipo de pago')
//                 }

//                 infoPedido.setMetodoPagoSeleted(tipoPagoSeleted)

//                 if (_idTipoPago === '1') {
//                     isCuantoPagara = true;
//                     return fallBack('💵 Con cuanto pagara?')
//                 }

//                 isCuantoPagara = false;

//                 // pregunta si desea cubiertos
//                 if (infoPedido.getIsDelivery()) {
//                     preguntaSiDeseaCubiertos = true
//                     return await fallBack('¿Desea cubiertos?')

//                 } else {
//                     enviarPedido()
//                     return endFlow('Listo 🤙 *Pedido confirmado*') // enviar pedido
//                 }

//             }
//         )



//     // solicitar datos al cliente segun el canal de consumo
//     function datosSolicitarSegunCanal(idshow) {
//         datosRecopiladosDelCliente = {}
//         const _datosCliente = [
//             { //delivery                 
//                 "nombre": "",
//                 "direccion": "",
//                 "referencia_de_la_direccion": "",
//                 "telefono": ""
//             },
//             { // para llevar
//                 "nombre": "",
//                 "telefono": ""
//             },
//             {// reservas
//                 "nombre": "",
//                 "telefono": "",
//                 "hora_llegada": "",
//                 "numero_de_personas": "",
//             }
//         ]

//         return _datosCliente[idshow - 1]

//     }

//     function obtenerTotalPagar() {
//         const totalPagar = armarPedido()
//         return `El costo total del pedido es: *S/.${totalPagar}*`
//     }

//     // aca mandamos a armar la estructura del pedido
//     function armarPedido() {
//         return pedidoEnviar.armarPedido(infoPedido, infoCliente)
//     }

//     function enviarPedido() {
//         pedidoEnviar.armarPedido(infoPedido, infoCliente)
//         pedidoEnviar.enviarPedido(infoPedido)

//         try {
//             chatGptConfirmaPedido.clearConversationLog()
//         } catch (error) {
//         }
//     }

//     function setTipoCanalConsumoSeleted(canalConsumoSeleted: any) {
//         // segun el idshow del canal de consumo seleccionado
//         switch (canalConsumoSeleted.idshow) {
//             case 1: // delivery
//                 infoPedido.setIsDelivery(true)
//                 break;
//             case 2: // para llevar
//                 infoPedido.setIsRecogeLocal(true)
//                 break;
//             case 3: // reservas
//                 infoPedido.setIsReserva(true)
//                 break;
//         }

//         infoPedido.setCanalConsumoSeleted(canalConsumoSeleted)
//     }

//     function rptFinalSegunCanalConsumo(costoPedido: string) {
//         // si es para llevar
//         if (infoPedido.getIsRecogeLocal()) {
//             let tiempoRecoger = infoSede.pwa_min_despacho
//             tiempoRecoger = tiempoRecoger >= 8 ? tiempoRecoger : tiempoRecoger * 2
//             return `${costoPedido}\n*Nota:* El pedido estará listo en aproximadamente ${tiempoRecoger} minutos.\n\nSi esta de acuerdo responda *Ok* para enviar su pedido.`
//         }

//         // si es reservar
//         if (infoPedido.getIsReserva()) {
//             const mensajeReserva = `*Nota:* Si por algún motivo no llega en el tiempo que indico, el local *no* estará en la obligación de mantener su reserva y tampoco colocar su pedido primero en la cola.`
//             return `${mensajeReserva}\n${costoPedido}\n\nSi esta de acuerdo responda *Ok* para enviar su pedido.`
//         }


//     }

//     async function pasarFlowSegunCanalConsumo(fallBack, flowDynamic) {

//         _totalPagarMsj = obtenerTotalPagar()

//         if (infoPedido.getIsDelivery()) {
//             return await flowDynamic(_totalPagarMsj)
//         }

//         if (infoPedido.getIsRecogeLocal() || infoPedido.getIsReserva()) {
//             preguntaSiEstaConformeOk = true
//             const _rptFinal = rptFinalSegunCanalConsumo(_totalPagarMsj)
//             return await fallBack(_rptFinal)
//         }

//     }

//     async function validarDireccion(direccionOCoordenadasCliente: any) {
//         const _confgDelivery = infoPedido.getConfigDelivery()
//         let direccionClienteSeletedCoordenadas: any = {}
//         let msjReturn = ''

//         // verificamos si direccionOCoordenadasCliente ya viene con las coordenadas
//         // console.log('direccionOCoordenadasCliente', direccionOCoordenadasCliente);
//         if (direccionOCoordenadasCliente.latitude) {
//             direccionClienteSeletedCoordenadas = {
//                 latitude: direccionOCoordenadasCliente.latitude,
//                 longitude: direccionOCoordenadasCliente.longitude
//             }
//         } else {
//             const geolocationServices = new GeolocationServices()
//             // console.log('direccionOCoordenadasCliente --2', direccionOCoordenadasCliente);
//             direccionClienteSeletedCoordenadas = await <any>geolocationServices.getCoordenadas(direccionOCoordenadasCliente.direccion, _confgDelivery.ciudades)
//         }


//         // console.log('direccionOCoordenadasCliente', direccionOCoordenadasCliente);
//         if (!direccionClienteSeletedCoordenadas) {
//             const _rptMsj = 'No pude encontrar la direccion en el mapa, escriba por favor una direccion válida.'
//             chatGptConfirmaPedido.setRowConversationLog(`asisente=${_rptMsj}`)
//             // return await fallBack(_rptMsj)
//             msjReturn = _rptMsj
//         }


//         // seteamos en la info del pedido
//         direccionClienteSeletedCoordenadas.referencia = datosRecopiladosDelCliente.referencia_de_la_direccion
//         infoPedido.setDireccionGeolocalizada(direccionClienteSeletedCoordenadas)

//         const coordenadas_origen = `${infoSede.latitude}, ${infoSede.longitude}`
//         const coordenadas_destino = `${direccionClienteSeletedCoordenadas.latitude}, ${direccionClienteSeletedCoordenadas.longitude}`
//         subtotalCostoEntrega = await geolocationServices.calcularSubtotaCostoEntrega(coordenadas_origen, coordenadas_destino, _confgDelivery.parametros)
//         if (subtotalCostoEntrega.success) {
//             infoPedido.setSubtotalCostoEntrega(subtotalCostoEntrega)
//             msjReturn = 'ok'
//         } else {
//             chatGptConfirmaPedido.setRowConversationLog(`asisente=${subtotalCostoEntrega.mensaje}`)
//             msjReturn = subtotalCostoEntrega.mensaje
//             // return await fallBack(subtotalCostoEntrega.mensaje)
//         }

//         return msjReturn;
//     }

//     async function getDireccionFromCoordenadas(coordenadas: string) {
//         // const geolocationServices = new GeolocationServices()
//         // console.log('coordenadas -- 3', coordenadas);
//         const direccionClienteSeletedCoordenadas = await <any>geolocationServices.getCoordenadas(coordenadas, infoPedido.getConfigDelivery().ciudades)
//         return direccionClienteSeletedCoordenadas
//     }

//     // se espera {direccion, referencia}
//     async function setearDireccionSeleccionada(datosRecopilados: any, isDireccionRegistrada = false) {
//         // console.log('direccionElegida -- ', datosRecopilados);
//         let direccionSelected = isDireccionRegistrada ? datosRecopilados.direccion : datosRecopilados
//         let referenciaDireccionSelected = datosRecopilados.referencia
//         // const direccionElegida = direccionSelected.direccion
//         // console.log('direccionSelected -- ', direccionSelected);

//         if (isDireccionRegistrada) {
//             // buscamos la direccion seleccionada en la lista de direcciones
//             const listDirecciones: any = infoCliente.getDirecciones();
//             const direccionSelectedBuscar = direccionSelected.split(',')[0].toLowerCase().trim()
//             const _direccion = listDirecciones.find(item => item.direccion.toLowerCase().includes(direccionSelectedBuscar))
//             // console.log('_direccion', _direccion);
//             if (_direccion) {
//                 infoCliente.setIdClientePwaDireccion(_direccion.idcliente_pwa_direccion)
//                 referenciaDireccionSelected = _direccion.referencia
//                 direccionSelected = _direccion

//                 chatGptConfirmaPedido.setRowConversationLog(`cliente=mi direccion es: ${direccionSelected.direccion}.`)
//                 chatGptConfirmaPedido.setRowConversationLog(`cliente=la referencia de la direccion es: ${referenciaDireccionSelected}.`)
//             }
//         }

//         datosRecopiladosDelCliente.direccion = direccionSelected.direccion
//         datosRecopiladosDelCliente.referencia_de_la_direccion = referenciaDireccionSelected

//         infoCliente.setDireccionSelected(direccionSelected)
//         infoCliente.setReferenciaDireccion(referenciaDireccionSelected)
//         infoPedido.setCliente(infoCliente)

//         return true
//         // chatGptConfirmaPedido.setRowConversationLog(`cliente=mi direccion es: ${datosRecopiladosDelCliente.direccion}.`)
//         // if (datosRecopiladosDelCliente.referencia_de_la_direccion !== '' ) {
//         //     chatGptConfirmaPedido.setRowConversationLog(`cliente=la referencia de la direccion es: ${datosRecopiladosDelCliente.referencia_de_la_direccion}.`)  
//         // }
//     }

//     async function verificarDatosFaltantesDelCliente(fallBack, flowDynamic) {
//         console.log('datosRecopiladosDelCliente - ', datosRecopiladosDelCliente);
//         datosFaltantes = obtenerClavesSinDatos(datosRecopiladosDelCliente)
//         console.log('datosFaltantes', datosFaltantes);
//         if (datosFaltantes.length > 0) {
//             chatGptConfirmaPedido.setRowConversationLog(`asistente=escriba los siguientes datos: ${datosFaltantes.join(', ')}.`)
//             return await fallBack(`Datos faltantes: ${datosFaltantes.join(', ')}.`)
//         } else {
//             // enviamos el total a pagar
//             // antes de pasar debo verificar la direccion si es delivery
//             if (infoPedido.getIsDelivery()) {
//                 const _direccion = infoCliente.getDireccionSelected()
//                 const _rptDireccion = await validarDireccion(_direccion)
//                 if (_rptDireccion === 'ok') {
//                     return await pasarFlowSegunCanalConsumo(fallBack, flowDynamic)
//                 } else {
//                     return await fallBack(_rptDireccion)
//                 }
//             }

//             return await pasarFlowSegunCanalConsumo(fallBack, flowDynamic)
//         }
//     }


// }