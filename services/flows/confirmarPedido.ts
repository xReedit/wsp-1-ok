import { ChatGPT } from "../../clases/chatGpt5"
import { ClassCliente } from "../../clases/cliente"
import { ClassEstructuraPedido } from "../../clases/estructura.pedido.class"
import { ClassInformacionPedido, tituloNivel } from "../../clases/info.pedido.class"
import { ClassInfoSede } from "../../clases/sede"
import { PROMPTS } from "../../prompts/prompts"
import endpoint from '../../endpoints.config';
import { GeolocationServices } from "../geolocation.service"
import { capitalize, extraerSoloCamposFaltantes, formatPadArrayToString, getListaProductosArrayToString, getObjectKeys, handlerAI, obtenerClavesSinDatos } from "../utiles"
import { searchItemInList } from "../search.plato.services"

export const confimarPedido = async (paramsFlowInteraction: any, ctx: any, infoPedido: ClassInformacionPedido, _infoSede: ClassInfoSede, userResponseVoice: string = '', { provider, flowDynamic }) => {
    // console.log('confirmarPedido')

    let infoFlowPedido = infoPedido.getVariablesFlowPedido()
    let infoFlowConfirma = infoPedido.getVariablesFlowConfirmarPedido()
    // let paramsFlowInteraction = infoPedido.getVariablesFlowInteraccion()
    let infoSede: ClassInfoSede = _infoSede

    // infoPedido.setSede(_infoSede)

    
    const _infoCliente = infoPedido.getCliente();
    let infoCliente = new ClassCliente()
    infoCliente.setCliente(_infoCliente) 
    
    let rptReturn = ''
    
    const jid = ctx.key.remoteJid
    const sock = await provider.getInstance(jid)
    await sock.presenceSubscribe(jid)
    await sock.sendPresenceUpdate('composing', jid)    
    let userResponse = userResponseVoice!=='' ? userResponseVoice : ctx.body.toLowerCase().trim()

    // iniciamos el chatbot
    let chatGptConfirmaPedido = new ChatGPT('recolector', 'cliente', infoPedido)
    

    // si es mensaje de voz
    // if (userResponse.includes('event_voice')) {
    //     await flowDynamic("dame un momento para escucharte...🙉");
    //     console.log("🤖 voz a texto....");
    //     const text = await handlerAI(ctx);
    //     console.log(`🤖 Fin voz a texto....[TEXT]: ${text}`);
    //     userResponse = text
    // }

    // confirma el importe total del pedido
    if (infoFlowPedido.preguntaSiEstaConformeOk) {
        // if (userResponse.includes('ok')) {
        if (['confirmar', 'confirmo', 'confirmado', 'confirma', 'confirm', 'dale', 'ok', 'listo', 'si', 'ya'].includes(userResponse)){
            // enviarPedido(infoCliente, infoPedido, infoSede)

            try {
                chatGptConfirmaPedido.clearConversationLog()
            } catch (error) {
            }
            
            infoFlowPedido.nivelConfirmarPedido = 3 // pasamos a metodo de pago
            const _listTipoPago = getMetodosPago(infoSede)
            return `Listo 🤙\n\n*Ahora seleccione como desea pagar, escriba:*\n${_listTipoPago.join('\n')}`            
        }
    }

    let listCanalesConsumo = infoSede.getlistCanalConsumo()
    console.log('listCanalesConsumo === 1', listCanalesConsumo);

    // mostrar canales de consumo
    if (infoFlowPedido.nivelConfirmarPedido===0) {        
        const listCanalesConsumo_show = cocinarTiposDeConsumno(listCanalesConsumo)
        console.log('listCanalesConsumo === 2', listCanalesConsumo_show);
        
        rptReturn = `*Ahora, seleccione el canal, escriba:* \n${listCanalesConsumo_show.join('\n')}`   
        infoFlowPedido.nivelConfirmarPedido = 1
        return rptReturn;
        // setTipoCanalConsumoSeleted(canalConsumoSeleted, infoPedido)
    }

    // seleccione canal de consumo
    let tileAddAnswerDatosfaltantes = ''
    let datosFaltantesSendPrompt = '' // para enviarlo al prompt
    if (infoFlowPedido.nivelConfirmarPedido === 1) {   
        // verificamos si selecciono numero o escribio el nombre del canal de consumo
        let _isNumberSeletedTPC = !isNaN(parseInt(userResponse))        

        let canalConsumoSeleted: any;
        if (!_isNumberSeletedTPC) {
            // si escribio el nombre del canal de consumo
            // canalConsumoSeleted = listCanalesConsumo.find((item: any) => item.descripcion.toLowerCase().includes(userResponse))
            canalConsumoSeleted = searchItemInList(listCanalesConsumo, userResponse, 'descripcion')
            console.log('listCanalesConsumo', canalConsumoSeleted);            
        } else {
            canalConsumoSeleted = listCanalesConsumo.find((item: any) => item.idshow === parseInt(userResponse))
        }
        
        
        if (!canalConsumoSeleted) {
            
            return 'Escriba un numero valido, para seleccionar el canal de consumo'
        }
        

        // verificamos datos faltantes segun el canal de consumo
        let datosRecopiladosDelCliente = datosSolicitarSegunCanal(canalConsumoSeleted.idshow)
        datosRecopiladosDelCliente.telefono = infoCliente.getCelular()
        datosRecopiladosDelCliente.nombre = infoCliente.getNombrePila() 

        canalConsumoSeleted.secciones = infoPedido.getPedidoCliente();
        infoFlowConfirma.canalConsumoSeletedMasSeccion = canalConsumoSeleted

        setTipoCanalConsumoSeleted(canalConsumoSeleted, infoPedido)

        const datosFaltantes = obtenerClavesSinDatos(datosRecopiladosDelCliente)            
        
        if (datosFaltantes.length === 0) {
            // datos recopilados completos // pasa a metodo de pago            
            const [isDatosCompletos, rptReturn] = await verificarDatosFaltantesDelCliente(infoPedido, infoFlowConfirma, infoCliente, chatGptConfirmaPedido, infoSede)    
            if (isDatosCompletos) {
                // infoFlowPedido.nivelConfirmarPedido = 3
                infoFlowPedido.preguntaSiEstaConformeOk = true
                return rptReturn;
            }            
        } else {            
            // datos recopilados incompletos
            tileAddAnswerDatosfaltantes = `📝 Para *${capitalize(canalConsumoSeleted.descripcion)}* necesitamos los siguientes datos:\n*${datosFaltantes.join(',')}*`
            datosFaltantesSendPrompt = `Para ${capitalize(canalConsumoSeleted.descripcion)} necesito que me proporcione los siguientes datos: ${datosFaltantes.join(',')}`
            // let _prompt = PROMPTS.rolRecopiladorDatos    
            // infoFlowConfirma.datosFaltantesSegunCanalConsumo = datosFaltantesSendPrompt;
            let _prompt = endpoint.rolRecopiladorDatos                
            
            
            // solo enviar datos que faltan al prompt
            const _datosRecopiladosDelCliente = extraerSoloCamposFaltantes(datosRecopiladosDelCliente) //Object.keys(datosRecopiladosDelCliente).map(key => `${key}: ${JSON.stringify(datosRecopiladosDelCliente[key])}`).join(',')
            const _canal_consumo_prompt = canalConsumoSeleted.descripcion === 'DELIVERY' ? 'de entrega a domicilio (DELIVERY)' : canalConsumoSeleted.descripcion

            let _prompt_delivery = ''
            if (infoPedido.getIsDelivery()) {
                _prompt_delivery = ' [DATO ADICIONAL] El cliente te puede proporcionar la direccion y referencia en una sola linea, ejemplo: Av. Los Pinos 123, frente a la comisaria. Debes identificar cual es la direccion y cual es la referencia. En este caso la direccion seria: Av. Los Pinos 123 y la referencia seria: frente a la comisaria.'  
            }
            
            _prompt = _prompt.replace('{datos}', JSON.stringify(_datosRecopiladosDelCliente))
            _prompt = _prompt.replace('{canal_consumo}', _canal_consumo_prompt)
            _prompt = _prompt + _prompt_delivery

            // envio el promt
            await chatGptConfirmaPedido.sendPrompt(_prompt)

            // si es delivery chequeamos si tiene direccion registrada
            if (infoPedido.getIsDelivery()) {
                console.log('infoCliente.getIsDireccionRegistrada()', infoCliente.getIsDireccionRegistrada());
                if (infoCliente.getIsDireccionRegistrada() === true) {
                    // const _tileAddAnswerDatosfaltantes = isDeliveryGetDireccionEntrega(infoCliente, datosRecopiladosDelCliente)
                    const _tileAddAnswerDatosfaltantes = isDeliveryGetDireccionEntrega(infoCliente, infoFlowConfirma)
                    tileAddAnswerDatosfaltantes = _tileAddAnswerDatosfaltantes

                    chatGptConfirmaPedido.setRowConversationLog(`recolector=${tileAddAnswerDatosfaltantes}`)

                    infoFlowConfirma.isRecopilandoDatos = true;
                    infoFlowPedido.nivelConfirmarPedido = 2
                    return tileAddAnswerDatosfaltantes
                } 
            }            
            chatGptConfirmaPedido.setRowConversationLog(`recolector=${datosFaltantesSendPrompt}.`)
            

            infoFlowConfirma.isRecopilandoDatos = true;  
            infoFlowPedido.nivelConfirmarPedido = 2
            return tileAddAnswerDatosfaltantes
        }
    }

    // recopilar datos del cliente
    if (infoFlowPedido.nivelConfirmarPedido === 2) {
        console.log('recopilamos datos del cliente ========');
        let modelResponse = ''
        let isDireccionSeleted = false
        // confirma direccion
        if (infoPedido.getIsDelivery()) {
            [isDireccionSeleted, userResponse] = await isDeliveryRecopilaDireccionEntrega(infoPedido, infoCliente, infoFlowConfirma, chatGptConfirmaPedido, userResponse, ctx, infoSede)
            console.log('0isDireccionSeleted', isDireccionSeleted, userResponse);

            // si direccion no valida
            if ( !isDireccionSeleted ) {
                modelResponse = await chatGptConfirmaPedido.sendMessage(userResponse)
                // chatGptConfirmaPedido.setRowConversationLog(`recolector=${infoFlowConfirma.datosFaltantesSegunCanalConsumo}.`)
            }   
        } else {
            modelResponse = await chatGptConfirmaPedido.sendMessage(userResponse)
        }

        console.log('modelResponse', modelResponse);
        
        // analiza la respuesta del modelo
        if (!isDireccionSeleted) {
            const [isDatosRecopiladosOk, rptModel] = await analizarRespuestaRecopiladorDatos(modelResponse,infoFlowConfirma, infoCliente, infoPedido, chatGptConfirmaPedido, infoSede)
            console.log('isDatosRecopiladosOk == 1', isDatosRecopiladosOk, rptModel);
            if (!isDatosRecopiladosOk) {
                // si falta algun dato lo solicita
                return rptModel
            }        
        }

        // verificamos datos faltantes segun el canal de consumo
        const [isDatosCompletos, rptReturn] = await verificarDatosFaltantesDelCliente(infoPedido,infoFlowConfirma,infoCliente,chatGptConfirmaPedido,infoSede)
        
        console.log('isDatosCompletos == 2', isDatosCompletos, rptReturn);
        if (isDatosCompletos) {
            infoFlowPedido.preguntaSiEstaConformeOk = true
            // infoFlowPedido.nivelConfirmarPedido = 3
        }

        // envia tambien el costo del pedido
        return rptReturn
    }

    

    // seleccione metodo de pago
    if (infoFlowPedido.nivelConfirmarPedido === 3 ) {        
        let listTipoPago = infoSede.getlistTipoPago()
        let _tipoPagoSeleted: any
        let _idTipoPago: string

        let _isNumberSeletectedTP = !isNaN(parseInt(userResponse))  
        if (!_isNumberSeletectedTP ) {
            // _tipoPagoSeleted = listTipoPago.find((item: any) => item.descripcion.toLowerCase().includes(userResponse))
            _tipoPagoSeleted = searchItemInList(listTipoPago, userResponse, 'descripcion')
            _idTipoPago = _tipoPagoSeleted?.idshow || null
        } else {
            _idTipoPago = userResponse
            _tipoPagoSeleted = listTipoPago.find((item: any) => item.idshow === parseInt(_idTipoPago))
        }
        
        if (!_tipoPagoSeleted) {
            return 'Escriba un numero valido, para seleccionar el tipo de pago'
        }

        infoPedido.setMetodoPagoSeleted(_tipoPagoSeleted)

        infoFlowConfirma.isCuantoPagara = false;
        if (_idTipoPago === '1') {
            infoFlowConfirma.isCuantoPagara = true;       
            infoFlowPedido.nivelConfirmarPedido = 4     
            return '💵 Con cuanto de efectivo pagara?'
        } 

        if (infoPedido.getIsDelivery()) {
            infoFlowConfirma.preguntaSiDeseaCubiertos = true
            infoFlowPedido.nivelConfirmarPedido = 5
            return '¿Desea cubiertos? 🍴'
        } else {
            enviarPedido(infoCliente, infoPedido, infoSede)
            return getMsjPedidoConfirmado(paramsFlowInteraction, infoFlowPedido)
        }
    }

    // pregunta cuanto pagara
    if (infoFlowPedido.nivelConfirmarPedido === 4) {
        if (infoFlowConfirma.isCuantoPagara) {
            const _tipoPagoSeleted = infoFlowConfirma.tipoPagoSeleted
            infoFlowConfirma.tipoPagoSeleted.descripcion = `${_tipoPagoSeleted.descripcion} ${userResponse}`
        }

        if (infoPedido.getIsDelivery()) {
            infoFlowConfirma.preguntaSiDeseaCubiertos = true
            infoFlowPedido.nivelConfirmarPedido = 5
            return '¿Desea cubiertos? 🍴'
        } else {
            enviarPedido(infoCliente, infoPedido, infoSede)
            return getMsjPedidoConfirmado(paramsFlowInteraction, infoFlowPedido)
        }
    }

    // si desea cubiertos
    if (infoFlowPedido.nivelConfirmarPedido === 5) {
            if (infoFlowConfirma.preguntaSiDeseaCubiertos ) {
                const _preguntaSiDeseaCubiertos = userResponse.toLowerCase().includes('si') ? true : false
                infoPedido.setSolicitaCubiertos(_preguntaSiDeseaCubiertos)            
            

            enviarPedido(infoCliente, infoPedido, infoSede)
            return getMsjPedidoConfirmado(paramsFlowInteraction, infoFlowPedido)
        }
    }



}














