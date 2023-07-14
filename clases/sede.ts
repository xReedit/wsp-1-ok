// clase sede - informacion de la sede, horarios de atencion, canales de consumo
export class ClassInfoSede {
    private sede: any;

    constructor(sede: any) {
        this.sede = sede;
    }


    public setSede(sede: any) {
        this.sede = sede;
    }

    public getSede(): any {
        return this.sede.sede;
    }

    public getHorariosAtencion(): any {
        return this.sede.listHorariosAtencion;
    }

    public getlistCanalConsumo(): any {
        return this.sede.listCanalConsumo;
    }

    public getlistTipoPago(): any {
        return this.sede.listTipoPago;
    }

    public getlistImpresoras(): any {
        return this.sede.listImpresoras;
    }

    public getConfigDelivery(): any {
        return this.sede.configDelivery;
    }

    public getListReglasCarta() {
        return this.sede.listReglasCarta;
    }  

    public getSeccionMasItems() {
        return this.sede.listSeccionMasPiden;
    }
    


}