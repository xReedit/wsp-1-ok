import { ChatGPT } from "../../clases/chatGpt5";
import { ClassInformacionPedido, tituloNivel } from "../../clases/info.pedido.class";
import { ClassInfoSede } from "../../clases/sede";
import { SqliteDatabase } from "../sqlite.services";
import { confimarPedido } from "./confirmarPedido";
import { consultarHorario, soloHorariosAtencion } from "./consultarHorario";
import { consultarDisponibilidadPlato } from "./consultarPlato";
import { listOptions } from "./listOpciones";
import { saludoInicial } from "./saludoInicial";
import { tomarPedido } from "./tomarPedido";
import { enviarCarta } from "./verCarta";
import { enviarComprobante } from "./enviarComprobante";
import { cambiarNombreCliente } from "./cambiarNombreCliente";
import { noEntendido } from "./noEntendido";
import { getListOptionsBot, getOptionFromNumber } from "./esperaNumeroOpcion";
import { handlerAI, isTimeActivedBot } from "../utiles";
import endpoint from '../../endpoints.config';

export const coreFlow = async (isFromAction: boolean, ctx: any, infoSede: ClassInfoSede, database: SqliteDatabase, { provider, fallBack, endFlow, flowDynamic, gotoFlow }) => {    
    let msjFormatoPedido = `De prefencia en una sola línea y en este formato:\n*cantidad nombre_del_producto(indiciaciones)*\nPor ejemplo:\nQuiero *2 ceviches(1 sin aji), 1 pollo al horno*`
    let mensageTomarPedido = 'Cuando este listo, me dice su pedido, de manera escrita ✍️ o por voz 🗣️.\n' + msjFormatoPedido
    let modelResponse = ''
    let userResponse = ctx.body.trim();
    let userResponseVoice = ''
    const ctxFrom = ctx.from

    // el id del usuario va ser  ctxFrom + idsede
    const idUserTable = `${ctxFrom}-${infoSede.getSede().idsede}` 
    console.log('idUsuario', idUserTable);

    console.log('userResponse', userResponse);

    const _num_telefono = ctxFrom
    const isSaludo = ['hola', 'Buenas', 'Buen dia', 'Buenos', 'ola', 'beunas'].includes(userResponse.toLowerCase())

    console.log('ctxFrom', ctxFrom);

    let infoPedido = new ClassInformacionPedido()
    // infoPedido = await database.getInfoPedido(ctxFrom)
    infoPedido = await database.getInfoPedido(idUserTable)
    // infoPedido.setSede(infoSede)

    
    let paramsFlowInteraction = infoPedido.getVariablesFlowInteraccion()
    let infoFlowPedido = infoPedido.getVariablesFlowPedido()           
    
    // guardarDatosLocalBD(infoPedido, infoFlowPedido, paramsFlowInteraction, idUserTable, database)


    // console.log('infoPedido ini', infoPedido);
    // verificar si el bot esta online
    const _statusBot = infoPedido.getBotOnLine()
    console.log('_statusBot', _statusBot);
    if (_statusBot.online === 0) {
        const _isTimeActivedBot = isTimeActivedBot(_statusBot.time_offline.toString())
        console.log('_isTimeActivedBot', _isTimeActivedBot);
        if (_isTimeActivedBot) {
            infoPedido.setBotOnline(true)
            // va al saludo inicial
            paramsFlowInteraction.nivel_titulo = tituloNivel.saludoIncial
        } else {            
            guardarDatosLocalBD(infoPedido, infoFlowPedido, paramsFlowInteraction, idUserTable, database)
            return false;
        }
    } else {
        // verificamos hace cuantos minutos fue su ultima interaccion
        const minLastInteraction = await database.getMinLastInteraction(idUserTable)
        if ( minLastInteraction >= endpoint.time_min_remove_last_interaction ) {
            //remove para comenzar nuevamente
            console.log('remove para comenzar nuevamente');
            database.delete(idUserTable)
            infoPedido = await database.getInfoPedido(idUserTable)

            paramsFlowInteraction = infoPedido.getVariablesFlowInteraccion()
            infoFlowPedido = infoPedido.getVariablesFlowPedido()   
        }

        console.log('minutosTranscurridos', minLastInteraction, endpoint.time_min_remove_last_interaction);
    }

    console.log('paso sigueinte');

    const jid = ctx.key.remoteJid
    const sock = await provider.getInstance(jid)
    await sock.presenceSubscribe(jid)
    await sock.sendPresenceUpdate('composing', jid)

    if (userResponse.includes('event_voice')) {
        await flowDynamic("dame un momento para escucharte...🙉");
        console.log("🤖 voz a texto....");
        const text = await handlerAI(ctx);
        console.log(`🤖 Fin voz a texto....[TEXT]: ${text}`);
        userResponseVoice = text
        userResponse = userResponseVoice
    }
    
    // SALUDO incializa el flujo
    if (paramsFlowInteraction.nivel_titulo === tituloNivel.saludoIncial || paramsFlowInteraction.nivel_titulo === tituloNivel.estarAtento) {        

        console.log('saludo inicial');
        if (paramsFlowInteraction.nivel_titulo === tituloNivel.saludoIncial ) {
            await saludoInicial(infoPedido, _num_telefono, sock, jid, isSaludo, userResponse)            
            if (isSaludo) {                
                paramsFlowInteraction.nivel_titulo = tituloNivel.estarAtento
                guardarDatosLocalBD(infoPedido, infoFlowPedido, paramsFlowInteraction, idUserTable, database)
                
                return await getResponseCore(isFromAction, flowDynamic, fallBack, 'Dime lo que necesitas.') 
                // return await fallBack('Dime lo que necesitas.')
            }
        }

        // muestra las opciones que le puede ayudar y espera un numero como respuesta, sino sigue con lo que respondio el usuario
        if (paramsFlowInteraction.showOptionBotNoEntendio) {
            userResponse = getOptionFromNumber(userResponse)
            // paramsFlowInteraction.showOptionBotNoEntendio = false
        }

        
        // INICIA CHATGPT
        let chatGpt = new ChatGPT('asistente', 'cliente', infoPedido)        
        modelResponse = await chatGpt.sendMessage(userResponse)
        modelResponse = modelResponse.replace('asistente:', '').trim()

        console.log('modelResponse saludo inicial', modelResponse);

        // QUE OPCION DESEA
        // segun su respuesta
        await sock.presenceSubscribe(jid)
        await sock.sendPresenceUpdate('composing', jid)

        const rptOption = listOptions(infoPedido, infoFlowPedido, paramsFlowInteraction, userResponse, modelResponse, isSaludo)        
        guardarDatosLocalBD(infoPedido, infoFlowPedido, paramsFlowInteraction, idUserTable, database)        

        if (!isSaludo || rptOption !== '') {
            await sock.sendMessage(jid, { text: rptOption })
        }
    } 

    // el cliente tiene la intencion de realizar un pedido o reserva
    // le ofrecemos ver la carta o esperar a que le tomemos el pedido
    if (paramsFlowInteraction.nivel_titulo === tituloNivel.deseaRealizarUnPedido || paramsFlowInteraction.nivel_titulo === tituloNivel.deseaHacerUnaReserva) { 
        console.log('desea hacer un pedido');
        // const rptModelFlow = `¿Ya sabe que pedir o desea ver la carta? 🎴`
        const rptModelFlow = `Digame su pedido. O desea ver la carta? 🎴`
        paramsFlowInteraction.nivel_titulo = tituloNivel.estarAtento
        guardarDatosLocalBD(infoPedido, infoFlowPedido, paramsFlowInteraction, idUserTable, database)
        await fallBack(rptModelFlow)
    }

    
    // el cliente esta haceiendo un  pedido
    if (paramsFlowInteraction.nivel_titulo === tituloNivel.hacerPedido) {                
        let rptModelFlow = ''

        // chequea el horario
        const [isCartaActiva, listCartasActivas, msjCarta] = await consultarHorario(infoSede)
        if (!isCartaActiva) {
            guardarDatosLocalBD(infoPedido, infoFlowPedido, paramsFlowInteraction, idUserTable, database)
            return await endFlow(msjCarta)
        }


        if (paramsFlowInteraction.showOptionBotNoEntendio) {
            rptModelFlow = mensageTomarPedido
            paramsFlowInteraction.showOptionBotNoEntendio = false
        } else {
            rptModelFlow = await tomarPedido(ctx, infoPedido, infoSede, userResponseVoice, { provider, flowDynamic })
        }

        guardarDatosLocalBD(infoPedido, infoFlowPedido, paramsFlowInteraction, idUserTable, database)

        if (rptModelFlow === 'go tienda en linea' ) {
            await endFlow()
        }         

        // si confirmo y debe continuar el flujo a confirmar pedido
        if (paramsFlowInteraction.nivel_titulo === tituloNivel.confirmarPedido ) {
            await sock.sendMessage(jid, { text: rptModelFlow })
        }
        else {
            return await getResponseCore(isFromAction, flowDynamic, fallBack, rptModelFlow) 
        }

    }

    // confimar pedido
    if (paramsFlowInteraction.nivel_titulo === tituloNivel.confirmarPedido) {        
        const rptModelFlow = await confimarPedido(paramsFlowInteraction, ctx, infoPedido, infoSede, userResponseVoice, { provider, flowDynamic })        
        guardarDatosLocalBD(infoPedido, infoFlowPedido, paramsFlowInteraction, idUserTable, database)        

        await fallBack(rptModelFlow)
    }

    // ver carta
    if (paramsFlowInteraction.nivel_titulo === tituloNivel.verCarta) {    
        // consulta horarios
        paramsFlowInteraction.showOptionBotNoEntendio = false
        const [isCartaActiva, listCartasActivas, msjCarta] = await consultarHorario(infoSede)

        paramsFlowInteraction.nivel_titulo = tituloNivel.estarAtento 

        if (isCartaActiva) {
            await enviarCarta(listCartasActivas, sock, jid)
            infoFlowPedido.userResponsePrevius = '' // no es pedido
            // paramsFlowInteraction.nivel_titulo = tituloNivel.hacerPedido
            guardarDatosLocalBD(infoPedido, infoFlowPedido, paramsFlowInteraction, idUserTable, database)
            
            // await fallBack(mensageTomarPedido)
            return await getResponseCore(isFromAction, flowDynamic, fallBack, mensageTomarPedido) 
        } else {
            // paramsFlowInteraction.nivel_titulo = tituloNivel.saludoIncial            
            guardarDatosLocalBD(infoPedido, infoFlowPedido, paramsFlowInteraction, idUserTable, database)
            await endFlow(msjCarta)
        }

    }

    // consulatar plato
    if (paramsFlowInteraction.nivel_titulo === tituloNivel.consultarPlato || paramsFlowInteraction.nivel_titulo === tituloNivel.consultarQueHay) {        
        const rptModelFlow = await consultarDisponibilidadPlato(paramsFlowInteraction,ctx,infoPedido,infoSede, { provider })
        guardarDatosLocalBD(infoPedido, infoFlowPedido, paramsFlowInteraction, idUserTable, database)
        // await fallBack(rptModelFlow)
        return await getResponseCore(isFromAction, flowDynamic, fallBack, rptModelFlow) 
    }

    
    // enviar comprobante
    if (paramsFlowInteraction.nivel_titulo === tituloNivel.enviarComprobante) {          
        paramsFlowInteraction.showOptionBotNoEntendio = false
        const rptModelFlow = await enviarComprobante(paramsFlowInteraction, ctx, infoPedido, infoSede, { provider })
        guardarDatosLocalBD(infoPedido, infoFlowPedido, paramsFlowInteraction, idUserTable, database)
        // await fallBack(rptModelFlow)
        // console.log('comprobante');      
        return await getResponseCore(isFromAction, flowDynamic, fallBack, rptModelFlow) 
    }

    // consultar horario
    if (paramsFlowInteraction.nivel_titulo === tituloNivel.consultarHorario) {
        // await sock.sendMessage(jid, { text: tituloNivel.consultarHorario })

        const rptModelFlow = soloHorariosAtencion(infoSede) 
        paramsFlowInteraction.nivel_titulo = tituloNivel.estarAtento
        guardarDatosLocalBD(infoPedido, infoFlowPedido, paramsFlowInteraction, idUserTable, database)        
        // await fallBack(rptModelFlow)
        return await getResponseCore(isFromAction, flowDynamic, fallBack, rptModelFlow) 
    }

    // solicitar nombre
    if (paramsFlowInteraction.nivel_titulo === tituloNivel.solicitarNombre || paramsFlowInteraction.nivel_titulo === tituloNivel.actualizarNombre) {
        const rptModelFlow = await cambiarNombreCliente(paramsFlowInteraction, ctx, infoPedido, infoSede, { provider })
        guardarDatosLocalBD(infoPedido, infoFlowPedido, paramsFlowInteraction, idUserTable, database)        
        // await fallBack(rptModelFlow)    
        return await getResponseCore(isFromAction, flowDynamic, fallBack, rptModelFlow)     
    }

    // no entendio muestra las opcione que puede ayudar
    if (paramsFlowInteraction.nivel_titulo === tituloNivel.noEntendido && !isSaludo) {     
        console.log('no entendio ==== >')

        paramsFlowInteraction.nivel_titulo = tituloNivel.estarAtento
        paramsFlowInteraction.showOptionBotNoEntendio = true   

        const _rptModelFlow = await noEntendido(paramsFlowInteraction, ctx, infoPedido, infoSede, false, { provider }) 
        const rptModelFlow = _rptModelFlow.msj

        // console.log('infoPedido guarda', infoPedido);

        guardarDatosLocalBD(infoPedido, infoFlowPedido, paramsFlowInteraction, idUserTable, database)        
        // await fallBack(rptModelFlow)   
        return await getResponseCore(isFromAction, flowDynamic, fallBack, rptModelFlow)      
    }


}

async function getResponseCore(isFromAction, flowDynamic, fallBack, msj) {
    return isFromAction ? await flowDynamic(msj) : await fallBack(msj)
}


function guardarDatosLocalBD(infoPedido: ClassInformacionPedido, infoFlowPedido: any, paramsFlowInteraction: any, idUserTable: string, database: SqliteDatabase) {
    infoPedido.setVariablesFlowPedido(infoFlowPedido)
    infoPedido.setVariablesFlowInteraccion(paramsFlowInteraction)     
    infoPedido.setVariablesFlowConfirmarPedido(infoPedido.getVariablesFlowConfirmarPedido())    
    database.guadarInfoDataBase(infoPedido, idUserTable)
}  