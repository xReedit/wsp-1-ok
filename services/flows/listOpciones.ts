import { ClassCliente } from "../../clases/cliente"
import { ClassInformacionPedido, tituloNivel } from "../../clases/info.pedido.class"
import { SqliteDatabase } from "../sqlite.services"
import { capitalize, quitarTildes } from "../utiles"


export const listOptions = (
    infoPedido: ClassInformacionPedido,    
    infoFlowPedido: any,
    paramsFlowInteraction: any,    
    userResponse: string,
    modelResponse: string,
    isSaludo: boolean
    ): string => {

    modelResponse = quitarTildes(modelResponse)
    modelResponse = modelResponse.replace('asistente:', '').trim()
    console.log('modelResponse   --', modelResponse);

    let isConsultarPlato = false
    let isOpcion = modelResponse.includes('opcion:')
    let laOpcion = ''
    let rptOption = ''
    let nombreCliente = ''    

    console.log('isOpcion', isOpcion);
    if (isOpcion) {
        isConsultarPlato = modelResponse.includes('opcion:3')

        laOpcion = modelResponse.split(':')[1].trim()
        console.log('laOpcion', laOpcion);

        const IsUpdateNombreOption6 = laOpcion.includes('6') 
        if (IsUpdateNombreOption6) {
            nombreCliente = laOpcion.split('-')[1].trim()            
            laOpcion = '6'
            if (nombreCliente === 'solicitar_nombre'){
                laOpcion = '7'
            }            
        }
    }

    infoFlowPedido.userResponsePrevius = userResponse
    infoFlowPedido.optionPrevius = laOpcion    
    paramsFlowInteraction.nivel = laOpcion

    // consultar plato opcion:3-nombre_del_plato
    console.log('isConsultarPlato', isConsultarPlato);
    laOpcion = isConsultarPlato ? '3' : laOpcion
    console.log('laOpcion -', laOpcion);

    switch (laOpcion) {
        case '0':            
            rptOption = isSaludo ? `Sera un gusto ayudar hoy 🙂` : `😔 *Lo siento*, Te puedo ayudar con lo siguiente:`;
            paramsFlowInteraction.nivel_titulo = isSaludo ? tituloNivel.estarAtento  : tituloNivel.noEntendido
            break;
        case '1':
            rptOption = `Ok, entiendo que desea pedir, un momento porfavor.`;               
            paramsFlowInteraction.nivel_titulo = tituloNivel.hacerPedido
            break;
        case '2':
            rptOption = `Ok, te adjunto la carta 📎`;  
            paramsFlowInteraction.nivel_titulo = tituloNivel.verCarta        
            break;
        case '3':
            // el modelo de respuesta es: opcion:3-nombre_del_plato
            infoFlowPedido.userResponsePrevius = modelResponse
            rptOption = `Ok, estoy consultando un momento por favor.`;
            paramsFlowInteraction.nivel_titulo = tituloNivel.consultarPlato
            break;
        case '4':
            rptOption = `📃Ok, para enviarte el comprobante necesitamos algunos datos.`;                                    
            paramsFlowInteraction.nivel_titulo = tituloNivel.enviarComprobante
            break;
        case '5':
            rptOption = `Un momento, estoy chequeando nuestro horario de atención. ⏱️`;
            paramsFlowInteraction.nivel_titulo = tituloNivel.consultarHorario
            break;
        case '6':
            nombreCliente = capitalize(nombreCliente)
            rptOption = `Ok, actualizare su nombre.`
            // const _cliente = infoPedido.getCliente()
            // const clienteInfo = new ClassCliente()
            // clienteInfo.setCliente(_cliente)

            // clienteInfo.setNombre(nombreCliente)
            // infoPedido.setCliente(clienteInfo)
            
            infoFlowPedido.nombreClienteCambiar = nombreCliente

            paramsFlowInteraction.nivel_titulo = tituloNivel.actualizarNombre
            break;
        case '7':
            rptOption = ``;
            paramsFlowInteraction.nivel_titulo = tituloNivel.solicitarNombre
            break;
        case '8': // que platos hay
            rptOption = `Ok, estoy consultanto, un momento porfavor.`;
            paramsFlowInteraction.nivel_titulo = tituloNivel.consultarQueHay
            break;
        case '9': // tiene intension de hacer un pedido
            rptOption = `Excelente 🫡.`;
            paramsFlowInteraction.nivel_titulo = tituloNivel.deseaRealizarUnPedido
            break;
    }

    return rptOption;
    // await sock.sendMessage(jid, { text: rptOption })

}