// exportar funcion para hacer la primera letra de un string en mayuscula

const { downloadMediaMessage } = require('@adiwajshing/baileys');
import { convertOggMp3 } from "./convert";
import { voiceToText } from "./whisper";
import fs from 'node:fs/promises';

// import { voiceToText } from './services/whisper';

import { DateTime } from 'luxon';


export const capitalize = (s: string) => {
    s = s.toLowerCase()
    return s.charAt(0).toUpperCase() + s.slice(1)
}

// una lista de saludos coordiales que adjunta el nombre del cliente, y se escogera uno al azar
export const saludosBienvenida = (nombre: string) => {
    const listSaludos = [
        `👋 Hola *${nombre}*, que gusto saludarte nuevamente.\nSoy Piter su asistente virtual. ¿en qué le puedo ayudar hoy?`,
        `👋 Hola *${nombre}*, Soy Piter su asistente virtual\n¿en qué puedo ayudarte hoy?`,
        `👋 Hola *${nombre}*, ${obtenerSaludoSegunHora()}\nSoy Piter su asistente virtual. Será un gusto ayudarte hoy.`,
        `👋 Hola *${nombre}*, Soy Piter su asistente virtual. Será un placer ayudarte hoy`,
        `👋 Hola *${nombre}*, Soy Piter su asistente virtual, que bueno saludarte nuevamente\n¿en qué te puedo ayudar?`,
        `👋 Hola *${nombre}*, Soy Piter su asistente virtual. Espero que te encuentres bien`
    ]

    const lengthList = listSaludos.length

    return listSaludos[Math.floor(Math.random() * lengthList)]
}

export const delay = (ms) => new Promise((res => setTimeout(res, ms)))

function obtenerSaludoSegunHora(): string {
    const fechaActual = new Date();
    const hora = fechaActual.getHours();

    let saludo = "";

    if (hora >= 6 && hora < 12) {
        saludo = "buenos días";
    } else if (hora >= 12 && hora < 18) {
        saludo = "buenas tardes";
    } else {
        saludo = "buenas noches";
    }

    return saludo;
}

// exportar funcion para determinar si una carta esta activa o no, segun el horario (hora_ini:string, hora_fin: string) hora_ini y hora_fin es un string con formato de hora 24 horas
// a la funcion le pasare una lista de cartas y me devolvera una lista de cartas activas
export const getItemCartaActiva = (listCarta: any) => {
    // const fechaActual = new Date();
    // const fechaActual = obtenerFechaHoraPorZonaHoraria2();
    // const hora = fechaActual.getHours();
    // const minutos = fechaActual.getMinutes();

    const { fechaActual, hora, minutos } = obtenerHoraMinutosPorZonaHoraria3('America/Lima');
    
    

    const horaActual = new Date(`2023-01-01 ${hora}:${minutos}:00`)


    let listpt = []
    listCarta.filter((item) => {
        // convertir item.hora_ini y item.hora_fin de string a date, ejemplo '13:00' => '2021-01-01 13:00:00
        const _hora_ini = new Date(`2023-01-01 ${item.hora_ini}:00`)
        const _hora_fin = new Date(`2023-01-01 ${item.hora_fin}:00`)
        
        let isActivo = horaActual >= _hora_ini && horaActual <= _hora_fin

        // si es activo tambien debe estar activo el dia, esto se debe hacer opteniendo el numero de dia de la semana
        // y compararlo con el campo  dia_disponible que es un string con los numeros de dia, ejemplo: dia_disponible = '1,2,3,4,5,6'
        // tener en cuenta que domingo es el dia 1 y sabado es el dia 7
        const _dia_actual = fechaActual.getDay()+1
        const _dia_disponible = item.dia_disponible.split(',')
        isActivo = isActivo && _dia_disponible.includes(_dia_actual.toString())        


        if (isActivo) {
            listpt.push(item)
        }
    })



    return listpt
}



export const handlerAI = async (ctx) => {
    /**
     * OMITIR
     */
    const buffer = await downloadMediaMessage(ctx, "buffer");
    const _dateNow = Date.now()
    const pathTmpOgg = `${process.cwd()}/tmp/voice-note-${_dateNow}.ogg`;
    const pathTmpMp3 = `${process.cwd()}/tmp/voice-note-${_dateNow}.mp3`;
    await fs.writeFile(pathTmpOgg, buffer);
    await convertOggMp3(pathTmpOgg, pathTmpMp3);
    const text = await voiceToText(pathTmpMp3);
    return text; //el habla1!!
    /**
     * OMITIR
     */
};


//function que recibe la hora en string '18:30' y devuelve otro string en formato 12hrs ej: 6:30pm
export const convertirHora12hrs = (hora: string) => {
    const _hora = hora.split(':')
    const _hora12hrs = parseInt(_hora[0]) > 12 ? `${parseInt(_hora[0]) - 12}:${_hora[1]}pm` : `${_hora[0]}:${_hora[1]}am`
    return _hora12hrs    
}

export const cleanText = (inputText) => {
    return inputText
}

export function obtenerClavesSinDatos(objeto) {
    const clavesSinDatos = [];

    for (const clave in objeto) {
        if (objeto.hasOwnProperty(clave) && objeto[clave] === '') {
            clavesSinDatos.push(clave.toLowerCase().replace(/_/g, ' '));
        }
    }

    return clavesSinDatos;
}

