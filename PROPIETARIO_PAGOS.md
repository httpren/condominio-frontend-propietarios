# PWA PROPIETARIO - EXPENSAS & PAGOS

Guía específica para que el frontend de Propietarios consuma y gestione EXPENSAS (cuotas) y registre PAGOS correctamente. No incluye lógica administrativa (generación masiva, verificación manual) salvo donde impacta la experiencia del propietario.

---
## 1. Conceptos
- **Expensa**: Documento mensual (mes_referencia = primer día del mes) con tres componentes: `cuota_basica`, `reservas` (cargos por reservas de áreas confirmadas), `multas`. Tiene `pagado` (bool) que se vuelve true solamente cuando la suma de pagos VERIFICADOS >= total.
- **Pago**: Registro que el propietario crea para informar un abono. NO queda verificado automáticamente. El staff lo revisa y marca verificado.
- **Saldo pendiente**: `total - total_pagado_verificado`. Pagos aún no verificados no reducen el saldo.
- **Mora / Restricción**: Si el propietario acumula >= 3 expensas vencidas (config `MORA_THRESHOLD`), queda `restringido_por_mora=true` y no puede crear/confirmar reservas de áreas (impacta otra sección). Este estado se recalcula al guardar expensas y pagos verificados.

---
## 2. Endpoints (Propietario)
Base asumida: `/api`

| Acción | Método & Path | Descripción | Notas |
|--------|---------------|-------------|-------|
| Listar expensas propias | GET `/api/expensas/` | Todas las del propietario | Filtrables por query params |
| Filtrar por mes | GET `/api/expensas/?mes=2025-08` | Año-mes (YYYY-MM) | Usa `mes_referencia` |
| Filtrar pagadas / no pagadas | GET `/api/expensas/?pagado=true` | `true|false` | `pagado` depende de pagos verificados |
| Listar vencidas | GET `/api/expensas/?vencida=true` | Solo expensas impagas con vencimiento pasado | Para alertas |
| Ver detalle expensa | GET `/api/expensas/{id}/` | Incluye totales y saldo | |
| Listar pagos creados | GET `/api/pagos/` | Solo pagos de sus expensas | Puede filtrar por `expensa` |
| Crear pago | POST `/api/pagos/` | Registrar un pago pendiente de verificación | Valida que sea su expensa |
| Ver detalle pago | GET `/api/pagos/{id}/` | Incluye estado verificación | |
| (Opcional UX) Reintentar pago | PATCH `/api/pagos/{id}/` | Editar monto/notas antes verificación | Backend permite mientras no se cambie expensa |

> Propietario NO puede verificar ni rechazar verificación: acciones staff.

---
## 3. Estructuras de Datos
### 3.1 Expensa (respuesta JSON)
```json
{
  "id": 51,
  "propietario": 7,
  "propietario_nombre": "Juan Pérez",
  "mes_referencia": "2025-08-01",
  "cuota_basica": "150000.00",
  "reservas": "20000.00",
  "multas": "0.00",
  "fecha_vencimiento": "2025-08-15",
  "pagado": false,
  "observaciones": null,
  "created_at": "2025-08-01T08:00:11Z",
  "updated_at": "2025-08-01T08:00:11Z",
  "total": "170000.00",
  "total_pagado_verificado": "0.00",
  "saldo_pendiente": "170000.00",
  "esta_vencida": true
}
```
Campos clave para UI:
- `total` → mostrar total a pagar.
- `saldo_pendiente` → cuanto falta (solo descuenta pagos verificados).
- `esta_vencida` + `fecha_vencimiento` → estilos de alerta.
- `pagado` → bandera principal para mostrar "Pagada".

