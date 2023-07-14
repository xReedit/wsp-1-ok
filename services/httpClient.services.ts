// import { config } from '../config';
// import fetch from 'node-fetch';
// import fetch from 'node-fetch'; 
import axios from 'axios';

import endpoint from '../endpoints.config';

const PUBLIC_API_KEY = endpoint.url_api_restobar // process.env.URL_API_RESTOBAR

// export function get apirest
export const getData = async (controller: string, event: string, payload: any = null): Promise<any>  => {
    const url = `${PUBLIC_API_KEY}/${controller}/${event}`    

    // const requestOptions: RequestInit = {
    //     method: 'GET',
    //     headers: {
    //         'Content-Type': 'application/json'
    //     }
    // };

    // if (payload) {
    //     requestOptions.body = JSON.stringify(payload);
    // }

    // try {
    //     const response = await fetch(url, {
    //         method: 'GET',
    //         headers: { 'Content-Type': 'application/json' }
    //     });
    //     const jsonData = await response.json();
    //     return jsonData;
    // } catch (error) {
    //     // Manejo de errores
    //     console.error(error);
    //     throw new Error('Error al obtener los datos');
    // }

    // console.log('controller', controller);
    // console.log('event', event);    
    // console.log('url', url);
     try {
         const response = await axios.get(url);
         return response.data;
     } catch (error) {
        console.error(error);
         throw new Error('Error al obtener los datos');
     }

    // const response = await fetch(url, {
    //         method: 'GET',
    //         headers: { 'Content-Type': 'application/json' }
    //     })

    // console.log('response', response);
    // console.log('response', response);

    // let response;
    // try {
    //     if (payload) {
    //         response = await fetch(url, {
    //             method: 'GET',
    //             headers: {},
    //             body: JSON.stringify(payload)
    //         })
    //     } else {
    //         response = await fetch(url, {
    //             method: 'GET',
    //             headers: {}
    //         })
    //     }
    // } catch (error) {
    //     console.error(error);
    //     throw new Error('Error al obtener los datos');
    // }
    

    //return response.json()
}

// export function post apirest
export const postDataBot = async (controller: string, event: string, payload: any) => {
    const url = `${PUBLIC_API_KEY}/${controller}/${event}`
    // const token = localStorage.getItem('token')
    // const headers = {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${token}`
    // }

    const _rpt = await fetch(url, {
        method: 'POST',
        headers: {},
        body: JSON.stringify(payload)
    })

    return _rpt.json()
}

// export function post apirest
export const postData = async (controller: string, event: string, payload: any) => {
    const url = `${PUBLIC_API_KEY}/${controller}/${event}`
    const token = localStorage.getItem('token')
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    }

    return await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
    })
}

export const postDataJSON = async (controller: string, event: string, payload: any) => {
    const url = `${PUBLIC_API_KEY}/${controller}/${event}`
    const token = localStorage.getItem('token')
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    }
    const _rpt = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
    })

    return _rpt.json()
}

// export function put apirest
export const putData = async (controller: string, event: string, payload: any = null) => {
    const url = `${PUBLIC_API_KEY}/${controller}/${event}`
    const token = localStorage.getItem('token')
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    }
    return await fetch(url, {
        method: 'PUT',
        headers,
        body: payload ? JSON.stringify(payload) : payload
    })
}


// enviar pedido al api de pedidos
export const postDataPedidoBot = async (controller: string, event: string, payload: any) => {
    const url = `${endpoint.url_api_pedido}/${controller}/${event}`
    // const token = localStorage.getItem('token')
    const headers = {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${token}`
    }

    //try {
      //  await fetch(url, {
        //    method: 'POST',
          //  headers,
            //body: JSON.stringify(payload)
        //})
    //} catch (error) {
      //  console.log('postDataPedidoBot', error);
    //}

     try {
         const response = await axios.post(url, payload);
         return response.data;
     } catch (error) {
    //     console.error(error);
         throw new Error('Error al enviar los datos');
     }
}
