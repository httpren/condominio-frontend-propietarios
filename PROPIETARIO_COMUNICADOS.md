# PWA PROPIETARIO - GUÍA DE COMUNICADOS & PUSH

Esta guía explica TODO lo que el frontend (PWA Propietarios) necesita para mostrar, filtrar y marcar comunicados, además de registrar notificaciones push. No cubre otros módulos.

---
## 1. Conceptos Clave
- **Comunicado**: Aviso creado por administración. Puede ser MASIVO (para todos) o DIRIGIDO (solo un propietario).
- **Lectura**: Cada propietario puede marcar un comunicado como leído / no leído. El backend guarda ese estado.
- **Push**: Al crearse un comunicado se intenta enviar una notificación Web Push (si el propietario registró su suscripción y hay claves VAPID). El push NO reemplaza el fetch: siempre sincronizar por API.

---
## 2. Endpoints Relevantes (Propietario)
Base general asumida: `/api`

| Acción | Método & Path | Descripción | Autenticación |
|--------|---------------|-------------|---------------|
| Listar comunicados visibles | GET `/api/comunicados/` | Devuelve masivos + dirigidos a este propietario | JWT requerido |
| Filtrar no leídos | GET `/api/comunicados/?leidos=false` | Devuelve solo los que faltan leer | JWT |
| Filtrar por tipo | GET `/api/comunicados/?tipo=expensa` | Por tipo (`expensa|mora|reunion|general|seguridad`) | JWT |
| Contador resumen | GET `/api/comunicados/resumen/` | `{ total, leidos, no_leidos }` para badges | JWT |
| Marcar leído | POST `/api/comunicados/{id}/marcar_leido/` | Marca ese comunicado como leído | JWT |
| Marcar no leído | POST `/api/comunicados/{id}/marcar_no_leido/` | Revierte estado | JWT |
| Registrar suscripción push | POST `/api/push-subscriptions/` | Guarda endpoint + keys | JWT |
| Listar mis suscripciones push | GET `/api/push-subscriptions/` | Ver endpoints activos | JWT |
| Desactivar suscripción (id) | POST `/api/push-subscriptions/{id}/desactivar/` | Marca inactiva | JWT |
| Unregister por endpoint | POST `/api/push-subscriptions/unregister/` | Desactiva todas las que coinciden | JWT |

> El propietario NO crea comunicados. Solo consume.

---
## 3. Modelo (Vista desde frontend)
Objeto comunicado (respuesta LIST / DETAIL):
```json
{
  "id": 15,
  "titulo": "Expensa Agosto Disponible",
  "mensaje": "Ya puedes revisar y pagar tu expensa de Agosto.",
  "tipo": "expensa",
  "es_masivo": true,
  "propietario": null,              // si es dirigido vendrá el id del propietario objetivo
  "propietario_nombre": null,       // si es dirigido vendrá el nombre
  "creado_por": 3,
  "creado_por_nombre": "Admin Condominio",
  "fecha_envio": "2025-09-18T14:22:10Z",
  "leido": false                    // calculado para el propietario autenticado
}
```
Campos importantes para UI:
- `leido`: decide si mostrar badge / estilo bold.
- `tipo`: ícono o color (ej: mora = rojo, expensa = azul, seguridad = amarillo, reunión = morado, general = gris).
- `fecha_envio`: convertir a relativo ("hace 2h").

---
## 4. Flujo de Carga Inicial (Pantalla Inbox)
1. Llamar `GET /api/comunicados/` (sin filtros) al entrar.
2. Llamar en paralelo `GET /api/comunicados/resumen/` para badge global (si no quieres calcular tú mismo).
3. Guardar la lista en estado: ordenar por `fecha_envio desc` (el backend ya ordena, pero refuerza en UI).
4. Para cada item mostrar: icono por tipo + título + snippet mensaje + fecha + indicador `no leído`.
5. Al abrir un comunicado (click) disparar inmediatamente `POST /api/comunicados/{id}/marcar_leido/` (optimistic update local).
6. Si el usuario desea dejarlo como pendiente, usar `marcar_no_leido`.