### 3.2 Pago (respuesta JSON)
```json
{
  "id": 134,
  "expensa": 51,
  "expensa_info": "Expensa August 2025 - Juan Pérez",
  "fecha_pago": "2025-08-05",
  "monto": "50000.00",
  "metodo_pago": "transferencia",
  "comprobante": "TRX123-BCO",
  "notas": "Primer abono",
  "verificado": false,
  "fecha_verificacion": null,
  "verificado_por": null,
  "created_at": "2025-08-05T12:30:00Z",
  "updated_at": "2025-08-05T12:30:00Z",
  "propietario_nombre": "Juan Pérez",
  "puede_verificar": true,
  "saldo_pendiente_expensa": 170000.0
}
```
Campos clave:
- `verificado` → estado (mientras false, el monto no descuenta saldo en expensa).
- `saldo_pendiente_expensa` → usarlo para validar monto localmente antes de enviar.
- `metodo_pago` → enumeración: efectivo, transferencia, tarjeta, cheque.

---
## 4. Flujos Principales
### 4.0 Vista General de Estados
Expensa (perspectiva propietario):

```
BORRADOR (no visible) -> (no aplica al propietario: ya se lista como) ABIERTA
ABIERTA (pagado=false) --(pago verificado suma total)--> PAGADA
ABIERTA --(vencimiento pasa y sigue impaga)--> ABIERTA VENCIDA (solo etiqueta 'vencida')
PAGADA (pagado=true)
```

Nota: No hay transición hacia atrás desde PAGADA (solo administración podría corregir, pero el propietario lo verá actualizado si ocurre).

Pago (perspectiva propietario):

```
CREADO (verificado=false) --(staff verifica)--> VERIFICADO (verificado=true)
CREADO (antes verificación) --(edición PATCH opcional)--> CREADO (actualizado)
```

### 4.0.1 Secuencia Registrar Pago (Texto)
1. Usuario abre detalle expensa.
2. Presiona "Registrar Pago".
3. Front valida monto <= saldo_pendiente.
4. POST `/pagos/`.
5. Backend responde 201 (estado verificado=false).
6. UI agrega pago a lista "Pendientes".
7. Más tarde (polling o refresh) expensa muestra menos saldo solo cuando backend marca verificado (automático tras revisión administrativa).

### 4.0.2 Secuencia Expensa se Paga Completamente
1. Expensa abierta con saldo 50,000.
2. Propietario registra pago 50,000 (pendiente).
3. Todavía `pagado=false` hasta verificación.
4. Staff verifica (evento invisible para propietario, detectado vía refresh).
5. Propietario refresca: ahora `total_pagado_verificado == total` → `pagado=true`, `saldo_pendiente=0`.
6. UI mueve la card a sección "Pagadas" o cambia color.
### 4.1 Listar Expensas
1. GET `/api/expensas/`.
2. Ordenar por `mes_referencia` desc (backend ya lo hace).
3. Mostrar chips de estado:
   - Pagada (verde) si `pagado` true.
   - Vencida (rojo) si `esta_vencida` true y `pagado` false.
   - Pendiente (amarillo) en caso restante.

### 4.2 Detalle de Expensa
- Mostrar desglose: cuota básica, reservas, multas, total.
- Mostrar pagos verificados (filtrar `verificado=true` en lista de pagos local) y pagos pendientes (verificado=false) en otra sección.
- Call to action: "Registrar Pago" si `pagado=false`.

### 4.3 Registrar Pago
Formulario campos:
| Campo | Tipo | Reglas |
|-------|------|--------|
| expensa (id) | hidden | Debe pertenecer al propietario |
| fecha_pago | date (default hoy) | Opcional editar |
| monto | decimal | > 0 y <= saldo_pendiente actual (mostrar límite) |
| metodo_pago | select | Valores del enum |
| comprobante | text | Referencia/ID transferencia (opcional) |
| notas | textarea | Opcional |

Request ejemplo:
```json
{
  "expensa": 51,
  "fecha_pago": "2025-08-05",
  "monto": "50000.00",
  "metodo_pago": "transferencia",
  "comprobante": "TRX123-BCO",
  "notas": "Primer abono"
}
```
Respuesta 201: objeto pago.

Validaciones a implementar en frontend (además de las del backend):
- Montos parciales permitidos (no se exige cubrir todo el saldo).
- Sumar pagos PENDIENTES + monto nuevo y no exceder el total (UI warning). El backend rechazará si excede saldo considerando SOLO verificados, por lo que la UI podría permitir un número mayor si hay pagos pendientes; decidir política (recomendado: limitar según saldo_pendiente para experiencia clara).

