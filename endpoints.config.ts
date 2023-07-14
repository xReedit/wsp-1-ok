import dotenv from 'dotenv'
dotenv.config();

export default {
    url_api_restobar: process.env.URL_API_RESTOBAR ?? '',
    port_api: process.env.PORT_API ?? '',
    port: process.env.PORT ?? '',
    port_socket: process.env.PORT_SOCKET ?? '',
    openai_api_key: process.env.OPENAI_API_KEY ?? '',
    api_key_google: process.env.API_KEY_GOOGLE ?? '',
    url_api_pedido: process.env.URL_API_PEDIDO ?? '',
    url_img_carta: process.env.URL_IMG_CARTA ?? ''
}