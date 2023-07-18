
// import { createClient } from '@google/maps';
// import { Client } from '@googlemaps/google-maps-services-js';
// import { config } from "../config";

// import dotenv from 'dotenv';
// dotenv.config();

// import fetch from 'node-fetch';
import axios from 'axios';
import endpoint from '../endpoints.config';

export class GeolocationServices {
    
    // private apiKey = config.API_KEY_GOOGLE;
    private apiKey = endpoint.api_key_google
    // private googleMapsClient

    constructor() {       
        // this.googleMapsClient = new Client({});
        // this.googleMapsClient.key = this.apiKey;
    }

    async getCoordenadas(direccion: string, ciudades: string) {
        let coordenadas: { latitud: number, longitud: number } = { latitud: 0, longitud: 0 };
        let response: any;
        const arrCuidades = ciudades.split(',');
        // console.log('arrCuidades', arrCuidades);    

        for (const key in arrCuidades) {
            const ciudad = arrCuidades[key].trim();
            try {
                // console.log('direccion buscar ', `${direccion}, ${ciudad}`);
                response = await <any>this.searchCoordenadas(direccion, ciudad);            
                // console.log('direccion response', response);
                break;
            } catch (error) {
                response = false
            }
        }
        return response
        
    };

    async searchCoordenadas(coordenadasOdireccion: string, ciudad: string) {        
        // direccion = `${direccion} ${ciudad}`

        let direccion: string;
        let isCoordenadas = false
        // console.log('¿coordenadasOdireccion', coordenadasOdireccion);
        if (coordenadasOdireccion.includes(',')) {
            // Si se proporcionan coordenadas, se usa directamente como dirección
            direccion = coordenadasOdireccion;
            isCoordenadas = true
        } else {
            // Si se proporciona una dirección escrita, se combina con la ciudad
            direccion = `${coordenadasOdireccion} ${ciudad}`;
        }

        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(direccion)}&key=${this.apiKey}`;
        // console.log('url direccion buscar', url);

        try {
            const response = await axios.get(url);
            // const response = await fetch(url);
            // const data = await response.json();
            const data = response.data

            if (data.results.length > 0) {

                const wordsToCheck = ['street_address', 'route', 'neighborhood', 'establishment', 'school', 'point_of_interest', 'park', 'tourist_attraction'];
                const _types = data.results[0].types.join(',');
                const includesAnyWord = wordsToCheck.some(word => _types.includes(word));

                // console.log('data.results', data.results);
                if (includesAnyWord) { 
                    const location = data.results[0].geometry.location;
                    const ciudadDireccionEncontrada = data.results[0].address_components.flatMap((item: any) => item.types.includes('locality') ? item.long_name : []).join(' ')
                    
                    return { 
                        latitude: location.lat,
                        longitude: location.lng,
                        ciudad: ciudadDireccionEncontrada,
                        provincia: data.results[0].address_components.flatMap((item: any) => item.types.includes('administrative_area_level_2') ? item.long_name : []).join(' '),
                        departamento: data.results[0].address_components.flatMap((item: any) => item.types.includes('administrative_area_level_1') ? item.long_name : []).join(' '),
                        pais: data.results[0].address_components.flatMap((item: any) => item.types.includes('country') ? item.long_name : []).join(' '),
                        direccion: !isCoordenadas ? direccion : data.results[0].formatted_address,
                        codigo_postal: data.results[0].address_components.flatMap((item: any) => item.types.includes('postal_code') ? item.long_name : []).join(' '),   
                        is_georreferencial: 1
                    };
                } else {
                    throw new Error('No se encontraron resultados para la dirección especificada.');
                }
            } else {
                throw new Error('No se encontraron resultados para la dirección especificada.');
            }
        } catch (error) {
            throw new Error('Ocurrió un error al obtener las coordenadas de la dirección.');
        }
    }


    async getDistanciaRutaMasCorta(origen: string, destino: string): Promise<number> {        

        // try {
        //     const response = await this.googleMapsClient.directions({
        //         params: {
        //             origin,
        //             destino,
        //             mode: 'driving',                    
        //         },
        //     });

        //     const route = response.data.routes[0];
        //     // const leg = route.legs[0];
        //     const distancia = route.legs.reduce((total, leg) => total + leg.distance.value, 0);
        //     return distancia / 1000;
            
        // } catch (error) {
        //     throw new Error('Error al calcular la dirección más corta.');
        // }

        // // try {
        // //     const response = await this.googleMapsClient.directions({
        // //         origin: origen,
        // //         destination: destino,
        // //         mode: 'driving',
        // //         alternatives: true
        // //     }).asPromise();

        // //     const ruta = response.json.routes[0];
        // //     const distancia = ruta.legs.reduce((total, leg) => total + leg.distance.value, 0);
        // //     return distancia / 1000;
        // // } catch (error) {
        // //     console.log('error', error);
        // //     throw new Error('Ocurrió un error al obtener la ruta entre las coordenadas.');
        // // }
        
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origen)}&destination=${encodeURIComponent(destino)}&key=${this.apiKey}`;

