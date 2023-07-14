export interface Subtotal {
    "id": 0,
    "quitar": false,
    "importe": '',
    "tachado": false,
    "visible": true,
    "esImpuesto": 0,
    "descripcion": "",
    "visible_cpe": true
}

export interface EstructuraPedido {
    p_body: {
        tipoconsumo: any[];
    };
    p_header: any;
    p_subtotales: Subtotal[];
    idpedido: 0
}