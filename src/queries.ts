export const consultaFacturaPos = `
SELECT TOP 100 *, 203 Series, totalVenta DocTotal
FROM (SELECT v.venta_id                                                                        U_LOGISTIKA_ID
           , v.venta_id
           , CONCAT(u.nombres, ' ', u.apellidos)                                               CardName
           , u.codigo_erp                                                                      CardCode
           , v.fecha_emision                                                                   DocDate
           , ROUND(total, 3)                                                                   totalVenta
           , vd.total_linea
           , (SELECT SUM(monto) FROM pagos p1 WHERE p1.venta_id = v.venta_id)                  pagado
           , v.observaciones                                                                   Comments
           , v.referencia                                                                      Ref1
           , v.referencia2
           , b.bodega_erp                                                                      WarehouseCode
           , v.documento                                                                       DocNum
           , v.tipo_documento
           , 0                                                                                 DiscountPercent
           , (COALESCE(v.marchamo, v.serie) + '-' + COALESCE(v.numero, v.documento) + '-' + b.bodega_erp + '-' +
              V.aprobacion)                                                                    JournalMemo
           , CONCAT(COALESCE(v.marchamo, v.serie), '-', COALESCE(v.numero, v.documento))       NumAtCard
           , c.nombre                                                                          U_DoctoNombre
           , c.identificacion_tributaria                                                       U_DoctoNIT
           , COALESCE(v.numero, v.documento)                                                   U_DoctoNo
           , COALESCE(v.marchamo, v.serie)                                                     U_DoctoSerie
           , 'S'                                                                               U_DoctoFiscal
           , c.direccion1                                                                      U_DoctoDirec
           , u.codigo_erp                                                                      U_SNCodigo
           , SUBSTRING(COALESCE(REPLACE(c.nombre_comercial, '"\r\n"', NULL), c.nombre), 0, 75) U_SNNombre
           , v.aprobacion                                                                      U_DoctorSerie
      FROM ventas v
               INNER JOIN clientes c ON v.cliente_id = c.cliente_id
               INNER JOIN (SELECT xvd.venta_id,
                                  SUM((xvd.precio - (xvd.precio * xvd.pctDescuento)) * xvd.cantidad) total_linea
                           FROM (SELECT vd1.venta_id
                                      , ROUND((vd1.total_linea + COALESCE(vd1.descuento, 0)) / vd1.cantidad, 10) precio
                                      , CASE
                                            WHEN vd1.descuento > 0 THEN (vd1.descuento / vd1.cantidad) / ROUND(
                                                    (vd1.total_linea + COALESCE(vd1.descuento, 0)) / vd1.cantidad, 10)
                                            ELSE 0 END                                                           pctDescuento
                                      , vd1.cantidad
                                 FROM ventas_detalle vd1
                                 WHERE COALESCE(vd1.activo, 1) = 1
                                   AND vd1.cantidad > 0
                                   AND vd1.producto_padre IS NULL) xvd
                           GROUP BY venta_id) vd ON vd.venta_id = v.venta_id
               INNER JOIN usuarios u ON v.creado_por = u.usuario_id
               INNER JOIN bodegas b ON v.bodega_id = b.bodega_id
      WHERE v.tipo_documento = 12
        AND v.bodega_id NOT IN (31, 35)
        AND COALESCE(v.tipo_entrega, 1) < 2
        AND v.estado IN (3, 4, 5)
        AND v.empresa_id = 1
        AND v.fecha_asiento IS NULL
        AND v.aprobacion IS NOT NULL
        AND v.referencia2 IS NOT NULL) y
WHERE ROUND(y.totalVenta, 0) = ROUND(y.total_linea, 0)
  AND ROUND(y.total_linea, 0) = ROUND(y.pagado, 0)
ORDER BY y.DocDate, y.WarehouseCode
`

export const consultaBodegas = `
select  vd.bodega_id ,vd.venta_id,vd.serie,vd.producto_id ,p.producto,p.descripcion ,vd.cantidad, vd.linea_padre,vd.ventas_detalle_id 
from ventas_detalle vd
inner join productos p on p.producto_id=vd.producto_id 
where venta_id in (@?@) and vd.activo=1 and serie is not null order by vd.bodega_id
`

export const consultaBodegaSap = `
select i.itemcode, i.whscode, s.intrSerial, s.SysSerial
from SBO_Sistemas_Logisticos.dbo.oitw i inner join SBO_Sistemas_Logisticos.dbo.OSRI s on s.ItemCode = i.ItemCode 
where coalesce(i.onhand, 0) + coalesce(i.IsCommited, 0) + coalesce(i.OnOrder, 0) != 0 
and s.Quantity > 0 and i.WhsCode = s.WhsCode and i.ItemCode = s.ItemCode and s.Status = 0 
and s.intrSerial in (@?@)
`

export const consultaDocumento = `
select i.documento from ingreso_detalle id inner join ingresos i ON i.ingreso_id = id.ingreso_id
where id.serie = '@?@' 
`

export const consultaRecepciones = `
select * from recepciones where documento = '@?@'
`