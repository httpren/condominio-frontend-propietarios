# Guía Frontend: Gestión de Reservas de Áreas Comunes

Esta guía describe cómo el frontend (perfil Propietario) debe interactuar con los endpoints de **Reservas de Áreas Comunes** y recursos relacionados.

## Resumen de capacidades

| Acción | Endpoint | Método | Quién | Notas |
|--------|----------|--------|-------|-------|
| Listar reservas propias | `/api/reservas/` | GET | Propietario | Filtradas automáticamente por el backend. Paginado. |
| Crear reserva | `/api/reservas/` | POST | Propietario | El backend asigna `propietario`. No enviar ese campo. |
| Ver detalle | `/api/reservas/{id}/` | GET | Propietario dueño / Admin | |
| Actualizar (ej. horario, invitados) | `/api/reservas/{id}/` | PATCH/PUT | Propietario (si pendiente) / Admin | No cambiar `propietario`. |
| Confirmar (genera cargo expensa) | `/api/reservas/{id}/confirm/` | PATCH | Admin / (opcional según reglas) | Cambia a `confirmada` y suma costo a expensa del mes. |
| Cancelar | `/api/reservas/{id}/cancelar/` | PATCH | Propietario (si futura) / Admin | Cambia a `cancelada`. |
| Eliminar | `/api/reservas/{id}/` | DELETE | Admin (recomendado limitar) | Normalmente no se permite a propietarios. |

## Campos del modelo relevantes

Campo | Descripción | Escritura | Notas
------|-------------|----------|------
`area` | ID del área común | Requerido en creación | Debe existir y estar activa.
`fecha_reserva` | Fecha (YYYY-MM-DD) | Requerido | Debe ser futura (regla opcional a validar en frontend).
`hora_inicio` / `hora_fin` | Horas | Requerido | `hora_inicio < hora_fin` (validado backend).
`num_personas` | Entero | Requerido | No puede exceder `area.capacidad` (validado backend).
`costo_total` | Decimal | Read-only | Calculado automáticamente: `tarifa_hora * horas` mientras estado = pendiente.
`invitados` | Lista JSON | Opcional | Estructura sugerida: `[{"nombre": "Ana", "documento": "CC123"}]`.
`qr_anfitrion` | Texto | Read-only | Generado automático.
`qr_invitados` | Lista JSON | Read-only | Generado automático a partir de `invitados`.
`estado` | Estado actual | Read-only (en creación) | Cambia con confirm/cancel.

## Listado y filtros

GET `/api/reservas/` soporta filtros por query params:
- `estado=pendiente|confirmada|rechazada|cancelada`
- `area=<id>`
- `fecha=YYYY-MM-DD`

Ejemplo: `/api/reservas/?estado=pendiente&fecha=2025-09-25`

Respuesta paginada estándar DRF:
```json
{
  "count": 3,
  "next": null,
  "previous": null,
  "results": [ { "id": 12, "area": 5, ... } ]
}
```

## Crear una reserva

Request (NO enviar `propietario`, `qr_anfitrion`, `qr_invitados`, `estado`):
```json
{
  "area": 3,
  "fecha_reserva": "2025-10-05",
  "hora_inicio": "14:00:00",
  "hora_fin": "16:00:00",
  "num_personas": 12,
  // No enviar costo_total: se calcula automáticamente
  "invitados": [
    {"nombre": "Carlos Pérez", "documento": "CC111"},
    {"nombre": "Laura Díaz", "documento": "CC222"}
  ],
  "observaciones": "Reunión familiar"
}
```

Respuesta (recortada):
```json
{
  "id": 18,
  "propietario": 7,
  "area": 3,
  "fecha_reserva": "2025-10-05",
  "hora_inicio": "14:00:00",
  "hora_fin": "16:00:00",
  "num_personas": 12,
  "costo_total": "150000.00", // calculado por backend
  "estado": "pendiente",
  "qr_anfitrion": "RES:18:HOST:ab12cd34",
  "qr_invitados": [
    {"invitado": "Carlos Pérez", "qr_code": "RES:18:INV:0:ef12ab"},
    {"invitado": "Laura Díaz", "qr_code": "RES:18:INV:1:aa11bb"}
  ]
}
```

## Confirmar una reserva

PATCH `/api/reservas/{id}/confirm/`

Respuesta:
```json
{
  "detail": "Reserva confirmada y cargo agregado a expensa",
  "reserva_id": 18,
  "expensa_id": 55
}
```

Efectos:
- `estado` pasa a `confirmada`.
- Se crea (o reutiliza) la expensa del mes (`mes_referencia` = primer día de ese mes).
- Se suma `costo_total` al campo `reservas` de la expensa.