### 4.4 Estado Después de Registrar Pago
- Pago aparece en lista con `verificado=false`.
- `saldo_pendiente` de expensa NO cambia hasta verificación.
- Pueden existir varios pagos pendientes.

### 4.5 Verificación Posterior (Efecto para Propietario)
Cuando administración lo marca verificado:
- Re-fetch de expensa mostrará `total_pagado_verificado` actualizado.
- Si suma >= total → expensa se mostrará `pagado=true` y saldo_pendiente=0.
- Actualización puede ocurrir en background (polling) o tras evento manual (pull-to-refresh).

### 4.6 Estrategia de Polling / Refresco
Recomendado:
- Pantalla lista de expensas: refresco manual (pull-to-refresh) + polling cada 2–3 minutos si visible.
- Pantalla detalle expensa: refrescar cada 30–60s mientras existan pagos pendientes (`verificado=false`).

---
## 5. Filtros Soportados (Lista Expensas)
| Param | Ejemplo | Uso |
|-------|---------|-----|
| `pagado` | `?pagado=false` | Expensas aún abiertas |
| `mes` | `?mes=2025-07` | Filtrar un mes específico |
| `vencida` | `?vencida=true` | Enfoque en urgencias |

Front puede componer URL: `/api/expensas/?pagado=false&vencida=true`.

---
## 6. Cálculos UI Recomendados
- Porcentaje pagado (verificado): `pct = total_pagado_verificado / total * 100` (si total>0) → barra de progreso.
- Días restantes: `dias = (fecha_vencimiento - hoy)` → colores (<=3 rojo, <=7 amarillo, >7 neutro).
- Etiqueta mora global: Si `restringido_por_mora` (propietario.me) mostrar alerta persistente (ver sección 6.1).

### 6.1 Badge / Banner Global de Mora
Obtener al inicio el perfil (`GET /api/propietarios/me/`):
```json
{
  "id": 7,
  "restringido_por_mora": true,
  "meses_mora": 3,
  "user": { "first_name": "Juan", "last_name": "Pérez", ... }
}
```
Si `restringido_por_mora=true`:
- Mostrar banner fijo: "Tienes mora de 3 meses. Regulariza para quitar restricciones".
- En lista de expensas: resaltar las expensas vencidas con borde rojo.
- (Opcional) Deshabilitar botones que dependan de estar al día (reservas) y llevar a la pantalla de expensas.

Actualizar este estado cuando una expensa pasa de impaga a pagada y reduce el conteo de vencidas (refetch perfil tras verificación de pagos).

---
## 7. Edge Cases / Errores
| Caso | API Respuesta | Acción UI |
|------|---------------|-----------|
| Monto excede saldo (considerando verificados) | 400 con mensaje | Mostrar toast "Monto excede saldo" |
| Intento pagar expensa de otro propietario | 403 | Redirigir / ocultar expensa ajena |
| Expensa inexistente | 404 | Mostrar pantalla not found |
| Falta auth | 401 | Ir a login |

---
## 8. Ejemplos de Código (Frontend)
### 8.1 Listar Expensas
```js
const expensas = await api.get('/expensas/?pagado=false');
```

### 8.2 Registrar Pago (con control de saldo)
```js
async function registrarPago(expensa, monto, metodo, comprobante, notas){
  if (monto <= 0) throw new Error('Monto inválido');
  if (monto > Number(expensa.saldo_pendiente)) {
    alert('El monto excede el saldo pendiente');
    return;
  }
  const payload = {
    expensa: expensa.id,
    fecha_pago: new Date().toISOString().slice(0,10),
    monto: monto.toFixed(2),
    metodo_pago: metodo,
    comprobante,
    notas
  };
  const pago = await api.post('/pagos/', payload);
  return pago;
}
```