function getMsjPedidoConfirmado(paramsFlowInteraction, infoFlowPedido) {
    // resetear valores    
    infoFlowPedido.preguntaSiEstaConformeOk = false;
    infoFlowPedido.preguntaSiDeseaCubiertos = false;    
    infoFlowPedido.isCuantoPagara = false;
    infoFlowPedido.isRecopilandoDatos = false;    
    infoFlowPedido.nivelConfirmarPedido = 0
    paramsFlowInteraction.nivel_titulo = tituloNivel.saludoIncial
    paramsFlowInteraction.nivel = '0'    
    return 'Listo 🤙 *Pedido confirmado*\nMuchas gracias por su preferencia 🙂'    
}

function cocinarTiposDeConsumno(listCanalesConsumo) {
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

    return _listShowCanalConsumo
}

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

function isDeliveryGetDireccionEntrega(infoCliente: ClassCliente , infoFlowConfirma) {
    let rptReturn = ''
    // if (infoPedido.getIsDelivery()) {
        // if (infoCliente.getIsDireccionRegistrada()) {
            // si hay varias direcciones debe seleccionar una, y si solo hay una debe confirmarla

            let _listDireccionesShow: any;
            let _listDirecciones = infoCliente.getDirecciones()
            infoFlowConfirma._listDirecciones = _listDirecciones
            console.log('_listDirecciones', _listDirecciones);
            console.log('_listDirecciones.length', _listDirecciones.length);
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
                rptReturn = `Tenemos registrado las siguientes direcciones:\n${_listDireccionesShow.join('\n')}\n\nEscriba el *numero* de la direccion que desea seleccionar o escriba una nueva dirección de entrega`
                infoFlowConfirma.isClienteEligeListDireccion = true;

            } else {
                // si solo hay una debe confirmarla
                _listDireccionesShow = _listDirecciones[0]
                rptReturn = `Tenemos registrado la siguiente direccion:\n*${_listDireccionesShow.direccion.split(',')[0]}*\n\nSe la enviamos a esta direccion? escriba: *Si* o *No*`
                infoFlowConfirma.isClienteConfirmaDireccion = true;
            }
            
            // chatGptConfirmaPedido.setRowConversationLog(`recolector=${tileAddAnswerDatosfaltantes}`)
        // }
    // }
    return rptReturn;
}





