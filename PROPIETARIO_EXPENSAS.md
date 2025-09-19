# PWA PROPIETARIO - EXPENSAS (Sólo Vista y Seguimiento)

Guía enfocada exclusivamente en cómo el propietario (PWA) consulta, interpreta y presenta sus EXPENSAS. El registro y gestión de pagos está documentado aparte en `PROPIETARIO_PAGOS.md`.

---
## 1. Objetivo
Proveer al frontend la información necesaria para:
- Listar expensas con estados claros (pendiente, vencida, pagada).
- Mostrar progreso de pago (solo pagos verificados cuentan).
- Resaltar urgencias (próximas a vencer / vencidas).
- Integrar el estado global de mora.

---
## 2. Conceptos Clave
| Concepto | Descripción |
|----------|-------------|
| Expensa | Cargo mensual (mes_referencia) con suma de cuota básica + reservas + multas |
| Total | Suma exacta: `cuota_basica + reservas + multas` |
| Pagado | Boolean: true sólo cuando pagos verificados >= total |
| Saldo pendiente | `total - total_pagado_verificado` |
| Vencida | `fecha_vencimiento < hoy` y `pagado=false` |
| Mora global | Propietario acumula >= MORA_THRESHOLD expensas vencidas → `restringido_por_mora=true` |

---
## 3. Endpoints Relevantes
Base asumida: `/api`

Acción | Método & Path | Notas
-------|---------------|------
Listar expensas | GET `/api/expensas/` | Sólo propias (backend filtra) 
Ver detalle | GET `/api/expensas/{id}/` | Incluye campos calculados 
Filtrar por mes | GET `/api/expensas/?mes=YYYY-MM` | Ej: `?mes=2025-08` 
Filtrar por estado pagado | GET `/api/expensas/?pagado=true|false` | Para secciones separadas 
Listar vencidas | GET `/api/expensas/?vencida=true` | Construir alertas 
Perfil propietario (mora) | GET `/api/propietarios/me/` | Para banner de mora 

No hay creación / edición de expensas por el propietario.

---
## 4. Estructura de Expensa (JSON)
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
  "total_pagado_verificado": "50000.00",
  "saldo_pendiente": "120000.00",
  "esta_vencida": false
}
```
Campos UI clave:
- `total` (importe a cubrir)
- `saldo_pendiente` (restante real)
- `total_pagado_verificado` (para barra de progreso)
- `esta_vencida` + `fecha_vencimiento` (urgencia)
- `pagado` (estado final)

---
## 5. Estados y Transiciones
Representación simplificada (propietario):
```
          (pasa fecha_vencimiento)
ABIERTA  -------------------------->  ABIERTA VENCIDA
   |                                      |
   | (pagos verificados cubren total)     | (pagos verificados cubren total)
   v                                      v
 PAGADA <---------------------------------- 
