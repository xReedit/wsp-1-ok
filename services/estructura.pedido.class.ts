import { EstructuraPedido } from "./interface.class";

export class ClassEstructuraPedido {
    private estructura: EstructuraPedido;

    constructor() {
        this.estructura = {
            p_body: {
                tipoconsumo: [],
            },
            p_header: {},
            p_subtotales: [],
            idpedido: 0
        };
    }

    public setTipoConsumo(tipo: any) {
        this.estructura.p_body.tipoconsumo.push(tipo);
    }    

    public setHeader(header: any) {
        this.estructura.p_header = header;
    }

    public setSubtotal(subtotal: any) {
        this.estructura.p_subtotales=subtotal;
    }

    public getEstructura(): EstructuraPedido {
        return this.estructura;
    }

    public getBody(): any {
        return this.estructura.p_body;
    }

    // public arrDatosDelivery(infoSede) {

        

    // }
}