### 8.3 Agrupar Pagos por Estado
```js
function separarPagos(pagos){
  return {
    verificados: pagos.filter(p => p.verificado),
    pendientes: pagos.filter(p => !p.verificado)
  };
}
```

### 8.4 Barra de Progreso
```js
function progreso(expensa){
  const total = Number(expensa.total);
  if (!total) return 0;
  const pagado = Number(expensa.total_pagado_verificado);
  return Math.min(100, Math.round((pagado/total)*100));
}
```

---
## 9. UI Sugerida
| Zona | Elementos |
|------|-----------|
| Lista Expensas | Cards: Mes (MMM YYYY), total, badge estado, progreso (si pagada mostrar 100% verde) |
| Detalle | Desglose montos, fecha vencimiento (badge), barra progreso, tabla pagos verificados, lista pagos pendientes |
| Registrar Pago Modal | Campos descritos + validación en vivo contra saldo pendiente |
| Alertas | Banner si mora (del perfil) + resaltado expensas vencidas |

---
## 10. Seguridad / Buenas Prácticas
- No exponer IDs de otro propietario en UI (aunque llegara manualmente un ID). La API ya bloquea, pero filtrar en frontend por precaución.
- Evitar que el usuario manipule `saldo_pendiente` local para validaciones críticas (el backend valida). Front solo ayuda UX.
- Mostrar aviso que la confirmación final depende de verificación administrativa.

---
## 11. Estrategia de Feedback al Usuario
| Evento | Mensaje sugerido |
|--------|------------------|
| Pago creado (201) | "Pago registrado. Aparecerá como pendiente hasta verificación." |
| Error validación monto | "El monto excede el saldo pendiente" |
| Expensa pagada tras refresh | "¡Expensa completada!" |
| Expensa próxima a vencer (<=3 días) | Mostrar badge rojo: "Vence en X días" |

---
## 12. Roadmap (Opcional Futuro)
- Adjuntar comprobante (archivo / imagen) → requiere FileField.
- Pagos online (pasarela) → ver flujo futuro abajo.
- Notificación push cuando un pago es verificado.
- Historial exportable (CSV / PDF) para el propietario.

### 12.1 Flujo Futuro: Pasarela de Pago (Referencia para Diseño UI)
Objetivo: permitir abono inmediato (tarjeta / botón de banco) y obtener confirmación casi real-time.

Secuencia estimada:
```
1. Usuario selecciona expensa y pulsa "Pagar Online".
2. Front hace POST /api/pagos/iniciar_online/ { expensa: id, monto }
3. Backend crea un 'pago provisional' (estado=pendiente_gateway) y devuelve { checkout_url, pago_id }.
4. Front redirige (o abre popup) a la pasarela usando checkout_url.
5. Usuario completa pago en la pasarela → redirección/ webhook.
6. Pasarela notifica al backend (webhook) → backend marca pago verificado=true (si éxito) y suma al total.
7. Front escucha (polling o canal push futuro) y actualiza estado expensa (pagado / saldo).
```
UI Preparación (sin backend aún):
- Botón adicional junto al botón "Registrar Pago Manual".
- Modal para elegir monto (por default saldo_pendiente).
- Estado intermedio: "Confirmando con pasarela...".

Consideraciones futuras backend (para alinear diseño):
- Endpoint iniciar (`/pagos/iniciar_online/`) y endpoint retorno (`/pagos/online/confirmacion/`).
- Campo nuevo en Pago: `origen = manual|online` y `estado_gateway`.
- Ajuste de seguridad: verificación via firma/hmac del proveedor.

---
## 13. TL;DR
1. Lista expensas -> `/expensas/`.
2. Mostrar saldo_pendiente y progreso (pagos verificados / total).
3. Registrar pago parcial o total con POST `/pagos/` siempre <= saldo pendiente.
4. Esperar verificación staff para que se actualice el saldo y estado `pagado`.
5. Refrescar periódicamente hasta que saldo = 0 o `pagado=true`.
 6. Mostrar banner de mora global si `restringido_por_mora` y guiar al usuario a saldar expensas vencidas.

Con esto el frontend puede implementar pagos de forma clara y segura.