        const requestOptions = {
            mode: 'no-cors',
            headers: {
                'Access-Control-Allow-Origin': '*'
            }
        };

        try {
            // const response = await fetch(url, {                
            //     headers: {
            //         'Access-Control-Allow-Origin': '*'
            //     }
            // });

            const response = await axios.get(url, {
                headers: {
                    'Access-Control-Allow-Origin': '*'
                }
            });

            const data = response.data;

            // const response = await fetch(url, { mode: 'no-cors' });
            // console.log('¿response', response);
            // const data = await response.json();

            if (data.routes && data.routes.length > 0) {
                const ruta = data.routes[0];
                const distancia = ruta.legs.reduce((total: number, leg: any) => total + leg.distance.value, 0);
                return distancia / 1000; // Convertir a kilómetros
            } else {
                throw new Error('No se encontró una ruta entre las coordenadas especificadas.');
            }
        } catch (error) {
            throw new Error('Ocurrió un error al obtener la ruta entre las coordenadas.');
        }
    }

    async calcularCostoServicio(coordenadaOrigen: any, coordenadaDestino: any, parametros: any) {
        const radioBasico = parametros.km_base; // Radio básico de 2 km
        const costoBasico = parametros.km_base_costo; // Costo básico de $3.00
        const costoAdicionalPorKilometro = parametros.km_adicional_costo; // Costo adicional por kilómetro de $2.00
        const radioMaximo = parametros.km_limite; // Radio máximo de 10 km

        // const distanciaEnKm = await this.getDistanciaRutaMasCorta(coordenadaOrigen, coordenadaDestino);
        const distanciaEnKm = this.calcularDistanciaNoApi(coordenadaOrigen, coordenadaDestino);

        if (distanciaEnKm > radioMaximo) {
            return { mensaje: "😔 Lo siento, el servicio no disponible en esta zona 🗺️\n Verifique que la direccion sea la correcta. *Tambien puede adjuntarnos su ubicación.*", success: false };
        }

        let costoServicio = costoBasico;
        const distanciaAdicional = distanciaEnKm - radioBasico;

        if (distanciaAdicional > 0) {
            const costoAdicional = distanciaAdicional * costoAdicionalPorKilometro;
            costoServicio += Math.round(costoAdicional); // redondea
        }

        return { distancia_en_km: distanciaEnKm.toFixed(2), costo_servicio: costoServicio, success: true };
    }



    calcularDistanciaNoApi(origen: string, destino: string): number {
        // console.log('origen', origen);
        // console.log('destino', destino);
        const [lat1, lon1] = origen.split(',').map(Number);
        const [lat2, lon2] = destino.split(',').map(Number);
        
        const earthRadiusKm = 6371; // Radio de la Tierra en kilómetros
        const dLat = this.degreesToRadians(lat2 - lat1);
        const dLon = this.degreesToRadians(lon2 - lon1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.degreesToRadians(lat1)) * Math.cos(this.degreesToRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = earthRadiusKm * c;

        return distance;
    }

    degreesToRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }


    async calcularSubtotaCostoEntrega(origen: string, destino: string, parametros) {
        // costo de entrega
        const arrCostoEntrega = await this.calcularCostoServicio(origen, destino, parametros)
        // console.log('arrCostoEntrega', arrCostoEntrega);
        
        if (arrCostoEntrega.success === false) {
            return arrCostoEntrega
        }
        // subtotal de costo de entrega
        const subtotalCostoEntrega = {
            "id": 0,
            "quitar": true,
            "importe": arrCostoEntrega.costo_servicio.toFixed(2),
            "tachado": false,
            "visible": true,
            "esImpuesto": 0,
            "descripcion": "Costo de entrega",
            "visible_cpe": false,
            "distancia_km": arrCostoEntrega.distancia_en_km,
            "success": true
        }

        return subtotalCostoEntrega
    }
}