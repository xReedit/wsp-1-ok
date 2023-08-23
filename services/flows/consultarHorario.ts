import { ClassInfoSede } from "../../clases/sede";
import { capitalize, convertirHora12hrs, getItemCartaActiva } from "../utiles";

export async function consultarHorario(
    _infoSede: ClassInfoSede    
    ): Promise<[boolean, any, string]> {    
    let infoSede: ClassInfoSede = _infoSede
    let msj = ''

    const _listaCartaHorarios = infoSede.getHorariosAtencion()
    // cartas activas segun la hora
    let _listCartasActivas = getItemCartaActiva(_listaCartaHorarios)
    const isCartaActiva = _listCartasActivas.length === 0 ? false : true

    // no hay carta disponible
    if (!isCartaActiva) {
        msj = '😔 Disculpa, estamos fuera del horario de atencion 🕰️\n'

        let rowHorarios = []
        rowHorarios.push('👉 Puede hacer su pedido en el siguiente horario: \n')

        const _saltoParrafo = _listaCartaHorarios.length > 1 ? '\n\n' : ''
        _listaCartaHorarios.forEach(async (item, index) => {
            if (item.hora_ini !== '') {
                rowHorarios.push(`*${capitalize(item.descripcion)}* de ${convertirHora12hrs(item.hora_ini)} a ${convertirHora12hrs(item.hora_fin)}\nlos dias ${item.nom_dias}${_saltoParrafo}`)
            }
        })

        msj += rowHorarios.join(',').replace(/,/g, '')        
    }


    return [isCartaActiva, _listCartasActivas, msj]
}

export function soloHorariosAtencion(_infoSede: ClassInfoSede): string {
    let infoSede: ClassInfoSede = _infoSede
    const _listaCartaHorarios = infoSede.getHorariosAtencion()    

    let rowHorarios = []
    rowHorarios.push('👉 Nuestro horario de atención es el siguiente: \n')

    const _saltoParrafo = _listaCartaHorarios.length > 1 ? '\n\n' : ''
    _listaCartaHorarios.forEach(async (item, index) => {
        if (item.hora_ini !== '') {
            const _dias = item.nom_dias.split(',').join(' ')
            rowHorarios.push(`*${capitalize(item.descripcion)}* de ${convertirHora12hrs(item.hora_ini)} a ${convertirHora12hrs(item.hora_fin)}\nlos dias: ${_dias}${_saltoParrafo}`)
        }
    })

    
    return rowHorarios.join(',').replace(/,/g, '')
}