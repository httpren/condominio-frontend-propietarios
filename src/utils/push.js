import axiosInstance from '../api/axiosConfig';

function urlBase64ToUint8Array(base64String) {
  if (!base64String) {
    throw new Error('base64String es requerido');
  }

  try {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    
    let rawData;
    if (typeof atob !== 'undefined') {
      rawData = atob(base64);
    } else if (typeof Buffer !== 'undefined') {
      rawData = Buffer.from(base64, 'base64').toString('binary');
    } else {
      throw new Error('No se encontró método para decodificar base64');
    }
    
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  } catch (error) {
    console.error('Error convirtiendo base64:', error);
    throw new Error(`Error al convertir clave VAPID: ${error.message}`);
  }
}

// Verificar soporte de push notifications
export const isPushSupported = () => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

// Solicitar permisos de notificación
export const requestNotificationPermission = async () => {
  if (!isPushSupported()) {
    throw new Error('Push notifications no soportadas');
  }

  const permission = await Notification.requestPermission();
  
  if (permission !== 'granted') {
    throw new Error('Permisos de notificación denegados');
  }
  
  return permission;
};

// Verificar estado de suscripción actual
export const checkSubscriptionStatus = async () => {
  if (!isPushSupported()) return false;
  
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      console.log('🔍 No hay suscripción local');
      return false;
    }
    
    // Verificar si el backend reconoce esta suscripción
    try {
      const response = await axiosInstance.get('/push-subscriptions/');
      let userSubs = [];
      if (Array.isArray(response.data)) {
        userSubs = response.data;
      } else if (response.data && Array.isArray(response.data.results)) {
        userSubs = response.data.results;
      }
      
      const currentEndpoint = subscription.endpoint;
      const isValid = userSubs.some(sub => sub.endpoint === currentEndpoint && sub.activo === true);
      
      console.log('🔍 Verificando suscripción en backend:', {
        localEndpoint: currentEndpoint.substring(0, 50) + '...',
        backendSubs: userSubs.length,
        isValid,
        currentOrigin: window.location.origin
      });
      
      return isValid;
    } catch (backendError) {
      console.warn('⚠️ Error verificando backend, asumiendo suscripción válida:', backendError);
      return true; // Si no podemos verificar el backend, asumir que está bien
    }
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
};