---
## 5. Filtros y UX
- Toggle "Solo no leídos": re-fetch con `?leidos=false`.
- Filtro por tipo: `?tipo=expensa` (puedes combinar con `leidos=false`).
- Búsqueda por texto: (no endpoint específico) filtrar en memoria por `titulo` o parte del `mensaje`.
- Paginación: no implementada explícitamente; si la lista creciera, implementar UI con virtual scroll o query params futuros (`?page=`) cuando se añadan.

---
## 6. Marcado de Lectura (Optimistic UI)
Recomendado hacer update local antes de esperar respuesta:
```js
async function marcarLeido(id) {
  // Optimistic set
  setListado(prev => prev.map(c => c.id === id ? { ...c, leido: true } : c));
  try {
    await api.post(`/comunicados/${id}/marcar_leido/`);
  } catch(e) {
    // revert on error
    setListado(prev => prev.map(c => c.id === id ? { ...c, leido: false } : c));
  }
}
```
Análogo para `marcar_no_leido`.

---
## 7. Resumen (Badge Global)
Respuesta ejemplo `GET /api/comunicados/resumen/`:
```json
{ "total": 10, "leidos": 7, "no_leidos": 3 }
```
Usos:
- Badge en tab principal.
- Notificación interna (toast) si `no_leidos` aumenta respecto sesión anterior.
Polling sugerido: cada 60–120s mientras sección de comunicados no está en foreground.

---
## 8. Notificaciones Push (Cliente)
Las push son un complemento para avisar que hay nuevos comunicados; la fuente de verdad sigue siendo el endpoint de lista.

### 8.1 Prerrequisitos
- Navegador soportado (Chrome, Edge, Firefox, etc.).
- Usuario otorgó permiso `Notification`.
- Service Worker registrado (ej: `service-worker.js`).
- Backend tiene llaves VAPID (el frontend necesita la pública en Base64URL).

### 8.2 Registrar Suscripción
Ejemplo (pseudo código):
```js
async function registrarPush(vapidPublicKeyB64Url) {
  const registration = await navigator.serviceWorker.ready;
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return;

  // Base64URL -> Uint8Array
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
  }

  const sub = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKeyB64Url)
  });

  // Estructura sub: { endpoint, keys: { p256dh, auth } }
  await api.post('/push-subscriptions/', {
    endpoint: sub.endpoint,
    p256dh: sub.toJSON().keys.p256dh,
    auth: sub.toJSON().keys.auth,
    user_agent: navigator.userAgent
  });
}
```

### 8.3 Service Worker (Evento `push`)
Ejemplo mínimo:
```js
self.addEventListener('push', event => {
  if (!event.data) return;
  const payload = event.data.json();
  if (payload.type === 'comunicado') {
    event.waitUntil(
      self.registration.showNotification(payload.titulo, {
        body: payload.mensaje,
        data: { comunicadoId: payload.id },
        tag: `comunicado-${payload.id}`
      })
    );
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const id = event.notification.data?.comunicadoId;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(winClients => {
      const url = `/comunicados/${id}`;
      const client = winClients.find(c => c.url.includes('/comunicados'));
      if (client) { client.focus(); client.postMessage({ type: 'OPEN_COMUNICADO', id }); }
      else { clients.openWindow(url); }
    })
  );
});
```

### 8.4 Sincronización tras Push
Cuando el usuario hace click en la notificación:
1. Abrir/enfocar PWA.
2. Refrescar `GET /api/comunicados/?leidos=false` para mostrar nuevos.
3. Opcional: marcar como leído automáticamente si abrimos el detalle.

