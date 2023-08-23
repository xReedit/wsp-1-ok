// clase para optener el subtotal del pedido


import type { ClassEstructuraPedido } from "./estructura.pedido.class";
import { getData } from "./httpClient.services";
import { Subtotal } from "./interface.class";
import { formatPadArrayToString } from "./utiles";

export class ClassGetSubTotales {
    arrReglasCarta: any 
    arrSeccionesPedido: any
    constructor() {
    }

    // obtner las reglas de la carta
    async getRules(idsede, idorg) {
        this.arrReglasCarta = await getData('chat-bot', `get-reglas-carta/${idsede}/${idorg}`)        
    }

    setRules(arrReglasCarta: any) {
        this.arrReglasCarta = arrReglasCarta
    }

    getSubtotales(arrSeccionesPedido: any, idtipo_consumo: number, arrSubtotalCostoEntega: any ) {                
        this.arrSeccionesPedido = arrSeccionesPedido                    

        // detecta si esta vacio
        arrSubtotalCostoEntega = arrSubtotalCostoEntega ? Object.keys(arrSubtotalCostoEntega).length === 0 ? null : arrSubtotalCostoEntega : arrSubtotalCostoEntega
        // secciones mas cantidad de items
        let seccionMasItems = this.getSeccionMasItems(this.arrSeccionesPedido)    

        // obtenemos impuestos
        let impuestos = this.getImpuestosReglasCarta()
        // console.log('impuestos', impuestos);
            
        this.validarReglasCarta(this.arrReglasCarta.reglas, seccionMasItems)

        // array subotales de adiciones                
        let arrSubtotales = this.getArraySubtotal(seccionMasItems, idtipo_consumo, arrSubtotalCostoEntega)
        // infoPedido.agregarSubtotal(arrSubtotales)

        return arrSubtotales


    }


    // obtener el subtotal de los items del pedido
    getTotalItemsPedido(arrSeccionesPedido: any[]) {
        let total = 0
        arrSeccionesPedido.flatMap((item: any) => { item.items.map((item: any) => { total += parseFloat(item.precio_print) }) })
        return total
    }

    // obtener un array con las idseccion y suma de cantidad de items
    getSeccionMasItems(arrSeccionesPedido: any) {
        let arrSeccionMasItems: any[] = []
        arrSeccionesPedido.map((item: any) => {
            let totalItems = 0            
            item.items.map((item: any) => { totalItems += parseFloat(item.cantidad_seleccionada) })
            arrSeccionMasItems.push({ idseccion: item.idseccion, totalItems: totalItems })
        })
        return arrSeccionMasItems
    }

    // obtener la lista de impuestos de las reglas de la carta
    getImpuestosReglasCarta() {   
        try {
            return this.arrReglasCarta.subtotales.filter((item: any) => item.es_impuesto === 1 && item.activo === 1)            
        } catch (error) {
            return []
        }     
    }

    // obterner costos no impuestos por idseccion
    getCostosAdicionalesPorSeccion(idseccion: number, idtipo_consumo: number) {
        return this.arrReglasCarta.subtotales.filter((item: any) => item.es_impuesto === 0 && item.idseccion === idseccion && item.idtipo_consumo === idtipo_consumo  )
    }