// se espera {direccion, referencia}
async function setearDireccionSeleccionada(datosRecopilados: any, infoCliente: ClassCliente, infoPedido: ClassInformacionPedido, infoFlowConfirma, chatGptConfirmaPedido, isDireccionRegistrada = false) {
    // console.log('direccionElegida -- ', datosRecopilados);
    let direccionSelected = isDireccionRegistrada ? datosRecopilados.direccion : datosRecopilados
    let referenciaDireccionSelected = datosRecopilados.referencia
    // const direccionElegida = direccionSelected.direccion
    // console.log('direccionSelected -- ', direccionSelected);

    if (isDireccionRegistrada) {
        // buscamos la direccion seleccionada en la lista de direcciones
        const listDirecciones: any = infoCliente.getDirecciones();
        const direccionSelectedBuscar = direccionSelected.split(',')[0].toLowerCase().trim()
        const _direccion = listDirecciones.find(item => item.direccion.toLowerCase().includes(direccionSelectedBuscar))
        // console.log('_direccion', _direccion);
        if (_direccion) {
            infoCliente.setIdClientePwaDireccion(_direccion.idcliente_pwa_direccion)
            referenciaDireccionSelected = _direccion.referencia
            direccionSelected = _direccion

            // let chatGptConfirmaPedido = infoPedido.getInstanceChatGpt()
            // const _dirAddConversation = `cliente=mi direccion es: ${direccionSelected.direccion}. y la referencia de la direccion es: ${referenciaDireccionSelected}.`	
            // chatGptConfirmaPedido.setRowConversationLog(_dirAddConversation)
            chatGptConfirmaPedido.setRowConversationLog(`cliente=${direccionSelected.direccion}.`)
            if (referenciaDireccionSelected ) {
                chatGptConfirmaPedido.setRowConversationLog(`cliente=la referencia de la direccion es: ${referenciaDireccionSelected}.`)
            }
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


// devuleve el costo total si acaso los datos estan completos
// debe devolver {isDatosCompletos, rptReturn}
async function verificarDatosFaltantesDelCliente(infoPedido, infoFlowConfirma, infoCliente: ClassCliente, chatGptConfirmaPedido, infoSede): Promise<[ isDatosCompletos: boolean, rptReturn: string]> {
    // console.log('datosRecopiladosDelCliente - ', datosRecopiladosDelCliente);
    let rptReturn = ''
    let isDatosCompletos = false
    const datosRecopiladosDelCliente = infoFlowConfirma.datosRecopiladosDelCliente
    const datosFaltantes = obtenerClavesSinDatos(datosRecopiladosDelCliente)
    console.log('datosFaltantes', datosFaltantes);

    if (datosFaltantes.length > 0) {
        // let chatGptConfirmaPedido = infoPedido.getInstanceChatGpt()
        chatGptConfirmaPedido.setRowConversationLog(`recolector=escriba los siguientes datos: ${datosFaltantes.join(', ')}.`)

        rptReturn =`Datos faltantes: ${datosFaltantes.join(', ')}.`
        isDatosCompletos = false
        return  [isDatosCompletos, rptReturn]
    } else {
        // enviamos el total a pagar
        // antes de pasar debo verificar la direccion si es delivery
        isDatosCompletos = true
        if (infoPedido.getIsDelivery()) {
            const _direccion = infoCliente.getDireccionSelected()
            const _rptDireccion = await validarDireccion(_direccion, datosRecopiladosDelCliente, infoPedido, chatGptConfirmaPedido, infoSede)
            if (_rptDireccion !== 'ok') {                                
                isDatosCompletos = false
                rptReturn = _rptDireccion                
            }
        }

        const _totalPagarMsj = obtenerTotalPagar(infoCliente, infoPedido, infoSede)

        if (infoPedido.getIsDelivery()) {
            rptReturn = `${_totalPagarMsj}\n\nSi esta de acuerdo responda *OK* para continuar.`
        }

        if (infoPedido.getIsRecogeLocal()) {
            let tiempoRecoger = infoSede.getSede().pwa_min_despacho
            tiempoRecoger = tiempoRecoger >= 8 ? tiempoRecoger : tiempoRecoger * 2
            rptReturn = `${_totalPagarMsj}\n*Nota:* El pedido estará listo en aproximadamente ${tiempoRecoger} minutos.\n\nSi esta de acuerdo responda *OK* para enviar su pedido.`
        }

        // si es reservar
        if (infoPedido.getIsReserva()) {
            const mensajeReserva = `*Nota:* Si por algún motivo no llega en el tiempo que indico, el local *no* estará en la obligación de mantener su reserva y tampoco colocar su pedido primero en la cola.`
            rptReturn = `${mensajeReserva}\n${_totalPagarMsj}\n\nSi esta de acuerdo responda *OK* para continuar.`
        }

        // return await pasarFlowSegunCanalConsumo(fallBack, flowDynamic, infoCliente, infoPedido, infoFlowConfirma, ctxFrom)
    }

    return [ isDatosCompletos, rptReturn]
}


async function validarDireccion(direccionOCoordenadasCliente: any, datosRecopiladosDelCliente, infoPedido: ClassInformacionPedido, chatGptConfirmaPedido, infoSede) {
    const _confgDelivery = infoSede.getConfigDelivery()
    // console.log('_confgDelivery', _confgDelivery);
    let direccionClienteSeletedCoordenadas: any = {}
    const _infoSede = infoSede.getSede()
    let msjReturn = ''

    const geolocationServices = new GeolocationServices()

    // verificamos si direccionOCoordenadasCliente ya viene con las coordenadas
    // console.log('direccionOCoordenadasCliente', direccionOCoordenadasCliente);
    if (direccionOCoordenadasCliente.latitude) {
        direccionClienteSeletedCoordenadas = {
            latitude: direccionOCoordenadasCliente.latitude,
            longitude: direccionOCoordenadasCliente.longitude
        }
    } else {
        // const geolocationServices = new GeolocationServices()
        // console.log('direccionOCoordenadasCliente --2', direccionOCoordenadasCliente);
        direccionClienteSeletedCoordenadas = await <any>geolocationServices.getCoordenadas(direccionOCoordenadasCliente.direccion, _confgDelivery.ciudades)
    }


    // console.log('direccionOCoordenadasCliente', direccionOCoordenadasCliente);
    if (!direccionClienteSeletedCoordenadas) {
        const _rptMsj = 'No pude encontrar la direccion en el mapa, escriba por favor una direccion válida, o envíe su *ubicación actual*. 🚩'

        // let chatGptConfirmaPedido = infoPedido.getInstanceChatGpt()
        chatGptConfirmaPedido.setRowConversationLog(`asisente=${_rptMsj}`)
        // return await fallBack(_rptMsj)
        msjReturn = _rptMsj
    }


    // seteamos en la info del pedido
    direccionClienteSeletedCoordenadas.referencia = datosRecopiladosDelCliente.referencia_de_la_direccion || ''
    infoPedido.setDireccionGeolocalizada(direccionClienteSeletedCoordenadas)

    const coordenadas_origen = `${_infoSede.latitude}, ${_infoSede.longitude}`
    console.log('coordenadas_origen', coordenadas_origen);
    console.log('_infoSede', _infoSede);
    const coordenadas_destino = `${direccionClienteSeletedCoordenadas.latitude}, ${direccionClienteSeletedCoordenadas.longitude}`
    const subtotalCostoEntrega: any = await geolocationServices.calcularSubtotaCostoEntrega(coordenadas_origen, coordenadas_destino, _confgDelivery.parametros)
    console.log('subtotalCostoEntrega', subtotalCostoEntrega);
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


function obtenerTotalPagar(infoCliente: ClassCliente, infoPedido: ClassInformacionPedido, infoSede) {
    const [totalPagar, arrSubTotales] = armarPedidoGetImportePagar(infoCliente, infoPedido, infoSede)
    let _stringSubtotales = ``
    // arrSubTotales.map(x => {
    //     _stringSubtotales += `${x.descripcion}: ${x.importe}\n`
    // })
    const _tipoConsumoSeleted = infoPedido.getCanalConsumoSeleted()    
    let _stringListProductos = getListaProductosArrayToString(_tipoConsumoSeleted)    
    _stringSubtotales = formatPadArrayToString(arrSubTotales)
    _stringSubtotales = `${_stringListProductos}\n${_stringSubtotales}`
    return `El costo total del pedido es: *S/.${totalPagar}*\n\n${_stringSubtotales}`
}

// aca mandamos a armar la estructura del pedido
// devuelve el importe a pagar y el array subtotales
function armarPedidoGetImportePagar(infoCliente: ClassCliente, infoPedido: ClassInformacionPedido, infoSede): [number, any] {

    // importe a pagar
    let pedidoEnviar = new ClassEstructuraPedido()

    const _infoFlowConfirma = infoPedido.getVariablesFlowConfirmarPedido()
    const canalConsumoSeleted = _infoFlowConfirma.canalConsumoSeletedMasSeccion
    pedidoEnviar.setTipoConsumo(canalConsumoSeleted)

    return pedidoEnviar.armarPedido(infoSede, infoPedido, infoCliente)
}


// retorna isDireccionSeleted
async function isDeliveryRecopilaDireccionEntrega(infoPedido: ClassInformacionPedido, infoCliente: ClassCliente, infoFlowConfirma, chatGptConfirmaPedido, userResponse, ctx, infoSede: ClassInfoSede): Promise<[boolean, string]> {

    console.log('userResponse', userResponse);
    let _listDirecciones = infoCliente.getDirecciones()
    infoFlowConfirma._listDirecciones = _listDirecciones
    
    let isDireccionSeleted  = false
    if (infoFlowConfirma.isClienteConfirmaDireccion) {
        if (userResponse.includes('si')) {
            const _direccion = infoCliente.getDirecciones()

            isDireccionSeleted = true
            await setearDireccionSeleccionada(_direccion[0], infoCliente, infoPedido, infoFlowConfirma, chatGptConfirmaPedido, true)            
        }
    }
    
    if (infoFlowConfirma.isClienteEligeListDireccion) {
        const _idShowDireccionElegido = userResponse
        const _direccionElegida = infoFlowConfirma._listDirecciones.find((item: any) => item.idshow === parseInt(_idShowDireccionElegido))        
        if (_direccionElegida) {
            isDireccionSeleted = true
            await setearDireccionSeleccionada(_direccionElegida, infoCliente, infoPedido, infoFlowConfirma, chatGptConfirmaPedido, true)
        } else {
            // verificamos si lo escrito es un numero o es una direccion que pueda coincidir la lista _listDirecciones
            // si es un numero
            if ( !isNaN(parseInt(userResponse)) ) {
                userResponse = `Selecciono el numero ${userResponse}`
            } else {
                // console.log('_listDirecciones', _listDirecciones);
                let _direccionElegida = null
                try {
                    _direccionElegida = _listDirecciones.length > 0 ? infoFlowConfirma._listDirecciones.find((item: any) => item.direccion.includes(userResponse)) : null                     
                } catch (error) {
                    _direccionElegida = null   
                }

                if (_direccionElegida) {
                    isDireccionSeleted = true
                    await setearDireccionSeleccionada(_direccionElegida, infoCliente, infoPedido, infoFlowConfirma, chatGptConfirmaPedido, true)
                } else {
                    // sino hay direccion selecciona, entonces esta intentando escribir una nueva direccion
                    userResponse = `${userResponse}`
                }
            }


        }
    }

    // si envia su localizacion                  
    if (userResponse.includes('_event_location')) {
        // console.log('_event_location');
        const coordenadasCliente = `${ctx.message.locationMessage.degreesLatitude}, ${ctx.message.locationMessage.degreesLongitude}`
        // console.log('coordenadasCliente', coordenadasCliente);
        const rptCoordenadas = await getDireccionFromCoordenadas(coordenadasCliente, infoPedido, infoSede);
        if (rptCoordenadas) {        
            isDireccionSeleted = true    
            await setearDireccionSeleccionada(rptCoordenadas, infoCliente, infoPedido, infoFlowConfirma, chatGptConfirmaPedido);            
        }
    }

    return [isDireccionSeleted, userResponse]
}


async function getDireccionFromCoordenadas(coordenadas: string, infoPedido: ClassInformacionPedido, infoSede: ClassInfoSede ) {
    const geolocationServices = new GeolocationServices()
    // console.log('coordenadas -- 3', coordenadas);
    const _confgDelivery = infoSede.getConfigDelivery()
    const direccionClienteSeletedCoordenadas = await <any>geolocationServices.getCoordenadas(coordenadas, _confgDelivery.ciudades)
    return direccionClienteSeletedCoordenadas
}

// devbuelve [isDireccionSeleted, rptMsj]   
async function analizarRespuestaRecopiladorDatos(modelResponse, infoFlowConfirma, infoCliente, infoPedido: ClassInformacionPedido , chatGptConfirmaPedido, infoSede: ClassInfoSede): Promise<[boolean, string]>  {    
    // console.log('modelResponse', modelResponse);
    const isRptJson = modelResponse.includes('respuesta=')
    if (!isRptJson) {
        return [false, modelResponse]
    } else {
        let _datosRecopiladosDelCliente = modelResponse.split('respuesta=')[1]
        // console.log('respuesta completa = ', _datosRecopiladosDelCliente);
        const _datosRecopiladosDelClienteJSON = JSON.parse(_datosRecopiladosDelCliente)
        

        infoFlowConfirma.datosRecopiladosDelCliente = _datosRecopiladosDelClienteJSON

        if (_datosRecopiladosDelClienteJSON.nombre ) {
            infoCliente.setNombrePila(_datosRecopiladosDelClienteJSON.nombre)
            infoCliente.setNombre(_datosRecopiladosDelClienteJSON.nombre)
        }

        
        // infoCliente.setCelular(_datosRecopiladosDelClienteJSON.telefono) // ya tengo
        infoPedido.setCliente(infoCliente)

        if (infoPedido.getIsReserva()) {
            infoCliente.setNumPersonas(_datosRecopiladosDelClienteJSON.numero_de_personas)
            infoCliente.setHoraLlegada(_datosRecopiladosDelClienteJSON.hora_llegada)
            return [true, '👍 Listo.']
        }

        // validamos direccion
        if (infoPedido.getIsDelivery()) {
            await setearDireccionSeleccionada(_datosRecopiladosDelClienteJSON, infoCliente, infoPedido, infoFlowConfirma, chatGptConfirmaPedido);
            
            const _confgDelivery = infoSede.getConfigDelivery()
            // console.log('_confgDelivery', _confgDelivery);
            const geolocationServices = new GeolocationServices()
            let direccionClienteSeletedCoordenadas = await <any>geolocationServices.getCoordenadas(_datosRecopiladosDelClienteJSON.direccion, _confgDelivery.ciudades)                        

            
            if (!direccionClienteSeletedCoordenadas) {
                const _rptMsj = '🗺️ No pude encontrar la direccion en el mapa, escriba por favor una direccion válida, o envíe su *ubicación actual*. 🚩'
                chatGptConfirmaPedido.setRowConversationLog(`recolector=${_rptMsj}`)                
                // rptReturn = _rptMsj;
                return [false, _rptMsj]
            }

            // direccionClienteSeletedCoordenadas.referencia = _datosRecopiladosDelClienteJSON.referencia_de_la_direccion
            direccionClienteSeletedCoordenadas.referencia = _datosRecopiladosDelClienteJSON.referencia_de_la_direccion ? _datosRecopiladosDelClienteJSON.referencia_de_la_direccion || '': '';
            // console.log('direccionClienteSeletedCoordenadas', direccionClienteSeletedCoordenadas);
            infoPedido.setDireccionGeolocalizada(direccionClienteSeletedCoordenadas)

            const _infoSede = infoSede.getSede()    
            const coordenadas_origen = `${_infoSede.latitude}, ${_infoSede.longitude}`
            const coordenadas_destino = `${direccionClienteSeletedCoordenadas.latitude}, ${direccionClienteSeletedCoordenadas.longitude}`
            const subtotalCostoEntrega: any = await geolocationServices.calcularSubtotaCostoEntrega(coordenadas_origen, coordenadas_destino, _confgDelivery.parametros)
            // console.log('subtotalCostoEntrega', subtotalCostoEntrega);
            if (subtotalCostoEntrega.success) {
                infoPedido.setSubtotalCostoEntrega(subtotalCostoEntrega)
                return [true, '👍 Listo.']
            } else {
                chatGptConfirmaPedido.setRowConversationLog(`recolector=${subtotalCostoEntrega.mensaje}`)
                
                return [false, subtotalCostoEntrega.mensaje]
            }
        }
    }
}

function enviarPedido(infoCliente: ClassCliente, infoPedido: ClassInformacionPedido, infoSede: ClassInfoSede) {
    let pedidoEnviar = new ClassEstructuraPedido()
    const _infoFlowConfirma = infoPedido.getVariablesFlowConfirmarPedido()
    const canalConsumoSeleted = _infoFlowConfirma.canalConsumoSeletedMasSeccion
    const _infoSede = infoSede.getSede()
    pedidoEnviar.setTipoConsumo(canalConsumoSeleted)

    pedidoEnviar.armarPedido(infoSede, infoPedido, infoCliente)
    pedidoEnviar.enviarPedido(_infoSede, infoPedido, infoCliente)    
}



function getMetodosPago(infoSede) {
    let listTipoPago = infoSede.getlistTipoPago()
    const _listTipoPago = listTipoPago.map((item: any, index) => {
        const _idShow = index + 1
        item.idshow = _idShow
        return `*${item.idshow}* Para ${capitalize(item.descripcion)}`
    })

    return _listTipoPago;
}
