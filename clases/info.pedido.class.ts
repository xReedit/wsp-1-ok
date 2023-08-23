import { ClassCliente } from "./cliente";

export enum tituloNivel {
    saludoIncial = "saludoIncial",
    noEntendido = "noEntendido",
    hacerPedido = "hacerPedido",
    confirmarPedido = "confirmarPedido",
    verCarta = "verCarta",
    consultarPlato = "consultarPlato",
    consultarQueHay = "consultarQueHay",
    enviarComprobante = "enviarComprobante",
    solicitarNombre = "solicitarNombre",
    consultarHorario = "consultarHorario",
    actualizarNombre = "actualizarNombre",
    estarAtento = "estarAtento",
    deseaRealizarUnPedido = "deseaRealizarUnPedido",
}

interface EstructuraInformacion {    
        sede: any;
        cliente: ClassCliente;
        pedido_cliente: any   
        subtotalCostoEntrega: null
        isDelivery: boolean;
        isReserva: boolean;
        isRecogeLocal: boolean;
        isClienteRecogeLocal: boolean;
        solicitaCubiertos: boolean;
        canalConsumoSeleted: any;
        metodoPagoSeleted: any;
        pedidoEnviar: any;
        direccionGeolocalizada: any;
        variables_flow_pedido: any;
        variables_flow_interaccion: any;
        variables_flow_confirmar_pedido: any;    
        conversationLog: { [key: string]: any[] };
}

export class ClassInformacionPedido {    
    private estructuraInfo: EstructuraInformacion;

    constructor() {
        this.estructuraInfo = {            
                sede: {},
                cliente: new ClassCliente(),
                pedido_cliente: {},
                subtotalCostoEntrega: null,
                isDelivery: false,
                isReserva: false,
                isRecogeLocal: false,
                isClienteRecogeLocal: false,
                solicitaCubiertos: false,
                canalConsumoSeleted: {},
                metodoPagoSeleted: {},    
                pedidoEnviar: {},
                direccionGeolocalizada: {},
                variables_flow_pedido: {
                    showTomarPedido: false,
                    platosNoEcontrados: [],
                    platosSinStock: [],
                    platosEcontrados: [],
                    platosRecomendados: [],
                    isWaitResponse: false,
                    isWaitConfirmar: false,
                    intentosEntederPedido: 0,
                    optionPrevius: '',
                    userResponsePrevius: '',
                    nivelConfirmarPedido: 0, // 0 enviar canales de consumo 1 seleccionar canal 2 recopilar datos cliente 3 tipo de pago 
                    nivelSolicitarComprobante: 0,
                    nivelCambiarNombre: 0
                },
                variables_flow_confirmar_pedido: {
                    isRecopilandoDatos: false,
                    isClienteConfirmaDireccion: false,
                    isClienteEligeListDireccion: true,
                    isCuantoPagara: false,
                    preguntaSiEstaConformeOk: false,
                    datosRecopiladosDelCliente: {},
                    tipoPagoSeleted: {},
                    canalConsumoSeletedMasSeccion: {},
                    _listDirecciones: []
                },
                variables_flow_interaccion: {
                    nivel_titulo: tituloNivel.saludoIncial,
                    nivel: 0,
                    showOptionBotNoEntendio: false // si no entiende le muestra las opciones que le puede ayudar, y espera un numero de opcion
                },
            conversationLog:{}
        };
    }

    public setConversationLog(conversationLog: any) {
        this.estructuraInfo.conversationLog = conversationLog;
    }

    public setConversationLogUser(user:string, conversationLog: any) {
        this.estructuraInfo.conversationLog[user] = conversationLog;
    }

    public getConversationLog(user: string): any {
        return this.estructuraInfo.conversationLog[user];
    }

    public getAllConversationLog(): any {
        return this.estructuraInfo.conversationLog;
    }

    public setVariablesFlowConfirmarPedido(variablesFlowConfirmarPedido: any) {
        this.estructuraInfo.variables_flow_confirmar_pedido = variablesFlowConfirmarPedido;
    }

    public getVariablesFlowConfirmarPedido(): any {
        return this.estructuraInfo.variables_flow_confirmar_pedido;
    }

    public getVariablesFlowPedido(): any {
        return this.estructuraInfo.variables_flow_pedido;
    }

    public setVariablesFlowPedido(variablesFlowPedido: any) {
        this.estructuraInfo.variables_flow_pedido = variablesFlowPedido;
    }

    public setInfoPedidoFromSql(infoPedido: any) {
        this.estructuraInfo = infoPedido.estructuraInfo;
    }
    

    public setSede(sede: any) {
        this.estructuraInfo.sede = sede;
    }

    public setCliente(cliente: any) {
        this.estructuraInfo.cliente = cliente;
    }

    public setPedidoCliente(pedido_cliente: any) {
        this.estructuraInfo.pedido_cliente = pedido_cliente;
    }

    public getIsHasPedidoCliente(): any {
        return this.estructuraInfo.pedido_cliente.length > 0;
    }

    public getInfoPedido(): EstructuraInformacion {
        return this.estructuraInfo;
    }

    public getCliente(): ClassCliente {
        return <ClassCliente>this.estructuraInfo.cliente;
    }

    public getSede(): any {
        return this.estructuraInfo.sede.sede;
    }

    public getHorariosAtencion(): any {
        return this.estructuraInfo.sede.listHorariosAtencion;
    }

