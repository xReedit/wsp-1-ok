// clase para optener el subtotal del pedido

import { getData } from "./httpClient.services";

export class getSubTotales  {
    arrReglasCarta: any[] = [];
    constructor() {
    }

    // obtner las reglas de la carta
    async getRules(idsede, idorg) {
        this.arrReglasCarta = await getData('chat-bot', `get-reglas-carta/${idsede}/${idorg}`)             
    }


    // obtener el subtotal de los items del pedido
    getTotalItemsPedido(arrSeccionesPedido: any[]) {
        let total = 0
        arrSeccionesPedido.flatMap((item: any) => { item.items.map((item: any) => { total += parseFloat(item.precio_total)})})
        return total
    }
}