```
Notas:
- No se muestra un estado distinto para "con pagos pendientes"; basta el progreso parcial.
- Una expensa vencida al pagarse pasa directamente a PAGADA.

---
## 6. Filtros y Ejemplos
| Objetivo | URL Ejemplo |
|----------|-------------|
| Expensas abiertas (no pagadas) | `/api/expensas/?pagado=false` |
| Expensas pagadas | `/api/expensas/?pagado=true` |
| Un mes específico | `/api/expensas/?mes=2025-07` |
| Sólo vencidas | `/api/expensas/?vencida=true` |
| Mezcla (abiertas vencidas) | `/api/expensas/?pagado=false&vencida=true` |

### 6.1 Estrategia de Carga Inicial
1. GET `/api/expensas/?pagado=false` (abiertas) → secciones: pendientes / vencidas.
2. GET `/api/expensas/?pagado=true` (pagadas) bajo demanda (pestaña secundaria / lazy load).
3. GET perfil `/api/propietarios/me/` (para `restringido_por_mora`).

---
## 7. Cálculos UI Recomendados
- Progreso: `pct = (total_pagado_verificado / total) * 100` (clamp 0..100).
- Días para vencer: `(fecha_vencimiento - hoy)` (si <=0 y !pagado → vencida).
- Etiqueta próxima a vencer: <=3 días → rojo; <=7 → ámbar.
- Formato mes: usar `mes_referencia` → mostrar `MMM YYYY`.

Ejemplo función progreso (JS):
```js
function progreso(expensa){
  const total = Number(expensa.total);
  if (!total) return 0;
  return Math.min(100, Math.round(Number(expensa.total_pagado_verificado)/total*100));
}
```

---
## 8. Sincronización / Polling
Escenario | Recomendación
----------|--------------
Lista principal | Refresh manual (pull) + polling cada 2–3 min si la vista está activa
Detalle expensa (si saldo_pendiente > 0) | Poll cada 45–60s
Después de registrar pago | Forzar refresh del detalle tras 2–3s y luego volver a intervalo normal
Cambio detectado (pagado pasa a true) | Detener polling para esa expensa

---
## 9. Interacción con Pagos (Resumen)
La expensa refleja únicamente pagos VERIFICADOS:
- Pagos pendientes no alteran `saldo_pendiente` ni `total_pagado_verificado`.
- Para mostrar pagos pendientes el frontend debe consultar `/api/pagos/?expensa={id}` (documentado en `PROPIETARIO_PAGOS.md`).
- Cuando el backend verifica un pago, en el siguiente refresh los campos cambian y eventualmente `pagado=true`.

Mostrar visualmente:
- Barra parcial si `total_pagado_verificado > 0` y `pagado=false`.
- Badge final “Pagada” cuando `pagado=true` (ocultar barra o mostrar 100% verde).

---
## 10. Mora Global
Obtener estado de mora al inicio (`/api/propietarios/me/`). Si `restringido_por_mora=true`:
- Banner persistente: "Tienes mora de X meses. Regulariza para recuperar funcionalidades".
- Enlista expensas vencidas primero (ordenar por `fecha_vencimiento` asc dentro del bloque).
- Deshabilitar acciones dependientes (ej: crear reserva) y dirigir a la sección de expensas.
Refrescar el perfil tras detectar que el número de expensas vencidas disminuyó (después de que algunas pasen a pagadas).

---
## 11. UI Sugerida
Zona | Elementos / Comportamiento
-----|---------------------------
Lista (abiertas) | Cards: Mes, total, saldo_pendiente, chips (Vencida / Próxima a vencer / Parcial), barra progreso
Lista (pagadas) | Cards simplificadas (mes + total + icono check) – carga diferida
Detalle | Desglose (cuota, reservas, multas), fecha vencimiento + badge, barra progreso, botón "Ver pagos" / "Registrar pago" (navega a flujo de pagos)
Banner Mora | Full width, color de alerta, CTA "Ir a expensas" si se muestra globalmente en otras vistas
Filtro Mes | Selector de mes (calendar o dropdown) que genera `?mes=YYYY-MM`

---
## 12. Errores / Edge Cases
Caso | Resultado | UX
-----|-----------|---
ID inválido | 404 | Mostrar pantalla no encontrado
Sin auth | 401 | Redirigir login
Expensa no pertenece al usuario (ID manual) | 404/403 (según backend) | Redirigir lista
Fallo de red | Timeout / error genérico | Mostrar estado offline y permitir reintentar

---
## 13. Roadmap Futuro (Expensas)
- Cache local (IndexedDB) para lista rápida offline.
- Agrupación anual y totales por año.
- Exportar PDF / CSV de expensas pagadas.
- Notificación push cuando se libera una nueva expensa del mes.
- Tag de variaciones (si reservas o multas > 0 mostrar indicador diferencial).

---
## 14. TL;DR
1. GET /expensas/ (abiertas) + /propietarios/me/ (mora).
2. Progreso = pagos verificados / total.
3. Vencida = hoy > fecha_vencimiento y !pagado.
4. Banner mora si restringido_por_mora.
5. Barra progreso parcial hasta pagado=true.
6. Pagadas: cargar bajo demanda.
7. Interacción con pagos → ver `PROPIETARIO_PAGOS.md`.

---
¿Necesitas una versión resumida para un README o dashboard técnico? Pide "resumen expensas propietario".