// Registrar para push notifications
export async function registrarPush(vapidPublicKeyB64Url, options = {}) {
  // Evitar llamadas simultáneas que puedan causar condiciones de carrera
  if (registrarPush._busy) {
    return { success: false, message: 'Registro push en curso' };
  }
  registrarPush._busy = true;
  console.log('🔧 Iniciando registro push con VAPID key:', vapidPublicKeyB64Url ? 'Presente' : 'Ausente');
  
  if (!isPushSupported()) {
    return { success: false, message: 'No soportado' };
  }

  if (!vapidPublicKeyB64Url) {
    console.error('❌ VAPID_PUBLIC_KEY no proporcionada');
    return { success: false, message: 'Clave VAPID no configurada' };
  }

  try {
    // Solicitar permisos
    console.log('🔔 Solicitando permisos de notificación...');
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.error('❌ Permisos denegados');
      return { success: false, message: 'Permiso denegado' };
    }
    console.log('✅ Permisos concedidos');

    // Asegurar que el service worker esté registrado y listo
    console.log('🔄 Verificando service worker...');
    let registration;
    try {
      registration = await navigator.serviceWorker.ready;
      console.log('✅ Service Worker listo:', registration.scope);
    } catch (swError) {
      console.error('❌ Error con service worker:', swError);
      return { success: false, message: 'Service Worker no disponible' };
    }

    // Verificar que el service worker tenga capacidades de push
    if (!registration.pushManager) {
      console.error('❌ PushManager no disponible en este service worker');
      return { success: false, message: 'Push Manager no disponible' };
    }
    
    // Verificar si ya existe una suscripción
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      console.log('🔍 Suscripción existente encontrada, verificando validez...');
      try {
        const response = await axiosInstance.get('/push-subscriptions/');
        let userSubsRaw = response.data;
        let userSubs = [];
        if (Array.isArray(userSubsRaw)) {
          userSubs = userSubsRaw;
        } else if (userSubsRaw && typeof userSubsRaw === 'object' && Array.isArray(userSubsRaw.results)) {
          // DRF paginated format
            userSubs = userSubsRaw.results;
        } else {
          console.warn('⚠️ Formato inesperado en /push-subscriptions/:', userSubsRaw);
        }
        const currentEndpoint = existing.endpoint;
        const isValid = userSubs.some(sub => sub.endpoint === currentEndpoint && sub.activo !== false);
        if (isValid) {
          console.log('✅ Suscripción existente válida (backend la reconoce)');
          registrarPush._busy = false;
          return { success: true, message: 'Ya registrado' };
        }
        // Backend no la tiene registrada: intentar registrar SIN crear nueva suscripción
        console.log('ℹ️ Suscripción local no registrada en backend. Intentando registrar directamente...');
        const existingJson = existing.toJSON();
        try {
          const registerExistingResp = await axiosInstance.post('/push-subscriptions/', {
            endpoint: existing.endpoint,
            p256dh: existingJson.keys?.p256dh,
            auth: existingJson.keys?.auth,
            user_agent: navigator.userAgent
          });
          console.log('✅ Suscripción local registrada exitosamente en backend');
          registrarPush._busy = false;
          return { success: true, data: registerExistingResp.data, message: 'Registrada (reutilizada)' };
        } catch (regErr) {
          const data = regErr?.response?.data;
          // Caso típico: { endpoint: ["push subscription with this endpoint already exists."] }
          if (data && data.endpoint && Array.isArray(data.endpoint)) {
            const msg = data.endpoint.join(' ');
            console.log('ℹ️ Respuesta backend (endpoint 400):', msg);
            // Cualquier 400 con endpoint lo tratamos como éxito idempotente
            console.log('✅ Tratado como éxito idempotente (endpoint ya asociado a otro usuario o existente).');
            registrarPush._busy = false;
            return { success: true, message: 'Ya registrado (idempotente backend)' };
          }
          console.warn('⚠️ No se pudo registrar la suscripción existente en backend, se intentará recrear:', data || regErr.message);
          // Solo si no es el caso de duplicado intentamos recrear
          try { await existing.unsubscribe(); console.log('🔄 Suscripción local eliminada, creando nueva...'); } catch (unsubErr) { console.warn('Error al desuscribir previa:', unsubErr); }
        }
      } catch (error) {
        console.log('⚠️ Error consultando backend de suscripciones, se intentará recrear:', error?.message || error);
        // No desuscribir inmediatamente; primero intentaremos crear una nueva si la API lo permite.
        // Para minimizar AbortError si la plataforma no acepta múltiples, mantenemos la existente y retornamos éxito best-effort.
        registrarPush._busy = false;
        return { success: true, message: 'Suscripción existente (no verificada por backend)' };
      }
    }

    // Validar y convertir la clave VAPID
    console.log('🔑 Validando clave VAPID...');
    console.log('Clave recibida:', vapidPublicKeyB64Url.substring(0, 20) + '...');
    console.log('Longitud:', vapidPublicKeyB64Url.length);
    
    // Validaciones básicas de la clave VAPID
    if (vapidPublicKeyB64Url.length < 80 || vapidPublicKeyB64Url.length > 90) {
      console.error('❌ Longitud de clave VAPID sospechosa:', vapidPublicKeyB64Url.length);
      return { success: false, message: 'Longitud de clave VAPID inválida' };
    }
    
    if (!vapidPublicKeyB64Url.startsWith('B')) {
      console.error('❌ Clave VAPID debe comenzar con "B"');
      return { success: false, message: 'Formato de clave VAPID inválido - debe comenzar con B' };
    }
    
    let applicationServerKey;
    try {
      applicationServerKey = urlBase64ToUint8Array(vapidPublicKeyB64Url);
      console.log('✅ Clave VAPID convertida correctamente');
      console.log('Array length:', applicationServerKey.length, 'bytes (esperado: 65)');
      
      if (applicationServerKey.length !== 65) {
        console.error('❌ Longitud de clave convertida incorrecta');
        return { success: false, message: 'Clave VAPID procesada tiene longitud incorrecta' };
      }
    } catch (keyError) {
      console.error('❌ Error convirtiendo clave VAPID:', keyError);
      return { success: false, message: 'Error al procesar clave VAPID: ' + keyError.message };
    }

    // Crear nueva suscripción
    console.log('📝 Creando nueva suscripción...');
    let subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey
    });
    console.log('✅ Suscripción creada exitosamente');

    const json = subscription.toJSON();
    
    // Enviar al backend según la API documentada
    console.log('📤 Enviando suscripción al backend...');
    try {
      const response = await axiosInstance.post('/push-subscriptions/', {
        endpoint: subscription.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
        user_agent: navigator.userAgent
      });
      console.log('✅ Suscripción registrada en backend');
      return { success: true, data: response.data };
    } catch (regNewErr) {
      const data = regNewErr?.response?.data;
      if (data && data.endpoint && Array.isArray(data.endpoint)) {
        const msg = data.endpoint.join(' ');
        console.log('ℹ️ Respuesta backend (nuevo registro 400 endpoint):', msg);
        console.log('✅ Tratado como éxito idempotente tras creación local.');
        return { success: true, message: 'Ya registrado (endpoint existente backend)' };
      }
      // Intento de "reset forzado" si se configuró y aún no se intentó
      if (!registrarPush._forceTried && options.forceResetOn400 !== false) {
        registrarPush._forceTried = true;
        console.warn('⚠️ Intentando reset forzado de suscripción (unsubscribe + nueva) por 400 no-duplicado...');
        try {
          await subscription.unsubscribe();
          await new Promise(r => setTimeout(r, 500));
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey
          });
          const j2 = subscription.toJSON();
          const second = await axiosInstance.post('/push-subscriptions/', {
            endpoint: subscription.endpoint,
            p256dh: j2.keys.p256dh,
            auth: j2.keys.auth,
            user_agent: navigator.userAgent
          });
          console.log('✅ Registro exitoso tras reset forzado');
          return { success: true, data: second.data, message: 'Registrado tras reset forzado' };
        } catch (forceErr) {
          console.error('❌ Falló reset forzado:', forceErr?.response?.data || forceErr.message);
        }
      }
      throw regNewErr; // re-lanzar para manejo genérico
    }
  } catch (error) {
    console.error('❌ Error registrando push:', error);
    
    // Proporcionar mensajes de error más específicos
    let errorMessage = error.message;

    // Diagnóstico extendido para AbortError (push service error)
    if (error.name === 'AbortError') {
      try {
        const permissions = await navigator.permissions.query({ name: 'notifications' });
        console.debug('[Diag] Permisos notifications:', permissions.state);
      } catch (_) {}
      console.debug('[Diag] isSecureContext:', window.isSecureContext, ' origin:', location.origin);
      console.debug('[Diag] UserAgent:', navigator.userAgent);
      console.debug('[Diag] ServiceWorker registrations:', await navigator.serviceWorker.getRegistrations());
      console.debug('[Diag] Intentará forzar unsubscribe/resubscribe si existía suscripción previa.');
      try {
        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        if (existing) {
          await existing.unsubscribe();
          console.debug('[Diag] Desuscripción previa realizada, reintentando una vez...');
          try {
            const retrySub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapidPublicKeyB64Url) });
            console.debug('[Diag] Reintento de suscripción logró crear subscription (AbortError temporal).');
            const j = retrySub.toJSON();
            const response = await axiosInstance.post('/push-subscriptions/', {
              endpoint: retrySub.endpoint,
              p256dh: j.keys.p256dh,
              auth: j.keys.auth,
              user_agent: navigator.userAgent
            });
            return { success: true, data: response.data, message: 'Registrado tras reintento AbortError' };
          } catch (retryErr) {
            console.debug('[Diag] Reintento tras AbortError también falló:', retryErr?.name, retryErr?.message);
          }
        }
      } catch (inner) {
        console.debug('[Diag] Error en intento de recuperación tras AbortError:', inner.message);
      }
    }
    
    if (error.name === 'AbortError') {
      errorMessage = 'Error del servicio push. Verifica la clave VAPID.';
    } else if (error.name === 'NotSupportedError') {
      errorMessage = 'Push notifications no soportadas en este navegador.';
    } else if (error.name === 'NotAllowedError') {
      errorMessage = 'Permisos de notificación denegados.';
    } else if (error.response?.status === 400) {
      // Intentar inferir causa
      const data = error.response?.data;
      if (data && typeof data === 'object') {
        if (data.endpoint) {
          const epMsg = Array.isArray(data.endpoint) ? data.endpoint.join(' ') : String(data.endpoint);
          console.log('ℹ️ 400 con endpoint:', epMsg);
          console.log('✅ Tratado como éxito idempotente (fase catch global).');
          registrarPush._busy = false;
          return { success: true, message: 'Ya registrado (idempotente 400 global)' };
        } else if (data.detail) {
          errorMessage = data.detail;
        } else {
          errorMessage = 'Solicitud inválida al registrar push.';
        }
      } else {
        errorMessage = 'Datos de suscripción inválidos.';
      }
    } else if (error.response?.status === 401) {
      errorMessage = 'No autorizado. Inicia sesión nuevamente.';
    }
    console.debug('🧪 Detalle error push:', {
      name: error.name,
      message: error.message,
      status: error.response?.status,
      response: error.response?.data
    });
    
    return { success: false, message: errorMessage, raw: error.response?.data };
  }
  finally {
    registrarPush._busy = false;
  }
}

