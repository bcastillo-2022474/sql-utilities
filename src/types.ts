export interface FacturaPos {
    U_LOGISTIKA_ID: string;
    venta_id: string;
    CardName: string;
    CardCode: string;
    DocDate: Date;
    totalVenta: number;
    total_linea: number;
    pagado: number;
    Comments: null;
    Ref1: null;
    referencia2: string;
    WarehouseCode: string;
    DocNum: string;
    tipo_documento: number;
    DiscountPercent: number;
    JournalMemo: string;
    NumAtCard: string;
    U_DoctoNombre: string;
    U_DoctoNIT: string;
    U_DoctoNo: string;
    U_DoctoSerie: string;
    U_DoctoFiscal: string;
    U_DoctoDirec: null | string;
    U_SNCodigo: string;
    U_SNNombre: string;
    U_DoctorSerie: string;
    Series: number;
    DocTotal: number;
}

export interface Bodega {
    bodega_id: string;
    venta_id: string;
    serie: string;
    producto_id: string;
    producto: string;
    descripcion: string;
    cantidad: number;
    linea_padre: null;
    ventas_detalle_id: string;
}

export type WhsCodes = {
    itemcode: '1715',
    whscode: 'TS-Centr',
    intrSerial: 'RF7W9N93HH1RTB',
    SysSerial: 9283
}