    validarReglasCarta(rules: any[], seccionMasItems: any): any {

        if (rules === null) return;

        // let diferencia = 0;
        let xSecc_bus = 0;
        let xSecc_detalle = 0;
        let xCantidadBuscar = 0;
        let xCantidadBuscarSecc_detalle = 0;
        let diferencia = 0;

        let xPrecio_item_bus = 0;
        let xPrecio_mostrado = 0; // preciounitario * cantidad precio_total_cal

        // reset precio_total_calc -> precio_total;
        this.arrSeccionesPedido.map((z: any) => {
            z.items.map((n: any) => n.precio_total_calc = null);
        });            
        
        rules.map((regla: any) => {
            xSecc_bus = regla.idseccion;
            xSecc_detalle = regla.idseccion_detalle;
            xCantidadBuscar = this.getCantidadItemsFromSeccion(xSecc_bus);
            xCantidadBuscarSecc_detalle = this.getCantidadItemsFromSeccion(xSecc_detalle);

            diferencia = xCantidadBuscar - xCantidadBuscarSecc_detalle;
            diferencia = diferencia < 0 ? xCantidadBuscar : diferencia; // no valores negativos

            this.arrSeccionesPedido
                        .filter((z: any) => z.idseccion.toString() === xSecc_detalle.toString())
                        .map((z: any) => {
                            z.items
                                .map((n: any, i) => {
                                    const precioUnitario_item = parseFloat(n.precio);
                                    const cant_item = n.cantidad_seleccionada;

                                    xPrecio_mostrado = n.precio_total_calc !== null ? n.precio_total_calc : n.precio_total;
                                    xPrecio_item_bus = xPrecio_mostrado;

                                    if (xCantidadBuscar >= xCantidadBuscarSecc_detalle) {
                                        xPrecio_item_bus = 0;
                                    } else if (diferencia > 0) {
                                        xPrecio_item_bus = diferencia * precioUnitario_item;
                                        xPrecio_item_bus = xPrecio_mostrado - xPrecio_item_bus; // descuenta del precio que se muestra en pantalla( precio que ya fue procesado)
                                        xPrecio_item_bus = xPrecio_item_bus < 0 ? 0 : xPrecio_item_bus;

                                        diferencia = diferencia - cant_item < 0 ? 0 : diferencia - cant_item;
                                    }

                                    n.precio_total_calc = parseFloat(xPrecio_item_bus.toString()); //
                                    n.precio_print = parseFloat(xPrecio_item_bus.toString()); //
                                    n.cantidad_descontado = cant_item;
                                });
                        });
        });
                
    }


    getCantidadItemsFromSeccion(idseccion: number) {
        let total = 0;
        this.arrSeccionesPedido.map((z: any) => {
            if (z.idseccion === idseccion) {
                z.items.map((n: any) => {
                    total += parseFloat(n.cantidad_seleccionada);
                });
            }
        });
        return total;
    }