// Desactivar suscripción
export async function unSubscribeAll() {
  if (!isPushSupported()) return { success: false, message: 'No soportado' };
  
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      // Primero intentar desactivar en el backend
      try {
        await axiosInstance.post('/push-subscriptions/unregister/', { 
          endpoint: subscription.endpoint 
        });
      } catch (error) {
        console.warn('Error desactivando en backend:', error);
      }
      
      // Desuscribir del navegador
      await subscription.unsubscribe();
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error desuscribiendo:', error);
    return { success: false, message: error.message };
  }
}

// Obtener suscripciones del usuario
export async function getUserSubscriptions() {
  try {
    const response = await axiosInstance.get('/push-subscriptions/');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error obteniendo suscripciones:', error);
    return { success: false, message: error.response?.data?.detail || error.message };
  }
}

// Verificar validez de suscripción
export async function checkSubscriptionValidity() {
  if (!isPushSupported()) return false;
  
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      return false;
    }
    
    // Verificar en el backend si la suscripción sigue activa
    const response = await axiosInstance.get('/push-subscriptions/');
    let backendSubs = [];
    if (Array.isArray(response.data)) {
      backendSubs = response.data;
    } else if (response.data && Array.isArray(response.data.results)) {
      backendSubs = response.data.results;
    }
    const currentEndpoint = subscription.endpoint;
    const isValid = backendSubs.some(sub => sub.endpoint === currentEndpoint && sub.activo);
    
    return isValid;
  } catch (error) {
    console.error('Error verificando validez:', error);
    return false;
  }
}
