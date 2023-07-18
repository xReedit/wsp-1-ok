import { ClassGetSubTotales } from "../services/getSubtotal";
import { postDataPedidoBot } from "../services/httpClient.services";
import { JsonPrintService } from "../services/json-print.services";
import { ClassCliente } from "./cliente";
import { ClassInformacionPedido } from "./info.pedido.class";
import { ClassInfoSede } from "./sede";

interface Estructura {
    p_body: {
        tipoconsumo: any[];
    };
    p_header: any;
    p_subtotales: any[];
}

export class ClassEstructuraPedido {
    private estructura: Estructura;

    constructor() {
        this.estructura = {
            p_body: {
                tipoconsumo: [],
            },
            p_header: {},
            p_subtotales: [],
        };
    }

    public setTipoConsumo(tipo: any) {
        this.estructura.p_body.tipoconsumo.push(tipo);
    }

    public setHeader(header: any) {
        this.estructura.p_header = header;
    }

    public setSubtotal(subtotal: any) {
        this.estructura.p_subtotales = subtotal
    }

    public getEstructura(): Estructura {
        return this.estructura;
    }

    public getBody(): any {
        return this.estructura.p_body;
    }

    private upperItemDes() {
        this.estructura.p_body.tipoconsumo.map((x) => {
            x.secciones.map((y) => {
                y.items.map((z) => {
                    z.des = z.des.toUpperCase();
                });
            });
        });
    }