export function obtenerHoraActualPorZonaHoraria(_timeZone: string = 'America/Lima'): Date {
    const fechaActual = new Date().toLocaleString('en-US', { timeZone: _timeZone });    
    const [fecha, hora] = fechaActual.split(', ');
    const _hora = hora.split(' ')[0];
    console.log('¿fecha', fecha);
    console.log('¿hora', _hora);
    const dateParts = fecha.split('/');
    const formattedDate = `${dateParts[2]}-${dateParts[0].padStart(2, '0')}-${dateParts[1].padStart(2, '0')}`;
    const stringDate = `${formattedDate} ${_hora}`;

    console.log('stringDate', stringDate);
    
    // const [mes, dia, anio] = fecha.split('/');
    // const [horaParte, minutosParte, segundosParte] = hora.split(':');
    // const horaActual = new Date(Number(anio), Number(mes) - 1, Number(dia), Number(horaParte), Number(minutosParte), Number(segundosParte));

    return new Date(stringDate);
}

export function obtenerFechaHoraPorZonaHoraria(_timeZone: string = 'America/Lima'): Date {
    const fechaHoraActual = new Date().toLocaleString('en-US', { timeZone: 'America/Lima' });    
    console.log('¿fechaHoraActual', fechaHoraActual);
    const formattedDateString = fechaHoraActual.replace(/ /g, ' ');
    console.log('formattedDateString', formattedDateString);
    const fechaHoraZonaHoraria = new Date(formattedDateString);    

    return fechaHoraZonaHoraria;
}

export function obtenerFechaHoraPorZonaHoraria2(timeZone: string = 'America/Lima'): Date {
    const fechaHoraActual = DateTime.now().setZone(timeZone).toJSDate();
    console.log('¿fechaHoraActual', fechaHoraActual);
    return fechaHoraActual;
}

export function obtenerHoraMinutosPorZonaHoraria3(timeZone: string): { fechaActual: Date, hora: number, minutos: number } {
    const fechaHoraActual = DateTime.now().setZone(timeZone);
    const fechaActual = fechaHoraActual.toJSDate();
    const hora = fechaHoraActual.hour;
    const minutos = fechaHoraActual.minute;

    return { fechaActual, hora, minutos };
}

export function formatPadArrayToString(data, isConPuntos = true) {
    let stringFormatted = '';
    const maxLength = 55; // Longitud máxima de la línea
    const maxDescripcionLength = 27; // Nueva longitud máxima para la descripción

    const _separacion = isConPuntos ? '..' : ' '

    data.forEach(item => {
        let descripcion = item.descripcion;
        if (isConPuntos && descripcion.length > maxDescripcionLength) {
            descripcion = descripcion.substring(0, maxDescripcionLength - 3) + '...';
        }

        const lentghDescripcion = descripcion.length;
        const lentghImporte = item.importe.length;
        const espacioDerecha = maxLength - (lentghDescripcion);
        const conceptoFormatted = descripcion.toLowerCase().padEnd(espacioDerecha, _separacion);
        const montoFormatted = item.importe.padStart(5, ' ');

        stringFormatted += `${conceptoFormatted}${montoFormatted}\n`;
    });


    return stringFormatted
}


// obtener la lista de productos y precios
export function getListaProductosArrayToString(tipoConsumoSeleted: any): string {
    let stringFormatted = '';

    let newItem = { descripcion: '', importe: '' }
    tipoConsumoSeleted.secciones.map((seccion: any) => {
        newItem.descripcion = `*${seccion.des.toUpperCase()}*`
        newItem.importe = '.'

        const _tituloSeccion = [newItem]
        let listItemSesccion = []

        stringFormatted += formatPadArrayToString(_tituloSeccion, false)

        seccion.items.map((item: any) => {
            const _newItem = { descripcion: `${item.cantidad_seleccionada} ${item.des}`, importe: parseFloat(item.precio_print).toFixed(2).toString() } 
            listItemSesccion.push(_newItem)
        })       
        
        stringFormatted += formatPadArrayToString(listItemSesccion, true)
    })

    return stringFormatted
}

export function quitarTildes(cadena) {
    const tildes = {
        'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
        'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U'
    };

    return cadena.replace(/[áéíóúÁÉÍÓÚ]/g, tilde => tildes[tilde]);
}

export function getObjectKeys(obj: any): string[] {
    return Object.keys(obj);
}


export function extraerSoloCamposFaltantes(datos: any): any {
    const camposFaltantes: any = {};

    for (const key in datos) {
        if (datos.hasOwnProperty(key) && datos[key] === "") {
            camposFaltantes[key] = "";
        }
    }

    return camposFaltantes;
}

// export const soundex = (word: string): string => {
//     const mapping: Record<string, string> = {
//         A: "0", E: "0", I: "0", O: "0", U: "0", Y: "0",
//         B: "1", F: "1", P: "1", V: "1",
//         C: "2", G: "2", J: "2", K: "2", Q: "2", S: "2", X: "2", Z: "2",
//         D: "3", T: "3",
//         L: "4",
//         M: "5", N: "5",
//         R: "6"
//     };

//     const firstChar = word.charAt(0).toUpperCase();
//     let encoded = firstChar;

//     for (let i = 1; i < word.length; i++) {
//         const char = word.charAt(i).toUpperCase();
//         if (mapping[char] && mapping[char] !== mapping[firstChar]) {
//             encoded += mapping[char];
//         }
//     }

//     encoded = encoded.replace(/0/g, "");

//     while (encoded.length < 4) {
//         encoded += "0";
//     }

//     return encoded.slice(0, 4);
// }