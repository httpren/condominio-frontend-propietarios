# Guía Frontend: Expensas y Pagos (Perfil Propietario)

Esta guía explica cómo el frontend del propietario debe consumir los endpoints relacionados con expensas (cuotas) y pagos, cómo interpretar los estados y cómo se deriva la condición de mora.

## Objetivos del módulo
- Mostrar al propietario el historial y estado de sus expensas mensuales.
- Mostrar totales: pagadas, vencidas, saldo pendiente acumulado.
- Permitir registrar pagos (parciales o totales) sobre sus expensas.
- Bloquear ciertas acciones del sistema (reservas, etc.) si entra en mora (>= 3 expensas vencidas según umbral unificado).

## Endpoints relevantes
| Recurso | Endpoint | Método | Descripción | Notas |
|---------|----------|--------|-------------|-------|
| Listar expensas propias | `/api/expensas/` | GET | Paginado, filtrado automáticamente por backend al propietario autenticado | Staff puede filtrar por otros propietarios con `propietario_id=` |
| Detalle de expensa | `/api/expensas/{id}/` | GET | Información completa | Incluye totales calculados |
| Listar pagos | `/api/pagos/` | GET | Pagos del propietario (staff ve todos) | Soporta filtros | 
| Crear pago | `/api/pagos/` | POST | Registrar un pago | Auto-valida saldo pendiente |
| Verificar pago | `/api/pagos/{id}/verificar/` | PATCH | Solo staff | Propietario no puede |
| Rechazar verificación | `/api/pagos/{id}/rechazar_verificacion/` | PATCH | Solo staff | Reversa verificación |

## Modelo Expensa (datos clave)
Campo | Tipo | Notas
------|------|------
`mes_referencia` | Date (1er día del mes) | Identifica el mes de la expensa.
`cuota_basica` | Decimal | Valor base generado.
`reservas` | Decimal | Suma de cargos de reservas confirmadas del mes.
`multas` | Decimal | Sanciones aplicadas.
`total` | Decimal (read-only) | `cuota_basica + reservas + multas`.
`total_pagado_verificado` | Decimal (read-only) | Suma de pagos verificados.
`saldo_pendiente` | Decimal (read-only) | `max(0, total - total_pagado_verificado)`.
`pagado` | Boolean (read-only) | True si total verificado >= total.
`esta_vencida` | Boolean (read-only) | True si no pagada y fecha_vencimiento < hoy.
`fecha_vencimiento` | Date | Fecha límite de pago.
`meses_mora (Propietario)` | Entero | Actualizado al cambiar estado de expensas/pagos.
`restringido_por_mora (Propietario)` | Boolean | True si expensas vencidas >= 3 (umbral unificado).

## Modelo Pago (datos clave)
Campo | Tipo | Notas
------|------|------
`expensa` | FK -> Expensa | Obligatorio.
`fecha_pago` | Date | Default: hoy.
`monto` | Decimal | Debe ser > 0 y no exceder saldo pendiente.
`metodo_pago` | Choice | `efectivo|transferencia|tarjeta|cheque`.
`comprobante` | String | Referencia / Nro transacción (opcional).
`verificado` | Boolean | Solo staff lo marca o auto-verifica si cierra exacto.
`fecha_verificacion` | DateTime | Set cuando se verifica.
`verificado_por` | User | Staff que verificó.

## Lógica de mora (unificada)
- Se define constante `MORA_THRESHOLD = 3`.
- Un propietario queda restringido (`restringido_por_mora=True`) si tiene >= 3 expensas vencidas (pagado=False y fecha_vencimiento < hoy).
- Al crear o actualizar expensas/pagos se recalcula:
  - `meses_mora` = número de expensas vencidas.
  - `restringido_por_mora` según el umbral.
- Impacto: reservas u otras acciones bloqueadas mientras siga en mora.

## Listar expensas
GET `/api/expensas/`
Parámetros opcionales (staff o propietario sobre sus datos):
- `pagado=true|false`
- `mes=YYYY-MM` (filtra por año-mes de `mes_referencia`)
- `vencida=true|false`

Respuesta (ejemplo recortado):
```json
{
  "count": 5,
  "results": [
    {
      "id": 42,
      "mes_referencia": "2025-08-01",
      "cuota_basica": "120000.00",
      "reservas": "30000.00",
      "multas": "0.00",
      "total": 150000.0,
      "total_pagado_verificado": 100000.0,
      "saldo_pendiente": 50000.0,
      "pagado": false,
      "esta_vencida": true,
      "fecha_vencimiento": "2025-08-15"
    }
  ]
}
```