    getArraySubtotal(seccionMasItems: any, idtipo_consumo: number, arrSubtotalCostoEntega: any){
        let importeCostosAdicionales = 0
        let arrSubtotales = []
        //

        // costos adicionales a nivel pedido (delivery, servicios, etc)        
        const _arrCostosNivelPedido = this.arrReglasCarta.subtotales.filter((item: any) => item.es_impuesto === 0 && item.idtipo_consumo === idtipo_consumo && item.nivel === 1)        
        _arrCostosNivelPedido.map((c: any) => {
            const _idSubtotal = `${c.tipo}${c.id}` 
            const _costoXcantidad = parseFloat(c.monto)
            const _subtotal = arrSubtotales.find((s: Subtotal) => s.descripcion.toLowerCase().trim() === c.descripcion.toLowerCase().trim())

            // si en la reglas incluye delivery ya no lo ponemos en el subtotal
            if (c.descripcion.toLowerCase().trim().includes('delivery')) {
                // continuar
                return
            }

            if (_subtotal) {
                _subtotal.importe = (parseFloat(_subtotal.importe) + _costoXcantidad).toFixed(2)
            } else {

                arrSubtotales.push({
                    id: _idSubtotal,
                    quitar: true,
                    importe: _costoXcantidad.toFixed(2),
                    tachado: false,
                    visible: true,
                    esImpuesto: 0,
                    descripcion: c.descripcion,
                    visible_cpe: false
                })
            }
        })
    

        // costos adicionales  a nivel items
        seccionMasItems.map((item: any) => {
            let costosAdicionales = this.getCostosAdicionalesPorSeccion(item.idseccion, idtipo_consumo)
            costosAdicionales.map((c: any) => {
                // si el nivel es 0 se multiplica por la cantidad de items de la seccion
                const _idSubtotal = `${c.tipo}${c.id}`
                const _costoXcantidad = c.nivel === 0 ? parseFloat(c.monto) * item.totalItems : parseFloat(c.monto)

                // buscamos si ya existe el subtotal
                const _subtotal = arrSubtotales.find((s: Subtotal) => s.descripcion.toLowerCase().trim() === c.descripcion.toLowerCase().trim())
                if (_subtotal) {
                    _subtotal.importe = (parseFloat(_subtotal.importe) + _costoXcantidad).toFixed(2)
                } else {

                    arrSubtotales.push({
                        id: _idSubtotal,
                        quitar: true,
                        importe: _costoXcantidad.toFixed(2),
                        tachado: false,
                        visible: true,
                        esImpuesto: 0,
                        descripcion: c.descripcion,
                        visible_cpe: false
                    })
                }

                importeCostosAdicionales += _costoXcantidad
            })
        })

        let totalItemsPedido = this.getTotalItemsPedido(this.arrSeccionesPedido)
        let importeSubTotal = totalItemsPedido;
       

       


        // total en productos
        let rowSubtotalProductos = {
            id: 0,
            quitar: false,
            importe: importeSubTotal.toFixed(2),
            tachado: false,
            visible: true,
            esImpuesto: 0,
            descripcion: "SUB TOTAL",
            visible_cpe: true
        }

        arrSubtotales.unshift(rowSubtotalProductos)

        // array delivery calculado segun la distancia
        if (arrSubtotalCostoEntega) {            
            arrSubtotales.splice(1, 0, arrSubtotalCostoEntega)
        }

        
        
        // totoal arrSubtotales antes de impuestos
        let totalSubtotales = arrSubtotales.map(x => parseFloat(x.importe)).reduce((a, b) => a + b, 0)
        


        // agregar solo el igv sobre el total
        let rowIGVAdd = null
        const rowIGV = this.arrReglasCarta.subtotales.filter((item: any) => item.es_impuesto === 1 && item.descripcion.toLowerCase().trim() === 'i.g.v')[0] || []
        const rowSubtotal = rowSubtotalProductos // arrSubtotales.filter((item: any) => item.descripcion.toLowerCase().trim() === 'sub total')[0] || []
        let _importeIGV = parseFloat(rowIGV.monto)
        importeSubTotal = parseFloat(rowSubtotal.importe)
    
        if (_importeIGV > 0) {
            importeSubTotal = this.xCalcMontoBaseIGV(totalSubtotales, _importeIGV)
            _importeIGV = totalSubtotales - importeSubTotal
            // rowIGV.importe = _importeIGV.toFixed(2)      

            rowSubtotal.importe = importeSubTotal.toFixed(2)

            rowIGVAdd = {
                id: rowIGV.id,
                quitar: false,
                importe: _importeIGV.toFixed(2),
                tachado: false,
                visible: true,
                esImpuesto: 1,
                descripcion: rowIGV.descripcion,
                visible_cpe: true
            }
        }

        // si existe igv agrega despues del subtotal
        if (rowIGVAdd) {
            arrSubtotales.splice(1, 0, rowIGVAdd)
        }

        // total despues de impuestos
        // totalSubtotales = arrSubtotales.map(x => x.importe).reduce((a, b) => parseFloat(a) + parseFloat(b), 0)

        arrSubtotales.push({
            id: 0,
            quitar: false,
            importe: totalSubtotales.toFixed(2),
            tachado: false,
            visible: true,
            esImpuesto: 0,
            descripcion: "TOTAL",
            visible_cpe: true
        })
                
        return arrSubtotales;
    }


    // type Order = 'asc' | 'desc';
    // const groupedPeople = orderByAndGroupByKeys(people, ['age', 'salary'], ['asc', 'desc']);
    orderByAndGroupByKeys<T>(array: T[], keys: string[], orders: []): { [key: string]: T[] } {
        const groupedData: { [key: string]: T[] } = {};

        array.sort((a, b) => {
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                const order = orders[i];
                const valueA = a[key];
                const valueB = b[key];

                if (valueA < valueB) {
                    return order === 'asc' ? -1 : 1;
                } else if (valueA > valueB) {
                    return order === 'asc' ? 1 : -1;
                }
            }
            return 0;
        });

        for (const item of array) {
            const groupKey = keys.map((key) => item[key]).join('_');

            if (!groupedData[groupKey]) {
                groupedData[groupKey] = [];
            }

            groupedData[groupKey].push(item);
        }

        return groupedData;
    }

    xCalcMontoBaseIGV(importeTotal, procentaje_IGV) {
        return (parseFloat(importeTotal) / (1 + (procentaje_IGV / 100)));
    }


    
}