### 8.5 Unsubscribe / Logout
Al cerrar sesión:
```js
async function unSubscribeAll() {
  const registration = await navigator.serviceWorker.ready;
  const subs = await registration.pushManager.getSubscription();
  if (subs) {
    await api.post('/push-subscriptions/unregister/', { endpoint: subs.endpoint });
    await subs.unsubscribe();
  }
}
```
También puedes listar tus suscripciones `GET /push-subscriptions/` y desactivar por id.

---
## 9. Estrategia de Actualización Local
- Después de registrar una suscripción push no necesitas refetch inmediato; solo guardar un flag de éxito para UX.
- Si la app estuvo cerrada horas, al abrir siempre refrescar la lista independientemente de notificaciones.
- Manejo de duplicados: si una notificación llega mientras la lista ya contiene el comunicado, ignora o resalta temporalmente.

---
## 10. Manejo de Estados / UI Sugerida
Estados por item:
| Estado | Condición | Estilo sugerido |
|--------|----------|-----------------|
| No leído | `leido == false` | Bold + punto indicador |
| Leído | `leido == true` | Texto normal, sin badge |
| Nuevo (reciente) | `ahora - fecha_envio < 10m` | Etiqueta "Nuevo" o animación leve |

---
## 11. Errores y Reintentos
| Caso | Síntoma | Acción Frontend |
|------|---------|-----------------|
| 401 / 403 | Token inválido | Redirigir a login |
| 404 marcar_leido | Comunicado borrado | Remover de lista |
| Fallo push subscribe | `Notification.permission !== 'granted'` | Mostrar CTA para habilitar notifs |
| 410/404 backend marca inactiva | Suscripción desaparece | Ofrecer registrar de nuevo (botón) |

---
## 12. Checklist de Implementación Frontend
- [ ] Endpoint base configurado y JWT en headers.
- [ ] Pantalla Inbox lista + render condicional de iconos por tipo.
- [ ] Botón/acción para marcar leído / no leído (optimistic).
- [ ] Badge global usando `/resumen`.
- [ ] Filtro `Solo no leídos`.
- [ ] Registro push (condicional al permiso).
- [ ] Service Worker con handler `push` y `notificationclick`.
- [ ] Manejo logout -> unsubscribe.
- [ ] Resalte de comunicado recién abierto desde notificación.

---
## 13. Ejemplos Rápidos de Llamadas (Fetch)
```js
// Listar
const lista = await api.get('/comunicados/');

// Solo no leídos
const noLeidos = await api.get('/comunicados/?leidos=false');

// Resumen badge
const resumen = await api.get('/comunicados/resumen/');

// Marcar leído
await api.post(`/comunicados/${id}/marcar_leido/`);

// Registrar push (luego de subscribe())
await api.post('/push-subscriptions/', { endpoint, p256dh, auth, user_agent: navigator.userAgent });
```

---
## 14. Buenas Prácticas
- Siempre degradar: si push falla, la app sigue funcionando vía polling.
- Limitar frecuencia de polls (`resumen` cada 1–2 minutos; lista completa solo on-focus o interacción pull-to-refresh).
- Sanitizar HTML (si en futuro se permiten mensajes enriquecidos; actualmente son texto plano).
- Guardar timestamp último fetch para decidir si refrescar automáticamente al volver desde background.

---
## 15. Roadmap (Opcional Futuro)
- Paginación y carga incremental.
- Búsqueda server-side.
- Adjuntos en comunicado (PDF de convocatoria, etc.).
- Métricas de lectura (mostrar % leído si es masivo).
- Preferencias de notificación por tipo.

---
## 16. TL;DR (Resumen Ultra Breve)
Fetch `/comunicados/`, muestra lista, marca lectura con POST, badge desde `/comunicados/resumen/`. Registra push (POST `/push-subscriptions/`) después de `pushManager.subscribe()`, escucha evento `push` y refresca si llega algo. No más magia.

Listo. Con esto el frontend tiene todo lo necesario para implementar la sección de Comunicados con soporte de notificaciones push.