### Restricción por mora
Si el propietario está en mora (`restringido_por_mora=True`) la API devuelve:

Creación (POST /api/reservas/):
```json
{
  "detail": "No puede crear reservas mientras está en mora"
}
```

Confirmación (PATCH /api/reservas/{id}/confirm/):
```json
{
  "detail": "Propietario en mora: no puede confirmar la reserva"
}
```

Regla actual:
- La bandera `restringido_por_mora` se deriva de expensas vencidas (>= 3 según la lógica de Expensa) y también puede cambiar con pagos (en pagos se marca restringido si existe al menos una expensa vencida). Si hay discrepancia, se recomienda unificar lógica en backend.

## Cancelar una reserva

PATCH `/api/reservas/{id}/cancelar/`

Reglas implementadas:
- Propietario solo puede cancelar futuras (fecha_reserva > hoy) y no canceladas/rechazadas previamente.
- Admin puede cancelar siempre.
- Cambia `estado` a `cancelada`.

Respuesta:
```json
{
  "detail": "Reserva cancelada",
  "estado": "cancelada"
}
```

## Estados posibles
- `pendiente` (creación inicial)
- `confirmada` (cargo generado)
- `rechazada` (podría agregarse acción futura admin)
- `cancelada`

## QR y control de acceso

Los valores `qr_anfitrion` y cada `qr_invitados[].qr_code` son cadenas de texto usadas en el endpoint de acceso de guardias:
- POST `/api/registros/register_entry/` con body `{ "qr_code": "RES:...", "guardia_id": <id> }`.
- Si contiene `HOST` → se registra acceso anfitrión.
- Si contiene `INV` → acceso invitado.

No se genera imagen PNG automática; el frontend debe convertir el texto en un código QR visual (como en visitas) usando una librería (ej. `qrcode.js`).

## Actualizar reserva

PATCH `/api/reservas/{id}/`
Campos que típicamente puedes actualizar antes de confirmar:
```json
{
  "hora_inicio": "15:00:00",
  "hora_fin": "17:00:00",
  "num_personas": 14,
  "invitados": [
    {"nombre": "Carlos Pérez", "documento": "CC111"},
    {"nombre": "Laura Díaz", "documento": "CC222"},
    {"nombre": "Nuevo Invitado", "documento": "CC333"}
  ]
}
```
Nota: si cambias `invitados` después de creada y ya existen QRs, hoy no se regeneran automáticamente (posible mejora: endpoint para regenerar). 

## Recomendaciones de UX
- Mostrar claramente estado y reglas (ej. etiqueta “Confirmada / Pendiente”).
- Botón Confirmar solo visible si `estado === 'pendiente'` y fecha futura.
- Botón Cancelar visible si `estado in ['pendiente','confirmada']` y fecha futura.
- Deshabilitar edición si `estado !== 'pendiente'`.
- Mostrar contadores: Reservas futuras, pendientes, confirmadas.

## Manejo de errores comunes
Código | Causa | Mensaje ejemplo
------|-------|----------------
400 | Validación de horas | "La hora de inicio debe ser menor que la hora de fin".
400 | Capacidad excedida | "El número de personas excede la capacidad del área".
403 | Usuario sin perfil | "El usuario autenticado no tiene perfil de propietario".
403 | Propietario en mora (crear) | "No puede crear reservas mientras está en mora".
403 | Propietario en mora (confirmar) | "Propietario en mora: no puede confirmar la reserva".
404 | Reserva inexistente | "Not found" (DRF default).

## Autenticación
Agregar header: `Authorization: Bearer <token>` en todas las solicitudes.

## Ejemplo de flujo completo
1. Usuario ingresa y obtiene token.
2. GET `/api/propietarios/me/` → obtiene su ID (solo para mostrar, no para enviar en POST de reserva).
3. GET `/api/areas/` → lista de áreas para seleccionar.
4. POST `/api/reservas/` → crea reserva (estado pendiente).
5. PATCH `/api/reservas/{id}/confirm/` → confirma y genera cargo expensa.
6. Guardia escanea QR anfitrión/invitados y usa `/api/registros/register_entry/`.
7. Propietario cancela (si necesario) con `/api/reservas/{id}/cancelar/`.

## Posibles mejoras futuras
- Endpoint para regenerar QRs de invitados tras editar `invitados`.
- Límite de cancelaciones por mes.
- Validar solapamientos de reservas (no implementado aún).
- Notificaciones push/email al confirmar/cancelar.

---
Última actualización: <FECHA ACTUALIZAR MANUALMENTE>
