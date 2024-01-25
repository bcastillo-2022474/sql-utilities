import {connect, IResult, query, Request, Int, BigInt} from 'mssql'


type Tuple = {
    recepcion_id: string,
    descripcion: string,
    ingreso_detalle_id: string,
    ingreso_id: string,
    producto: string,
    recepciones: number,
    cantidad: number,
    producto_recepcion: string,
    producto_ingreso: string
}

async function createConnection() {
    try {
        // make sure that any items are correctly URL encoded in the connection string
        const pool = await connect('Server=192.168.1.7,49152;Database=Redis;User Id=usrDesaRedis;Password=L0g1stik@23;Encrypt=true;trustServerCertificate=true')
        const resultSet: IResult<Tuple> = await query(
            `
SELECT * FROM (
select rd.recepcion_id, p.descripcion, ird.ingreso_detalle_id ,id.ingreso_id , p.producto 
, sum(ird.cantidad_recibida ) recepciones , sum(id.cantidad) cantidad
,rd.producto_id producto_recepcion , id.producto_id producto_ingreso 
 from recepciones_detalle rd inner join ingreso_recepcion_detalle ird on rd.recepcion_detalle_id = ird.recepcion_detalle_id 
 inner join productos p on rd.producto_id = p.producto_id
 inner join ingreso_detalle id on ird.ingreso_detalle_id =id.ingreso_detalle_id 
 group by rd.recepcion_id , ird.ingreso_detalle_id , id.ingreso_id , p.producto ,rd.producto_id , id.producto_id, p.descripcion ) X 
 WHERE X.producto_recepcion != producto_ingreso ORDER BY X.producto_recepcion;
            `
        )

        // console.dir(resultSet)
        const tuplesList = resultSet.recordset;
        console.log(tuplesList)

        console.log(tuplesList.length);
        tuplesList.forEach(async (tuple) => {
            if (tuple.producto_recepcion == tuple.producto_ingreso) return;

            // trea el numero de inventario de rececpciones_detalle
            const {recordset} = await query(
                ` select pp.unidad_inventario from recepciones_detalle rd
             inner join productos_presentaciones pp ON pp.presentacion_id = rd.presentacion_id
             where rd.producto_id = ${tuple.producto_recepcion} and rd.ingreso_id = ${tuple.ingreso_id};
 `);

            const [{unidad_inventario}] = recordset;


            const result = await query(`select * from productos p where producto_id = ${tuple.producto_recepcion}`);
            // descripcion de producto recepciones
            const {descripcion: descripcionProductoRecpecion} = result.recordset[0];


            const result2 = await query(`
            select i.tipo_documento, id.ingreso_detalle_id, id.unidad_inventario, id.ingreso_id, id.linea, id.producto_id, id.cantidad_recibida, id.cantidad, id.descripcion, id.referencia3, id.operacion_produccion, id.unidad_inventario
            from ingreso_detalle id
            inner join ingresos i ON i.ingreso_id = id.ingreso_id
            where id.ingreso_id = ${tuple.ingreso_id} and id.producto_id in (${tuple.producto_recepcion}, ${tuple.producto_ingreso}) and id.ingreso_detalle_id = ${tuple.ingreso_detalle_id}
            `);

            console.log(result2.recordset.length);
            const {operacion_produccion, tipo_documento, referencia3} = result2.recordset[0];

            if (operacion_produccion == null) {
                try {
                    if (tipo_documento === 10) {
                        // execute sp traslados
                        const req = pool.request();
                        req.input('ingreso_id', BigInt, Number(tuple.ingreso_id));
                        req.execute('sp_actualizar_ingresos_traslados');
                    }

                    if (tipo_documento === 3 || tipo_documento === 1 ) {
                        // execute sp embarques
                        const req = pool.request();
                        req.input('ingreso_id', BigInt, Number(tuple.ingreso_id))
                        req.execute('sp_actualizar_ingresos_embarques');
                    }
                } catch (e) {
                    console.log(e);
                    console.log('Chipilin');
                    return;
                }
            }

            console.log('-------------------------------------------------');
            console.log({operacion_produccion, tipo_documento});
            console.log('-------------------------------------------------');

            const result3 = await query(`
            select id.operacion_produccion
            from ingreso_detalle id
            inner join ingresos i ON i.ingreso_id = id.ingreso_id
            where id.ingreso_id = ${tuple.ingreso_id} and id.producto_id in (${tuple.producto_recepcion}, ${tuple.producto_ingreso}) and id.ingreso_detalle_id = ${tuple.ingreso_detalle_id}
            `)
            let operacionProductoFixed;

            if (result3.recordset[0].operacion_produccion == null) {
                operacionProductoFixed = referencia3;
            } else operacionProductoFixed = result3.recordset[0].operacion_produccion;


            const updateStatement = `UPDATE ingreso_detalle SET unidad_inventario = ${unidad_inventario},
            producto_id = ${tuple.producto_recepcion}, descripcion = '${descripcionProductoRecpecion}',
            cantidad_recibida = ${tuple.recepciones}, operacion_produccion = '${operacionProductoFixed}'
            WHERE ingreso_id = ${tuple.ingreso_id} and producto_id in (${tuple.producto_recepcion}, ${tuple.producto_ingreso}) and ingreso_detalle_id = ${tuple.ingreso_detalle_id}
 `

            console.log(updateStatement);
            console.log('-------------------------------------------------------------------------------')
            console.log('\n\n\n');

            const reqUpdate = pool.request();
            reqUpdate.query(updateStatement).then(() => {
                console.log("WORKED");
                pool.close();
            }).catch((e) => {
                console.log(e);
                console.log("NO FUNCIONO UPDATE :(")
                pool.close();
            })
        })

    } catch (err) {
        // ... error checks
        console.log(err);
    }
}

createConnection();