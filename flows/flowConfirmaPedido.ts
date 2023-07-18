import { addKeyword, EVENTS } from "@bot-whatsapp/bot";
import { ChatGPT } from "../clases/chatGpt5";
import { ClassCliente } from "../clases/cliente";
import { ClassInformacionPedido } from "../clases/info.pedido.class";
import { capitalize, delay, handlerAI, obtenerClavesSinDatos } from "../services/utiles";
import { getClienteByCelular } from "../controllers/api.restobar";
import { PROMPTS } from "../prompts/prompts";
import { ClassEstructuraPedido } from "../clases/estructura.pedido.class";
import { GeolocationServices } from "../services/geolocation.service";
import { ClassInfoSede } from "../clases/sede";
import { SqliteDatabase } from "../services/sqlite.services";
import { flowInstrucciones } from "./flowInstrucciones";
import { flowPedido } from "./flowPedido";


// entra en accion cuando el cliente confirma el pedido
export const flowConfirmaPedido = (infoSede: ClassInfoSede, database: SqliteDatabase) => {
    let _infoSede = infoSede.getSede()
    let listCanalesConsumo = infoSede.getlistCanalConsumo()
    let listTipoPago = infoSede.getlistTipoPago()
    
    
    const geolocationServices = new GeolocationServices()
    // let _listDireccionesShow: any;
    // let _listDirecciones: any

    // ordenar los canales de consumo por el nombre en orden alfabetico
    listCanalesConsumo = listCanalesConsumo.sort((a, b) => a.descripcion.localeCompare(b.descripcion));

    listCanalesConsumo = listCanalesConsumo.map((item: any, index) => {
        const _idShow = index + 1
        item.idshow = _idShow
        item.titulo = item.descripcion
        if (item.descripcion.toLowerCase() === 'para llevar') {
            item.titulo = 'Recoger'
            // item.descripcion = 'Recoger en Tienda'
        }
        return item
    })   
    

    const _listShowCanalConsumo = listCanalesConsumo.map((item: any) => {        
        const _icon = item.idshow === 1 ? '🛵' : item.idshow === 2 ? '👜' : '🕜'
        return `*${item.idshow}* Para ${capitalize(item.titulo)} ${_icon}`
    })

    const _listTipoPago = listTipoPago.map((item: any, index) => {
        const _idShow = index + 1
        item.idshow = _idShow
        return `*${item.idshow}* Para ${capitalize(item.descripcion)}`
    })


    return addKeyword(['confirmar', 'confirmo', 'confirmado', 'confirma', 'confirm', EVENTS.LOCATION, EVENTS.VOICE_NOTE])    
    .addAction(
        async (ctx, {gotoFlow}) => {            
            // chequeamos si el cliente hizo su pedido
            let infoPedido = new ClassInformacionPedido()
            infoPedido = await database.getInfoPedido(ctx.from)

            if ( !infoPedido.getIsHasPedidoCliente() ) {
                return await gotoFlow(flowPedido(infoSede, database))
            }

        }
    )
    .addAnswer([
        `Ahora, seleccione el canal, escriba:`,
        `${_listShowCanalConsumo.join('\n')}`,    
        ],
        {capture: true},
        async (ctx, { endFlow, flowDynamic, provider, fallBack }) => {

            let infoPedido = new ClassInformacionPedido()
            infoPedido = await database.getInfoPedido(ctx.from)
            // get variables
            let infoFlowConfirma = infoPedido.getVariablesFlowConfirmarPedido()
            
            const _infoCliente = infoPedido.getCliente();            
            let infoCliente = new ClassCliente()
            infoCliente.setCliente(_infoCliente)               
            // infoPedido.setSede(infoSede)

            // escribiendo
            const jid = ctx.key.remoteJid
            const sock = await provider.getInstance(jid)
            await sock.presenceSubscribe(jid)
            await sock.sendPresenceUpdate('composing', jid)

            // enviamos la respuesta del usuario
            let userResponse = ctx.body.toLowerCase().trim()

            // get instacia chatgpt
            // let chatGptConfirmaPedido = infoPedido.getInstanceChatGpt()
            let chatGptConfirmaPedido = new ChatGPT('asistente', 'cliente', infoPedido)
            
            // si es mensaje de voz
            if (userResponse.includes('event_voice')) {
                await flowDynamic("dame un momento para escucharte...🙉");
                console.log("🤖 voz a texto....");
                const text = await handlerAI(ctx);
                console.log(`🤖 Fin voz a texto....[TEXT]: ${text}`);
                userResponse = text
            }

            if (infoFlowConfirma.preguntaSiEstaConformeOk) {
                if (userResponse.includes('ok')) {
                    enviarPedido(infoCliente, infoPedido)

                    try {
                        chatGptConfirmaPedido.clearConversationLog()                        
                    } catch (error) {                        
                    }

                    guadarInfoDataBase(infoPedido, infoFlowConfirma, ctx.from)
                    return await endFlow('Listo 🤙 *Pedido confirmado*') // enviar pedido
                }
            }

            // recolectando datos del cliente
            if (infoFlowConfirma.isRecopilandoDatos) {

                if (infoPedido.getIsDelivery()){
                    
                    if (infoFlowConfirma.isClienteConfirmaDireccion) {
                        if (userResponse.includes('si')) {
                            const _direccion = infoCliente.getDirecciones()[0]
                            await setearDireccionSeleccionada(_direccion, infoCliente, infoPedido, infoFlowConfirma, chatGptConfirmaPedido, true)
                            // console.log('ingresa aca verificarDatosFaltantesDelCliente 139');

                            // guadarInfoDataBase(infoPedido, infoFlowConfirma, ctx.from)
                            return await verificarDatosFaltantesDelCliente(fallBack, flowDynamic, infoPedido, infoFlowConfirma, infoCliente, ctx.from, chatGptConfirmaPedido) 
                        }
                    }

                    if ( infoFlowConfirma.isClienteEligeListDireccion ) {                        
                        const _idShowDireccionElegido = userResponse                        
                        const _direccionElegida = infoFlowConfirma._listDirecciones.find((item: any) => item.idshow === parseInt(_idShowDireccionElegido))                           
                        if (_direccionElegida) {
                            await setearDireccionSeleccionada(_direccionElegida, infoCliente, infoPedido, infoFlowConfirma, chatGptConfirmaPedido, true)
                            console.log('ingresa aca verificarDatosFaltantesDelCliente 152');
                            return await verificarDatosFaltantesDelCliente(fallBack, flowDynamic, infoPedido, infoFlowConfirma, infoCliente, ctx.from, chatGptConfirmaPedido)
                        } 


                    }

                    // si envia su localizacion                  
                    if (userResponse.includes('_event_location') ) {
                        const coordenadasCliente = `${ctx.message.locationMessage.degreesLatitude}, ${ctx.message.locationMessage.degreesLongitude}`                    
                        const rptCoordenadas = await getDireccionFromCoordenadas(coordenadasCliente, infoPedido);                    
                        if (rptCoordenadas) {
                            // seteo la direccion del cliente
                            await setearDireccionSeleccionada(rptCoordenadas, infoCliente, infoPedido, infoFlowConfirma, chatGptConfirmaPedido);
                            // console.log('llama desde aca verificarDatosFaltantesDelCliente 166');
                            return await verificarDatosFaltantesDelCliente(fallBack, flowDynamic, infoPedido, infoFlowConfirma, infoCliente, ctx.from, chatGptConfirmaPedido)

                        }
                    }
                }

                
                let modelResponse = await chatGptConfirmaPedido.sendMessage(userResponse)
                // console.log('modelResponse', modelResponse);

                

                // si obtiene ya la respuesta con todos los datos
                const isRptJson = modelResponse.includes('respuesta=')
                if (!isRptJson) {
                    return await fallBack(modelResponse);
                } else {
                    let _datosRecopiladosDelCliente = modelResponse.split('respuesta=')[1]
                    // console.log('respuesta completa = ', _datosRecopiladosDelCliente);
                    const _datosRecopiladosDelClienteJSON = JSON.parse(_datosRecopiladosDelCliente)
                    infoFlowConfirma.datosRecopiladosDelCliente = _datosRecopiladosDelClienteJSON                    

                    infoCliente.setNombrePila(_datosRecopiladosDelClienteJSON.nombre)
                    infoCliente.setNombre(_datosRecopiladosDelClienteJSON.nombre)
                    infoCliente.setCelular(_datosRecopiladosDelClienteJSON.telefono)
                    infoPedido.setCliente(infoCliente)

                    // isCanalDelivery = infoPedido.getIsDelivery();
                    // isCanalReserva = infoPedido.getIsReserva();

                    if (infoPedido.getIsReserva()) {
                        infoCliente.setNumPersonas(_datosRecopiladosDelClienteJSON.numero_de_personas)
                        infoCliente.setHoraLlegada(_datosRecopiladosDelClienteJSON.hora_llegada)
                    }

                    guadarInfoDataBase(infoPedido, infoFlowConfirma, ctx.from)
                                        

                    // validamos direccion
                    if (infoPedido.getIsDelivery()) {
                        
                        await setearDireccionSeleccionada(_datosRecopiladosDelClienteJSON, infoCliente, infoPedido, infoFlowConfirma, chatGptConfirmaPedido);

                        const _confgDelivery = infoPedido.getConfigDelivery()                                                
                        let direccionClienteSeletedCoordenadas = await <any>geolocationServices.getCoordenadas(_datosRecopiladosDelClienteJSON.direccion, _confgDelivery.ciudades)                        

                        if (!direccionClienteSeletedCoordenadas ) {
                            const _rptMsj = 'No pude encontrar la direccion en el mapa, escriba por favor una direccion válida, o envíe su ubicación.'
                            chatGptConfirmaPedido.setRowConversationLog(`asisente=${_rptMsj}`) 
                            
                            guadarInfoDataBase(infoPedido, infoFlowConfirma, ctx.from)
                            return await fallBack(_rptMsj)
                        }
                        
                        // seteamos la direccion geolocalizada
                        direccionClienteSeletedCoordenadas.referencia = _datosRecopiladosDelClienteJSON.referencia_de_la_direccion
                        infoPedido.setDireccionGeolocalizada(direccionClienteSeletedCoordenadas)


                        const coordenadas_origen = `${_infoSede.latitude}, ${_infoSede.longitude}`                        
                        const coordenadas_destino = `${direccionClienteSeletedCoordenadas.latitude}, ${direccionClienteSeletedCoordenadas.longitude}`
                        const subtotalCostoEntrega: any = await geolocationServices.calcularSubtotaCostoEntrega(coordenadas_origen, coordenadas_destino, _confgDelivery.parametros)                        
                        // console.log('subtotalCostoEntrega ============= ', subtotalCostoEntrega);
                        if (subtotalCostoEntrega.success ) {
                            infoPedido.setSubtotalCostoEntrega(subtotalCostoEntrega)
                        } else {
                            chatGptConfirmaPedido.setRowConversationLog(`asisente=${subtotalCostoEntrega.mensaje}`)

                            guadarInfoDataBase(infoPedido, infoFlowConfirma, ctx.from)
                            return await fallBack(subtotalCostoEntrega.mensaje)
                        }

                    }
                    
                    // enviamos el total a pagar
                    return await pasarFlowSegunCanalConsumo(fallBack, flowDynamic, infoCliente, infoPedido, infoFlowConfirma, ctx.from)  
                }  
                
            }

            const _idCanalConsumo = ctx.body.toLowerCase().trim()                        
            let canalConsumoSeleted = listCanalesConsumo.find((item: any) => item.idshow === parseInt(_idCanalConsumo))                        


            if (!canalConsumoSeleted) {
                return fallBack('Escriba un numero valido, para seleccionar el canal de consumo')
            }

            // solicitar datos segun canal de consumo
            let datosRecopiladosDelCliente = datosSolicitarSegunCanal(canalConsumoSeleted.idshow)            
            datosRecopiladosDelCliente.telefono = infoCliente.getCelular()
            datosRecopiladosDelCliente.nombre = infoCliente.getNombrePila()            

            // console.log('datosRecopiladosDelCliente', datosRecopiladosDelCliente);

            canalConsumoSeleted.secciones = infoPedido.getPedidoCliente();
            infoFlowConfirma.canalConsumoSeletedMasSeccion = canalConsumoSeleted
            
            // pedidoEnviar.setTipoConsumo(canalConsumoSeleted) // quitar 
            setTipoCanalConsumoSeleted(canalConsumoSeleted, infoPedido)
                        
            const datosFaltantes = obtenerClavesSinDatos(datosRecopiladosDelCliente)            
            

            let tileAddAnswerDatosfaltantes = ''

            // si faltan datos por recopilar
            if (datosFaltantes.length > 0) {       
                // informar al cliente los datos que faltan
                tileAddAnswerDatosfaltantes = `📝 Para *${capitalize(canalConsumoSeleted.descripcion)}* necesitamos los siguientes datos:\n*${datosFaltantes.join(',')}*`

                // enviamos el prompt
                let _prompt = PROMPTS.rolRecopiladorDatos
                _prompt = _prompt.replace('{lista}', JSON.stringify(datosRecopiladosDelCliente))
                // canal de consumo
                _prompt = _prompt.replace('{canal_consumo}', canalConsumoSeleted.descripcion)

                // chatGptConfirmaPedido = new ChatGPT('asistente', 'cliente', infoPedido)
                // infoPedido.setInstanceChatGpt(chatGptConfirmaPedido)

                // envio el promt
                await chatGptConfirmaPedido.sendPrompt(_prompt)
                chatGptConfirmaPedido.setRowConversationLog(`asistente=escriba los siguientes datos: ${datosFaltantes.join(', ')}.`)

                infoFlowConfirma.isRecopilandoDatos = true;


                // si es delivery verifica si ya tiene una direccion registrada
                if (infoPedido.getIsDelivery()) {
                    if (infoCliente.getIsDireccionRegistrada()) {
                        // si hay varias direcciones debe seleccionar una, y si solo hay una debe confirmarla
                        
                        let _listDireccionesShow: any;
                        let _listDirecciones = infoCliente.getDirecciones()
                        infoFlowConfirma._listDirecciones = _listDirecciones
                        // console.log('_listDirecciones', _listDirecciones);
                        if (_listDirecciones.length > 1) {
                            // si hay varias direcciones debe seleccionar una
                            _listDirecciones = _listDirecciones.map((item: any, index) => {
                                const _idShow = index + 1                                
                                item.idshow = _idShow 
                                return item
                            })

                            infoFlowConfirma._listDirecciones = _listDirecciones

                            _listDireccionesShow = _listDirecciones.map((item: any, index) => {
                                const _idShow = item.idshow
                                const _nomDireccion = item.direccion.includes(',') ? item.direccion.split(',')[0] : item.direccion                                
                                return `*${_idShow}* ${_nomDireccion}`
                            })


                            // le ofrecemos seleccionar una opcion
                            tileAddAnswerDatosfaltantes = `Tenemos registrado las siguientes direcciones:\n${_listDireccionesShow.join('\n')}\n\nEscriba el numero de la direccion que desea seleccionar.`
                            infoFlowConfirma.isClienteEligeListDireccion = true;

                        } else {
                            // si solo hay una debe confirmarla
                            _listDireccionesShow = _listDirecciones[0]
                            tileAddAnswerDatosfaltantes = `Tenemos registrado la siguiente direccion:\n*${_listDireccionesShow.direccion.split(',')[0]}*\n\nSe la enviamos a esta direccion? escriba: *si* o *no*`
                            infoFlowConfirma.isClienteConfirmaDireccion = true;
                        }  
                        
                        chatGptConfirmaPedido.setRowConversationLog(`asistente=${tileAddAnswerDatosfaltantes}`)
                    }
                }

                guadarInfoDataBase(infoPedido, infoFlowConfirma, ctx.from)
                delay(1000)
                return await fallBack(tileAddAnswerDatosfaltantes) 
            } else {
                // // si no faltan datos
                // enviamos el total a pagar
                return await pasarFlowSegunCanalConsumo(fallBack, flowDynamic, infoCliente, infoPedido, infoFlowConfirma, ctx.from)                
            }

                       
        }
    )      
    .addAnswer([
        `Ahora seleccione como desea pagar, escriba:`,
        `${_listTipoPago.join('\n')}`       
        ]
        , { capture: true }
        , async (ctx, { endFlow, flowDynamic, provider, fallBack, gotoFlow }) => {

            let infoPedido = new ClassInformacionPedido()
            infoPedido = await database.getInfoPedido(ctx.from)
            // get variables
            let infoFlowConfirma = infoPedido.getVariablesFlowConfirmarPedido()
            
            const _infoCliente = infoPedido.getCliente();
            //console.log('_infoCliente _infoCliente', _infoCliente);
            let infoCliente = new ClassCliente()
            infoCliente.setCliente(_infoCliente)  
            //console.log('infoCliente == 1', infoCliente )
            //console.log('infoCliente == iddireccion', infoCliente.getIdClientePwaDireccion());

            // let infoCliente: ClassCliente = infoPedido.getCliente();

            let userResponse = ctx.body.toLowerCase().trim()


            // si es mensaje de voz
            if (userResponse.includes('event_voice')) {
                await flowDynamic("dame un momento para escucharte...🙉");
                console.log("🤖 voz a texto....");
                const text = await handlerAI(ctx);
                console.log(`🤖 Fin voz a texto....[TEXT]: ${text}`);
                userResponse = text
            }

            if (infoFlowConfirma.preguntaSiDeseaCubiertos ) {
                const _preguntaSiDeseaCubiertos = userResponse.toLowerCase().includes('si') ? true : false
                infoPedido.setSolicitaCubiertos(_preguntaSiDeseaCubiertos)
                   
                guadarInfoDataBase(infoPedido, infoFlowConfirma, ctx.from)
                enviarPedido(infoCliente, infoPedido)

                // try {
                //     chatGptConfirmaPedido.clearConversationLog()                    
                // } catch (error) {                    
                // }

                
                return await endFlow('Listo 🤙 *Pedido confirmado*') // final enviar pedido
            }


            if (infoFlowConfirma.isCuantoPagara ) {
                const _tipoPagoSeleted = infoFlowConfirma.tipoPagoSeleted
                infoFlowConfirma.tipoPagoSeleted.descripcion = `${_tipoPagoSeleted.descripcion} ${userResponse}`

                // pregunta si desea cubiertos
                if (infoPedido.getIsDelivery()) {
                    infoFlowConfirma.preguntaSiDeseaCubiertos = true

                    guadarInfoDataBase(infoPedido, infoFlowConfirma, ctx.from)
                    return await fallBack('¿Desea cubiertos?')
                } else {         

                    guadarInfoDataBase(infoPedido, infoFlowConfirma, ctx.from)
                    enviarPedido(infoCliente, infoPedido)           
                    return endFlow('Listo 🤙 *Pedido confirmado*') // enviar pedido
                }
            }

            const _idTipoPago = ctx.body.toLowerCase().trim()
            const _tipoPagoSeleted = listTipoPago.find((item: any) => item.idshow === parseInt(_idTipoPago))
            // console.log('_tipoPago', tipoPagoSeleted);

            if (!_tipoPagoSeleted) {
                return fallBack('Escriba un numero valido, para seleccionar el tipo de pago')
            }

            infoPedido.setMetodoPagoSeleted(_tipoPagoSeleted)

            if (_idTipoPago === '1' ) {
                infoFlowConfirma.isCuantoPagara = true;

                guadarInfoDataBase(infoPedido, infoFlowConfirma, ctx.from)
                return fallBack('💵 Con cuanto pagara?')
            }    

            infoFlowConfirma.isCuantoPagara = false;
            
            // pregunta si desea cubiertos
            if (infoPedido.getIsDelivery()) {
                infoFlowConfirma.preguntaSiDeseaCubiertos = true

                guadarInfoDataBase(infoPedido, infoFlowConfirma, ctx.from)
                return await fallBack('¿Desea cubiertos?')

            } else {
                guadarInfoDataBase(infoPedido, infoFlowConfirma, ctx.from)
                enviarPedido(infoCliente, infoPedido)
                return endFlow('Listo 🤙 *Pedido confirmado*') // enviar pedido
            }
        
        }
    )
    


    // solicitar datos al cliente segun el canal de consumo
    function datosSolicitarSegunCanal(idshow) {
        // datosRecopiladosDelCliente = {}
        const _datosCliente = [
            { //delivery                 
                "nombre": "",
                "direccion": "",
                "referencia_de_la_direccion": "",
                "telefono": ""
            },
            { // para llevar
                "nombre": "",                
                "telefono": "" 
            },
            {// reservas
                "nombre": "",
                "telefono": "",
                "hora_llegada": "",
                "numero_de_personas": "",
            }
        ]        

        return _datosCliente[idshow - 1]

    }    

    function obtenerTotalPagar(infoCliente: ClassCliente, infoPedido: ClassInformacionPedido) {
        const totalPagar = armarPedidoGetImportePagar(infoCliente, infoPedido)
        return `El costo total del pedido es: *S/.${totalPagar}*`
    }

    // aca mandamos a armar la estructura del pedido
    function armarPedidoGetImportePagar(infoCliente: ClassCliente, infoPedido: ClassInformacionPedido) {

        // importe a pagar
        let pedidoEnviar = new ClassEstructuraPedido()

        const _infoFlowConfirma = infoPedido.getVariablesFlowConfirmarPedido()
        const canalConsumoSeleted = _infoFlowConfirma.canalConsumoSeletedMasSeccion
        pedidoEnviar.setTipoConsumo(canalConsumoSeleted) 

        return pedidoEnviar.armarPedido(infoSede, infoPedido, infoCliente)
    }

    function enviarPedido(infoCliente: ClassCliente , infoPedido: ClassInformacionPedido) {
        let pedidoEnviar = new ClassEstructuraPedido()
        const _infoFlowConfirma = infoPedido.getVariablesFlowConfirmarPedido()
        const canalConsumoSeleted = _infoFlowConfirma.canalConsumoSeletedMasSeccion
        pedidoEnviar.setTipoConsumo(canalConsumoSeleted) 

        pedidoEnviar.armarPedido(infoSede, infoPedido, infoCliente)
        pedidoEnviar.enviarPedido(_infoSede, infoPedido, infoCliente)

        // try {     
        //     let chatGptConfirmaPedido = infoPedido.getInstanceChatGpt()
        //     chatGptConfirmaPedido.clearConversationLog()
        // } catch (error) {            
        // }
    }

    function setTipoCanalConsumoSeleted(canalConsumoSeleted: any, infoPedido: ClassInformacionPedido) {
        // segun el idshow del canal de consumo seleccionado
        switch (canalConsumoSeleted.idshow) {
            case 1: // delivery
                infoPedido.setIsDelivery(true)
                break;
            case 2: // para llevar
                infoPedido.setIsRecogeLocal(true)
                break;
            case 3: // reservas
                infoPedido.setIsReserva(true)
            break;
        }

        infoPedido.setCanalConsumoSeleted(canalConsumoSeleted)
    }

    function rptFinalSegunCanalConsumo(costoPedido: string, infoPedido: ClassInformacionPedido) {
        // si es para llevar
        if ( infoPedido.getIsRecogeLocal() ) {
            let tiempoRecoger = _infoSede.pwa_min_despacho
            tiempoRecoger = tiempoRecoger >= 8 ? tiempoRecoger : tiempoRecoger * 2
            return `${costoPedido}\n*Nota:* El pedido estará listo en aproximadamente ${tiempoRecoger} minutos.\n\nSi esta de acuerdo responda *Ok* para enviar su pedido.`
        }

        // si es reservar
        if ( infoPedido.getIsReserva() ) {
            const mensajeReserva = `*Nota:* Si por algún motivo no llega en el tiempo que indico, el local *no* estará en la obligación de mantener su reserva y tampoco colocar su pedido primero en la cola.`
            return `${mensajeReserva}\n${costoPedido}\n\nSi esta de acuerdo responda *Ok* para enviar su pedido.`
        }


    }

    async function pasarFlowSegunCanalConsumo(fallBack, flowDynamic, infoCliente:ClassCliente, infoPedido, infoFlowConfirma, ctxFrom) {

        const _totalPagarMsj = obtenerTotalPagar(infoCliente, infoPedido)

        if (infoPedido.getIsDelivery()) {
            guadarInfoDataBase(infoPedido, infoFlowConfirma, ctxFrom)
            return await flowDynamic(_totalPagarMsj)
        }

        if (infoPedido.getIsRecogeLocal() || infoPedido.getIsReserva()) {            
            infoFlowConfirma.preguntaSiEstaConformeOk = true
            const _rptFinal = rptFinalSegunCanalConsumo(_totalPagarMsj, infoPedido)

            guadarInfoDataBase(infoPedido, infoFlowConfirma, ctxFrom)
            return await fallBack(_rptFinal)
        }

    }

    async function validarDireccion(direccionOCoordenadasCliente: any, datosRecopiladosDelCliente, infoPedido: ClassInformacionPedido, chatGptConfirmaPedido) {
        const _confgDelivery = infoSede.getConfigDelivery()        
       // console.log('_confgDelivery', _confgDelivery);
        let direccionClienteSeletedCoordenadas: any = {}
        let msjReturn=''

        // verificamos si direccionOCoordenadasCliente ya viene con las coordenadas
        // console.log('direccionOCoordenadasCliente', direccionOCoordenadasCliente);
        if (direccionOCoordenadasCliente.latitude) {
            direccionClienteSeletedCoordenadas = {
                latitude: direccionOCoordenadasCliente.latitude,
                longitude: direccionOCoordenadasCliente.longitude
            }
        } else {
            const geolocationServices = new GeolocationServices()
            // console.log('direccionOCoordenadasCliente --2', direccionOCoordenadasCliente);
            direccionClienteSeletedCoordenadas = await <any>geolocationServices.getCoordenadas(direccionOCoordenadasCliente.direccion, _confgDelivery.ciudades)
        }


        // console.log('direccionOCoordenadasCliente', direccionOCoordenadasCliente);
        if (!direccionClienteSeletedCoordenadas) {
            const _rptMsj = 'No pude encontrar la direccion en el mapa, escriba por favor una direccion válida, o envíe su ubicación.'
            
            // let chatGptConfirmaPedido = infoPedido.getInstanceChatGpt()
            chatGptConfirmaPedido.setRowConversationLog(`asisente=${_rptMsj}`)
            // return await fallBack(_rptMsj)
            msjReturn = _rptMsj
        }


        // seteamos en la info del pedido
        direccionClienteSeletedCoordenadas.referencia = datosRecopiladosDelCliente.referencia_de_la_direccion
        infoPedido.setDireccionGeolocalizada(direccionClienteSeletedCoordenadas)

        const coordenadas_origen = `${_infoSede.latitude}, ${_infoSede.longitude}`
        const coordenadas_destino = `${direccionClienteSeletedCoordenadas.latitude}, ${direccionClienteSeletedCoordenadas.longitude}`
        const subtotalCostoEntrega: any = await geolocationServices.calcularSubtotaCostoEntrega(coordenadas_origen, coordenadas_destino, _confgDelivery.parametros)
        if (subtotalCostoEntrega.success) {
            infoPedido.setSubtotalCostoEntrega(subtotalCostoEntrega)
            msjReturn = 'ok'
        } else {

            // let chatGptConfirmaPedido = infoPedido.getInstanceChatGpt()
            chatGptConfirmaPedido.setRowConversationLog(`asisente=${subtotalCostoEntrega.mensaje}`)
            msjReturn = subtotalCostoEntrega.mensaje
            // return await fallBack(subtotalCostoEntrega.mensaje)
        }

        return msjReturn;
    }

    async function getDireccionFromCoordenadas(coordenadas: string, infoPedido: ClassInformacionPedido) {
        // const geolocationServices = new GeolocationServices()
        // console.log('coordenadas -- 3', coordenadas);
        const direccionClienteSeletedCoordenadas = await <any>geolocationServices.getCoordenadas(coordenadas, infoPedido.getConfigDelivery().ciudades)
        return direccionClienteSeletedCoordenadas
    }

    // se espera {direccion, referencia}
    async function setearDireccionSeleccionada(datosRecopilados: any, infoCliente: ClassCliente, infoPedido: ClassInformacionPedido, infoFlowConfirma, chatGptConfirmaPedido, isDireccionRegistrada = false){
        // console.log('direccionElegida -- ', datosRecopilados);
        let direccionSelected = isDireccionRegistrada ? datosRecopilados.direccion : datosRecopilados
        let referenciaDireccionSelected = datosRecopilados.referencia
        // const direccionElegida = direccionSelected.direccion
        // console.log('direccionSelected -- ', direccionSelected);

        if (isDireccionRegistrada) {
            // buscamos la direccion seleccionada en la lista de direcciones
            const listDirecciones: any = infoCliente.getDirecciones();            
            const direccionSelectedBuscar = direccionSelected.split(',')[0].toLowerCase().trim()
            const _direccion = listDirecciones.find(item  => item.direccion.toLowerCase().includes(direccionSelectedBuscar))   
            // console.log('_direccion', _direccion);
            if ( _direccion ) {
                infoCliente.setIdClientePwaDireccion(_direccion.idcliente_pwa_direccion)
                referenciaDireccionSelected = _direccion.referencia
                direccionSelected = _direccion

                // let chatGptConfirmaPedido = infoPedido.getInstanceChatGpt()
                chatGptConfirmaPedido.setRowConversationLog(`cliente=mi direccion es: ${direccionSelected.direccion}.`)                
                chatGptConfirmaPedido.setRowConversationLog(`cliente=la referencia de la direccion es: ${referenciaDireccionSelected}.`)                
            }            
        }

        infoFlowConfirma.datosRecopiladosDelCliente.direccion = direccionSelected.direccion
        infoFlowConfirma.datosRecopiladosDelCliente.referencia_de_la_direccion = referenciaDireccionSelected
        
        infoCliente.setDireccionSelected(direccionSelected)
        infoCliente.setReferenciaDireccion(referenciaDireccionSelected)
        infoPedido.setCliente(infoCliente)

        return true
        // chatGptConfirmaPedido.setRowConversationLog(`cliente=mi direccion es: ${datosRecopiladosDelCliente.direccion}.`)
        // if (datosRecopiladosDelCliente.referencia_de_la_direccion !== '' ) {
        //     chatGptConfirmaPedido.setRowConversationLog(`cliente=la referencia de la direccion es: ${datosRecopiladosDelCliente.referencia_de_la_direccion}.`)  
        // }
    }

    async function verificarDatosFaltantesDelCliente(fallBack, flowDynamic, infoPedido, infoFlowConfirma, infoCliente: ClassCliente, ctxFrom, chatGptConfirmaPedido) {
        // console.log('datosRecopiladosDelCliente - ', datosRecopiladosDelCliente);
        const datosRecopiladosDelCliente = infoFlowConfirma.datosRecopiladosDelCliente
        const datosFaltantes = obtenerClavesSinDatos(datosRecopiladosDelCliente)
        //console.log('datosFaltantes', datosFaltantes);

        if (datosFaltantes.length > 0) {
            // let chatGptConfirmaPedido = infoPedido.getInstanceChatGpt()
            chatGptConfirmaPedido.setRowConversationLog(`asistente=escriba los siguientes datos: ${datosFaltantes.join(', ')}.`)
            return await fallBack(`Datos faltantes: ${datosFaltantes.join(', ')}.`)
        } else {
            // enviamos el total a pagar
            // antes de pasar debo verificar la direccion si es delivery
            if (infoPedido.getIsDelivery()) {
                const _direccion = infoCliente.getDireccionSelected()
                const _rptDireccion = await validarDireccion(_direccion, datosRecopiladosDelCliente, infoPedido, chatGptConfirmaPedido)
                if (_rptDireccion === 'ok') {
                    return await pasarFlowSegunCanalConsumo(fallBack, flowDynamic, infoCliente, infoPedido, infoFlowConfirma, ctxFrom)
                } else {

                    guadarInfoDataBase(infoPedido, infoFlowConfirma, ctxFrom)   
                    return await fallBack(_rptDireccion)
                }
            }

            return await pasarFlowSegunCanalConsumo(fallBack, flowDynamic, infoCliente, infoPedido, infoFlowConfirma, ctxFrom)
        }
    }

    function guadarInfoDataBase(infoPedido: ClassInformacionPedido, infoFlowConfirma, ctxFrom) {
        // guardamos en database
        infoPedido.setVariablesFlowPedido(infoFlowConfirma)
        database.update(ctxFrom, infoPedido)
    }


}