    // proceso de armado del pedido
    public armarPedido(infoSede: ClassInfoSede, infoPedido: ClassInformacionPedido, infoCliente: ClassCliente) {
        let rptImporteTotalPagar = 0
        let canalConsumoSeleted = infoPedido.getCanalConsumoSeleted()
        const subtotalCostoEntrega = infoPedido.getSubtotalCostoEntrega()
        // const infoSede = infoPedido.getSede()
        const classSubtotales = new ClassGetSubTotales()
        const listImpresoras = infoSede.getlistImpresoras()
        let arrDatosReserva = {}

        // const _infoCliente = infoPedido.getCliente();
        // console.log('_infoCliente', _infoCliente);
        // let infoCliente = new ClassCliente()
        // infoCliente.setCliente(_infoCliente) 

        let referenciaPedido = infoCliente.getNombre()
        let nomDireccion = ''
        let _infoSede = infoSede.getSede()

        // colocamos mayusculas al canal de consumo
        canalConsumoSeleted.descripcion = canalConsumoSeleted.descripcion.toUpperCase()
        
        // mayusculas los items
        this.upperItemDes()

        // subtotales
        // await classSubtotales.getRules(infoSede.idsede, infoSede.idorg)
        console.log('infoSede.getListReglasCarta()', infoSede.getListReglasCarta());
        classSubtotales.setRules(infoSede.getListReglasCarta())         
        let arrSubtotales = classSubtotales.getSubtotales(canalConsumoSeleted.secciones, canalConsumoSeleted.idtipo_consumo, subtotalCostoEntrega)
        this.setSubtotal(arrSubtotales)

        const _isDelivery = infoPedido.getIsDelivery()
        const _isPasaRecoger = infoPedido.getIsRecogeLocal()
        const _isReserva = infoPedido.getIsReserva()

        if (_isPasaRecoger) {
            referenciaPedido = `${infoCliente.getNombre()} - ${infoCliente.getCelular()}`
        }

        if (_isReserva) { // la reserva es para consumir en el local            
            canalConsumoSeleted.descripcion = 'CONSUMIR EN LOCAL'
            arrDatosReserva = {
                nombre_reserva: infoCliente.getNombre(),
                telefono: infoCliente.getCelular(),
                num_personas: infoCliente.getNumPersonas(),
                hora_reserva: infoCliente.getHoraLlegada(),
            }
        }
        // console.log('infoPedido', infoPedido.getEstructura());

        // header
        let pheader = {
            "m": "00",
            "r": referenciaPedido,
            "appv": "v.2z",
            "nom_us": "BOT",
            "delivery": _isDelivery ? 1 : 0,
            "reservar": _isReserva ? 1 : 0,
            "systemOS": "WhatsApp",
            "isCliente": 1,
            "isFromBot": 1,
            "m_respaldo": "0",
            "num_pedido": "",
            "idcategoria": "17", //MODIFICARLO
            "solo_llevar": _isPasaRecoger ? 1: 0,
            "arrDatosReserva": arrDatosReserva,
            "correlativo_dia": "",
            "idregistro_pago": 0,
            "arrDatosDelivery": {},
            "isprint_all_short": listImpresoras[0].isprint_all_short,
            "idregistra_scan_qr": 0,
            "isprint_copy_short": listImpresoras[0].isprint_copy_short,
            "is_print_subtotales": listImpresoras[0].isprint_subtotales_comanda
        }

        // rptImporteTotalPagar = arrSubtotales[arrSubtotales.length - 1].importe

        // array delivery
        let arrDatosDelivery: any = {}
        if (_isDelivery) {
            _infoSede.c_servicio = subtotalCostoEntrega.importe
            _infoSede.distancia_km = subtotalCostoEntrega.distancia_km
            arrDatosDelivery.direccionEnvioSelected = infoCliente.getDireccionSelected()    
            arrDatosDelivery.direccionEnvioSelected.idcliente_pwa_direccion = infoCliente.getIdClientePwaDireccion()
            nomDireccion = arrDatosDelivery.direccionEnvioSelected.direccion

            // datos de la direccion
            const _direccionGeolocalizada = infoPedido.getDireccionGeolocalizada()
            arrDatosDelivery.direccionEnvioSelected.ciudad = _direccionGeolocalizada.ciudad
            arrDatosDelivery.direccionEnvioSelected.departamento = _direccionGeolocalizada.departamento
            arrDatosDelivery.direccionEnvioSelected.provincia = _direccionGeolocalizada.provincia
            arrDatosDelivery.direccionEnvioSelected.pais = _direccionGeolocalizada.pais
            arrDatosDelivery.direccionEnvioSelected.codigo = _direccionGeolocalizada.codigo_postal
            arrDatosDelivery.direccionEnvioSelected.latitude = _direccionGeolocalizada.latitude
            arrDatosDelivery.direccionEnvioSelected.longitude = _direccionGeolocalizada.longitude
            arrDatosDelivery.direccionEnvioSelected.titulo = ''
            arrDatosDelivery.direccionEnvioSelected.referencia = _direccionGeolocalizada.referencia
            // datos de la direccion
            

            arrDatosDelivery.costoTotalDelivery = arrSubtotales.find(x => x.descripcion.toLowerCase() === 'costo de entrega').importe
            arrDatosDelivery.isFromComercio = 1

        }

            arrDatosDelivery.establecimiento = infoSede
            arrDatosDelivery.dni = '' // colocar
            arrDatosDelivery.f_nac = null
            arrDatosDelivery.nombre = infoCliente.getNombre()
            arrDatosDelivery.idcliente = infoCliente.getIdCliente()
            arrDatosDelivery.delivery = _isDelivery ? 1 : 0
            arrDatosDelivery.propina = {
                "value": 0,
                "checked": true,
                "idpropina": 1,
                "descripcion": "S/. 0"
            }

            arrDatosDelivery.paga_con = infoPedido.getMetodoPagoSeleted().descripcion            
            arrDatosDelivery.telefono = infoCliente.getCelular()
            arrDatosDelivery.direccion = nomDireccion
            arrDatosDelivery.metodoPago = infoPedido.getMetodoPagoSeleted(),
            arrDatosDelivery.pasoRecoger = _isPasaRecoger ? 1 : 0,
            arrDatosDelivery.importeTotal = arrSubtotales[arrSubtotales.length - 1].importe            
            arrDatosDelivery.isFromBot = 1
            arrDatosDelivery.solicitaCubiertos = infoPedido.getSolicitaCubiertos() ? 1 : 0 // colocar            
            arrDatosDelivery.tiempoEntregaProgamado = {
                "value": "",
                "modificado": false,
                "descripcion": "Programa la entrega"
            }

            pheader.arrDatosDelivery = arrDatosDelivery 
        



        this.setHeader(pheader)
        this.setSubtotal(arrSubtotales)

        // enviar a print_server_detalle // para imprimir
        const jsonPrintService = new JsonPrintService()
        const arrPrint = jsonPrintService.enviarMiPedido(true, infoSede, this.getBody(), listImpresoras);
        const dataPrint: any = [];
        arrPrint.map((x: any) => {
            dataPrint.push({
                Array_enca: pheader,
                ArraySubTotales: arrSubtotales,
                ArrayItem: x.arrBodyPrint,
                Array_print: x.arrPrinters
            });
        });

        // datos del usuario // para guardarlo
        const _dataUsuarioSend = {
            'idusuario': 121, // CORREGIRLO
            'idcliente': infoCliente.getIdCliente(),
            'idorg': _infoSede.idorg,
            'idsede': _infoSede.idsede,
            'nombres': 'BOT',
            'cargo': 'BOT',
            'usuario': 'BOT'
        };

        const pedidoEnviar = {
            dataPedido: this.getEstructura(),
            dataPrint: dataPrint,
            dataUsuario: _dataUsuarioSend,
            isDeliveryAPP: pheader.delivery === 1 ? true : false, // isClienteBuscaRepartidores, // this.isDeliveryCliente,
            isClienteRecogeLocal: infoPedido.getIsClienteRecogeLocal(), // indica si el cliente pasa a recoger entonces ya no busca repartidor
            dataDescuento: [], // lista de ids de descuento para restar cantidad num_pedidos
            listPrinters: arrPrint.listPrinters
        };

        // seteamos para tenerlo listo para enviar
        infoPedido.setPedidoEnviar(pedidoEnviar);

        rptImporteTotalPagar = arrSubtotales[arrSubtotales.length - 1].importe
        return rptImporteTotalPagar;
    }   

    public enviarPedido(_infoSede: any, infoPedido: ClassInformacionPedido, infoCliente: ClassCliente) {
        const dataSend = infoPedido.getPedidoEnviar()

        const dataSocketQuery = {
            idorg: _infoSede.idorg,
            idsede: _infoSede.idsede,
            idusuario: 121,
            idcliente: infoCliente.getIdCliente(),
            iscliente: false,
            isOutCarta: false,
            isCashAtm: false,
            isFromApp: 0,
            isFromBot: 1
        };

        const _payload = {
            query: dataSocketQuery,
            dataSend: dataSend
        }

        postDataPedidoBot('bot', 'send-bot-pedido', _payload)
    }

    

}