## Mostrar resumen en UI
Recomendado calcular en frontend tras fetch:
- Total expensas: `count`.
- Vencidas = `results.filter(e => e.esta_vencida).length`.
- Pagadas = `results.filter(e => e.pagado).length`.
- Saldo pendiente acumulado: `sum(e.saldo_pendiente)`.
- Mostrar badge si `propietario.restringido_por_mora` (puede venir de endpoint `/api/propietarios/me/`).

## Detalle de una expensa
GET `/api/expensas/{id}/`
Útil para mostrar desglose y pagos asociados (puedes luego llamar `/api/pagos/?expensa={id}`).

## Crear pago
POST `/api/pagos/`
```json
{
  "expensa": 42,
  "monto": "50000.00",
  "metodo_pago": "transferencia",
  "comprobante": "TRX-123456"
}
```
Respuesta (recortada):
```json
{
  "id": 77,
  "expensa": 42,
  "monto": "50000.00",
  "verificado": false,
  "puede_verificar": true,
  "saldo_pendiente_expensa": 0.0
}
```

### Auto-verificación
Si el monto hace que el total verificado alcance exactamente el total de la expensa, el pago se marca `verificado=true` automáticamente y se actualiza `pagado=true` en la expensa.

### Validaciones de backend
Error | Mensaje
------|--------
Monto excede saldo | `El monto (X) excede el saldo pendiente (Y)`
Monto <= 0 | ValidationError nativo (no pasa limpieza)
Expensa de otro propietario | 403 `No puede registrar pagos para expensas de otro propietario`

## Verificar pago (staff)
PATCH `/api/pagos/{id}/verificar/`
Devuelve pago actualizado. Frontend de propietario NO debe mostrar botón de verificación.

## Rechazar verificación (staff)
PATCH `/api/pagos/{id}/rechazar_verificacion/`
Revierte `verificado` y vuelve a recalcular estado `pagado` de la expensa.

## Estados y derivaciones
Campo | Cómo se calcula
------|-----------------
`pagado` | `total_pagado_verificado >= total`.
`esta_vencida` | `!pagado && fecha_vencimiento < hoy`.
`saldo_pendiente` | `max(0, total - total_pagado_verificado)`.
`restringido_por_mora` | Prop basado en expensas vencidas (>= umbral).

## UX recomendada
Elemento | Comportamiento sugerido
---------|------------------------
Lista de expensas | Tabla con columnas: Mes, Total, Pagado, Vencida, Saldo Pendiente, Acciones.
Indicador de mora | Banner rojo si restringido.
Registro de pago | Formular modal con: método, monto, comprobante.
Bloqueo reservas | Deshabilitar acceso a módulo reservas si `restringido_por_mora`.
Tooltip saldo | Mostrar desglose: cuota + reservas + multas.
Pagos parciales | Permitir múltiples pagos hasta cerrar saldo.

## Ejemplo flujo UI
1. GET `/api/propietarios/me/` → muestra `meses_mora` y `restringido_por_mora`.
2. GET `/api/expensas/?pagado=false` → listar pendientes.
3. Usuario abre expensa → GET `/api/pagos/?expensa={id}`.
4. Registra pago parcial → POST `/api/pagos/`.
5. Backend auto-verifica si quedó exacto → recargar expensa.
6. Cuando `saldo_pendiente === 0` → mostrar badge Pagada.

## Manejo de errores comunes
Código | Causa | Mensaje ejemplo
------|-------|----------------
400 | Pago excede saldo | `El monto (X) excede el saldo pendiente (Y)`
400 | Datos inválidos | Errores de validación DRF
403 | Intento sobre expensa ajena | `No puede registrar pagos para expensas de otro propietario`
403 | Verificar pago sin ser staff | `Solo staff puede verificar pagos`
404 | ID inexistente | `Not found`

## Buenas prácticas para el frontend
- Cachear lista de expensas y refetch tras crear pago.
- No exponer controles de verificación a propietarios.
- Mostrar fechas en formato local (ej. `mes_referencia` → `Agosto 2025`).
- Mostrar evolución: gráfico de barras (mes vs pagado vs saldo).
- Color semáforo: Pagada (verde), Vencida (rojo), Pendiente (ámbar), Parcial (azul).

## Posibles mejoras futuras
- Endpoint resumen: `/api/expensas/resumen/` → totales agregados.
- Exportar PDF/Excel de historial.
- Notificaciones cuando una expensa está a 3 días de vencer.
- Simulación de pago (calcular saldo proyectado).

---
Última actualización: <FECHA ACTUALIZAR MANUALMENTE>