    public getlistCanalConsumo(): any {
        return this.estructuraInfo.sede.listCanalConsumo;
    }   
    
    public getlistTipoPago(): any {
        return this.estructuraInfo.sede.listTipoPago;
    }

    public getlistImpresoras(): any {
        return this.estructuraInfo.sede.listImpresoras;
    }

    public getConfigDelivery(): any {
        return this.estructuraInfo.sede.configDelivery;
    }

    public getPedidoCliente(): any {
        return this.estructuraInfo.pedido_cliente;
    }

    public getSubtotalCostoEntrega(): any {
        return this.estructuraInfo.subtotalCostoEntrega;
    }

    public setSubtotalCostoEntrega(subtotalCostoEntrega: any) {
        this.estructuraInfo.subtotalCostoEntrega = subtotalCostoEntrega;
    }

    public setIsDelivery(isDelivery: boolean) {
        this.estructuraInfo.isDelivery = isDelivery;
    }

    public getIsDelivery(): boolean {
        return this.estructuraInfo.isDelivery;
    }
    
    public setSolicitaCubiertos(solicitaCubiertos: boolean) {
        this.estructuraInfo.solicitaCubiertos = solicitaCubiertos;
    }

    public getSolicitaCubiertos(): boolean {
        return this.estructuraInfo.solicitaCubiertos;
    }

    public setCanalConsumoSeleted(canalConsumoSeleted: any) {
        this.estructuraInfo.canalConsumoSeleted = canalConsumoSeleted;
    }

    public getCanalConsumoSeleted(): any {
        return this.estructuraInfo.canalConsumoSeleted;
    }

    public setIsReserva(isReserva: boolean) {
        this.estructuraInfo.isReserva = isReserva;
    }

    public getIsReserva(): boolean {
        return this.estructuraInfo.isReserva;
    }   

    public setMetodoPagoSeleted(metodoPagoSeleted: any) {
        this.estructuraInfo.metodoPagoSeleted = metodoPagoSeleted;
    }

    public getMetodoPagoSeleted(): any {
        return this.estructuraInfo.metodoPagoSeleted;
    }

    public setIsClienteRecogeLocal(isClienteRecogeLocal: boolean) {
        this.estructuraInfo.isClienteRecogeLocal = isClienteRecogeLocal;
    }

    public getIsClienteRecogeLocal(): boolean {
        return this.estructuraInfo.isClienteRecogeLocal;
    }

    public setPedidoEnviar(pedidoEnviar: any) {
        this.estructuraInfo.pedidoEnviar = pedidoEnviar;
    }

    public getPedidoEnviar(): any {
        return this.estructuraInfo.pedidoEnviar;
    }

    public getListReglasCarta() {
        return this.estructuraInfo.sede.listReglasCarta;
    }    

    public setIsRecogeLocal(isRecogeLocal: boolean) {
        this.estructuraInfo.isRecogeLocal = isRecogeLocal;
    }

    public getIsRecogeLocal(): boolean {
        return this.estructuraInfo.isRecogeLocal;
    }

    public setDireccionGeolocalizada(direccionGeolocalizada: any) {
        this.estructuraInfo.direccionGeolocalizada = direccionGeolocalizada;
    }

    public getDireccionGeolocalizada(): any {
        return this.estructuraInfo.direccionGeolocalizada;
    }

    public setVariablesFlowInteraccion(variablesFlowInteraccion: any) {
        this.estructuraInfo.variables_flow_interaccion = variablesFlowInteraccion;
    }

    public getVariablesFlowInteraccion(): any {
        return this.estructuraInfo.variables_flow_interaccion;
    }

    // funcion que resetea la informacion del pedido menos la del cliente
    public resetInfoPedido() {
        this.estructuraInfo = {            
            sede: this.estructuraInfo.sede,
            cliente: this.estructuraInfo.cliente,
            pedido_cliente: {},
            subtotalCostoEntrega: null,
            isDelivery: false,
            isReserva: false,
            isRecogeLocal: false,
            isClienteRecogeLocal: false,
            solicitaCubiertos: false,
            canalConsumoSeleted: {},
            metodoPagoSeleted: {},    
            pedidoEnviar: {},
            direccionGeolocalizada: {},
            variables_flow_pedido: {
                showTomarPedido: false,
                platosNoEcontrados: [],
                platosSinStock: [],
                platosEcontrados: [],
                platosRecomendados: [],
                isWaitResponse: false,
                isWaitConfirmar: false,
                intentosEntederPedido: 0,
                optionPrevius: '',
                userResponsePrevius: '',
                nivelConfirmarPedido: 0, // 0 enviar canales de consumo 1 seleccionar canal 2 recopilar datos cliente 3 tipo de pago 
                nivelSolicitarComprobante: 0,
                nivelCambiarNombre: 0
            },
            variables_flow_confirmar_pedido: {
                isRecopilandoDatos: false,
                isClienteConfirmaDireccion: false,
                isClienteEligeListDireccion: true,
                isCuantoPagara: false,
                preguntaSiEstaConformeOk: false,
                datosRecopiladosDelCliente: {},
                tipoPagoSeleted: {},
                canalConsumoSeletedMasSeccion: {},  
                _listDirecciones: []                           
            },
            variables_flow_interaccion: {
                nivel_titulo: tituloNivel.saludoIncial,
                nivel: 0,
                showOptionBotNoEntendio: false
            }, 
            conversationLog:{}
        };
    }

    


}