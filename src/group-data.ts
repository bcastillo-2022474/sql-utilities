import {getConnection} from './connection'
import {IResult, query, Request, Int, BigInt} from 'mssql'

import {consultaBodegas, consultaBodegaSap, consultaDocumento, consultaFacturaPos, consultaRecepciones} from './queries'
import {Bodega, FacturaPos, WhsCodes} from "./types";

async function getFacturasPos(): Promise<FacturaPos[]> {
    const pool = await getConnection();
    const resultSet: IResult<FacturaPos> = await query(consultaFacturaPos);
    return resultSet.recordset
    // throw new Error('something is wrong');
}

async function main() {
    const facturasPos = await getFacturasPos();
    const facturasPosGroupedByCardName = facturasPos.reduce((map: Record<string, FacturaPos[]>, curr) => {
        if (!map[curr.CardName]) {
            map[curr.CardName] = [curr];
            return map;
        }

        map[curr.CardName].push(curr)
        return map;
    }, {})

    console.log(facturasPosGroupedByCardName)
    const data = Object.keys(facturasPosGroupedByCardName).reduce((map: Record<string, string[]>, key) => {
        const facturasByClient = facturasPosGroupedByCardName[key]
        map[key] = facturasByClient.map(factura => factura.venta_id);
        return map;
    }, {})

    const bodegasGroupedByClient = Object.keys(data).reduce((map: Record<string, Promise<Bodega[]>>, clientName) => {
        console.log({clientName})
        map[clientName] = getBodegas(data[clientName]);
        return map;
    }, {});


    Object.keys(bodegasGroupedByClient).forEach(async (clientName) => {
        const bodegas = await bodegasGroupedByClient[clientName]
        const series = bodegas.map(bodega => `'${bodega.serie}'`).join(', ');
        console.log({[clientName]: series})
        const bodegasSap = await getBodegasSAPBySeries(series)
        const seriesNotInTranist = [...bodegasSap.filter(whscode => !whscode.whscode.startsWith('TS')).map(x => x.whscode).reduce((set, curr) => {
            set.add(curr)
            return set;
        }, new Set())];
        const seriesInTransit = bodegasSap.filter(whscode => whscode.whscode.startsWith('TS'))
        const seriesInTransitByCode = seriesInTransit.reduce((map: Record<string, WhsCodes[]>, curr) => {
            if (!map[curr.itemcode]) {
                map[curr.itemcode] = [curr];
                return map;
            }

            map[curr.itemcode].push(curr);
            return map;
        }, {})

        const documents = await Promise.all(seriesInTransit.map(async (serie) => {
            const documentoId = await getDocumentoId(serie.intrSerial);
            const recepcion = await getRecepcion(documentoId);
            if (!recepcion) return {docuemento: documentoId, serie: serie.intrSerial, recepcion: null};
            return {docuemento: documentoId, serie: serie.intrSerial, recepcion: recepcion.recepcion_id};
        }));

        console.log({
            documents,
            client: clientName,
            'almacen-destino': seriesNotInTranist,
            'series-en-transito': seriesInTransit,
            // documentos: setOfDocuments
        })
        // bodegasSap.filter(bodega => bodega.)
    })


}

async function getBodegas(numbers: string[]) {
    console.log(consultaBodegas.replace('@?@', numbers.join(', ')));

    const result: IResult<Bodega> = await query(consultaBodegas.replace('@?@', numbers.join(', ')))
    return result.recordset;
}

async function getBodegasSAPBySeries(series: string) {
    const result: IResult<WhsCodes> = await query(consultaBodegaSap.replace('@?@', series));
    return result.recordset
}

async function getDocumentoId(serie: string) {
    const result = await query(consultaDocumento.replace('@?@', serie));
    return result.recordset.map(x => x.documento)[0];
}

async function getRecepcion(documentoId: string) {
    const result = await query(consultaRecepciones.replace('@?@', documentoId))
    return result.recordset[0];
}

main();