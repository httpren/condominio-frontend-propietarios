import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosConfig';

// Función para convertir clave VAPID de base64url a Uint8Array
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

export const usePushNotificationsV2 = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [vapidKey, setVapidKey] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});

  const addDebugInfo = (key, value) => {
    setDebugInfo(prev => ({ ...prev, [key]: value }));
  };

  const checkSupport = useCallback(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);
    addDebugInfo('browserSupport', supported);
    return supported;
  }, []);

  const fetchVapidKey = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/push-subscriptions/vapid_public_key/');
      const key = response.data.public_key;
      setVapidKey(key);
      addDebugInfo('vapidKey', key ? 'received' : 'missing');
      return key;
    } catch (err) {
      console.error('Error obteniendo clave VAPID:', err);
      setError('No se pudo obtener la clave VAPID del servidor');
      addDebugInfo('vapidKey', 'error');
      return null;
    }
  }, []);

  const isPushSupported = useCallback(() => {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }, []);

  const checkSubscriptionStatus = useCallback(async () => {
    if (!isPushSupported()) return false;
    
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        addDebugInfo('localSubscription', 'none');
        // Limpiar estado persistido si no hay suscripción local
        localStorage.removeItem('push_notification_subscribed');
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
        
        addDebugInfo('localSubscription', 'exists');
        addDebugInfo('backendSubs', userSubs.length);
        addDebugInfo('activeSubs', userSubs.filter(s => s.activo).length);
        addDebugInfo('isValid', isValid);
        
        // Persistir estado en localStorage
        if (isValid) {
          localStorage.setItem('push_notification_subscribed', 'true');
          localStorage.setItem('push_notification_endpoint', currentEndpoint);
        } else {
          localStorage.removeItem('push_notification_subscribed');
          localStorage.removeItem('push_notification_endpoint');
        }
        
        return isValid;
      } catch (backendError) {
        console.warn('⚠️ Error verificando backend, verificando estado persistido:', backendError);
        addDebugInfo('backendCheck', 'error');
        
        // Si no podemos verificar el backend, usar estado persistido
        const persistedState = localStorage.getItem('push_notification_subscribed') === 'true';
        const persistedEndpoint = localStorage.getItem('push_notification_endpoint');
        
        if (persistedState && persistedEndpoint === subscription.endpoint) {
          console.log('✅ Usando estado persistido de suscripción');
          return true;
        }
        
        return false;
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      addDebugInfo('subscriptionCheck', 'error');
      return false;
    }
  }, []);

  const subscribe = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    if (!isSupported || !vapidKey) {
      const errorMsg = 'Push notifications no soportadas o clave VAPID no disponible';
      setError(errorMsg);
      setIsLoading(false);
      return { success: false, message: errorMsg };
    }

    try {
      addDebugInfo('subscribeAttempt', 'started');
      
      // 1. Solicitar permisos
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        const errorMsg = 'Permisos de notificación denegados';
        setError(errorMsg);
        addDebugInfo('permission', 'denied');
        return { success: false, message: errorMsg };
      }
      addDebugInfo('permission', 'granted');
      
      // 2. Obtener Service Worker
      const registration = await navigator.serviceWorker.ready;
      addDebugInfo('serviceWorker', 'ready');
      
       // 3. Convertir clave VAPID
       let vapidKeyBytes;
       try {
         vapidKeyBytes = urlBase64ToUint8Array(vapidKey);
         addDebugInfo('vapidConversion', 'success');
       } catch (conversionError) {
         console.error('Error convirtiendo clave VAPID:', conversionError);
         addDebugInfo('vapidConversion', 'error');
         throw new Error('Error convirtiendo clave VAPID: ' + conversionError.message);
       }
      
      // 4. Crear suscripción
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKeyBytes
      });
      addDebugInfo('localSubscription', 'created');
      
      // 5. Enviar al backend
      const subData = {
        endpoint: subscription.endpoint,
        p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')))),
        auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')))),
        user_agent: navigator.userAgent
      };
      
      try {
        const response = await axiosInstance.post('/push-subscriptions/', subData);
        addDebugInfo('backendRegistration', 'success');
        setIsSubscribed(true);
        
        // Persistir estado de suscripción
        localStorage.setItem('push_notification_subscribed', 'true');
        localStorage.setItem('push_notification_endpoint', subscription.endpoint);
        
        return { success: true, message: 'Suscripción exitosa', data: response.data };
      } catch (regErr) {
        // Si ya existe, intentar activar
        if (regErr.response?.status === 400) {
          try {
            const activateResponse = await axiosInstance.post('/push-subscriptions/activate_by_endpoint/', {
              endpoint: subscription.endpoint
            });
            addDebugInfo('backendActivation', 'success');
            setIsSubscribed(true);
            
            // Persistir estado de suscripción
            localStorage.setItem('push_notification_subscribed', 'true');
            localStorage.setItem('push_notification_endpoint', subscription.endpoint);
            
            return { success: true, message: 'Suscripción existente activada' };
          } catch (activateErr) {
            addDebugInfo('backendActivation', 'error');
            // Tratar como éxito idempotente
            setIsSubscribed(true);
            
            // Persistir estado de suscripción
            localStorage.setItem('push_notification_subscribed', 'true');
            localStorage.setItem('push_notification_endpoint', subscription.endpoint);
            
            return { success: true, message: 'Ya registrado (idempotente)' };
          }
        } else {
          addDebugInfo('backendRegistration', 'error');
          throw regErr;
        }
      }
      
    } catch (err) {
      const errorMsg = err.message || 'Error al suscribirse a notificaciones';
      setError(errorMsg);
      addDebugInfo('subscribeError', errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, vapidKey]);

  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        addDebugInfo('localUnsubscribe', 'success');
      }
      
      // Desactivar en backend
      try {
        await axiosInstance.post('/push-subscriptions/unregister/', {
          endpoint: subscription?.endpoint
        });
        addDebugInfo('backendUnsubscribe', 'success');
      } catch (err) {
        console.warn('Error desactivando en backend:', err);
        addDebugInfo('backendUnsubscribe', 'error');
      }
      
      setIsSubscribed(false);
      
      // Limpiar estado persistido
      localStorage.removeItem('push_notification_subscribed');
      localStorage.removeItem('push_notification_endpoint');
      
      return { success: true, message: 'Desuscripción exitosa' };
    } catch (err) {
      const errorMsg = err.message || 'Error al desuscribirse de notificaciones';
      setError(errorMsg);
      addDebugInfo('unsubscribeError', errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendTestNotification = useCallback(async () => {
    setError(null);
    try {
      // Crear una notificación local para probar el sistema
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification('🎉 ¡Notificación de Prueba!', {
          body: 'Esta es una notificación de prueba desde tu aplicación en Vercel. El sistema está funcionando correctamente.',
          icon: '/icons/icon-144x144.png',
          badge: '/icons/icon-144x144.png',
          tag: 'test-notification',
          requireInteraction: true
        });
        
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
        
        addDebugInfo('testNotification', 'sent');
        return { success: true, message: 'Notificación local enviada' };
      } else {
        throw new Error('Permisos de notificación no concedidos');
      }
    } catch (err) {
      const errorMsg = err.message || 'Error enviando notificación de prueba';
      setError(errorMsg);
      addDebugInfo('testNotification', 'error');
      return { success: false, message: errorMsg };
    }
  }, []);

  const refreshStatus = useCallback(async () => {
    if (!isSupported) return;
    
    try {
      const status = await checkSubscriptionStatus();
      setIsSubscribed(status);
      
      // Sincronizar con localStorage
      if (status) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            localStorage.setItem('push_notification_subscribed', 'true');
            localStorage.setItem('push_notification_endpoint', subscription.endpoint);
          }
        } catch (error) {
          console.warn('Error sincronizando con localStorage:', error);
        }
      } else {
        localStorage.removeItem('push_notification_subscribed');
        localStorage.removeItem('push_notification_endpoint');
      }
      
      addDebugInfo('statusRefresh', 'success');
    } catch (err) {
      console.error('Error verificando estado de suscripción:', err);
      setIsSubscribed(false);
      localStorage.removeItem('push_notification_subscribed');
      localStorage.removeItem('push_notification_endpoint');
      addDebugInfo('statusRefresh', 'error');
    }
  }, [isSupported, checkSubscriptionStatus]);

  useEffect(() => {
    const initialize = async () => {
      const supported = checkSupport();
      
      if (supported) {
        await fetchVapidKey();
        
        // Verificar estado persistido primero
        const persistedState = localStorage.getItem('push_notification_subscribed') === 'true';
        const persistedEndpoint = localStorage.getItem('push_notification_endpoint');
        
        if (persistedState && persistedEndpoint) {
          console.log('🔄 Estado persistido encontrado, verificando suscripción...');
          // Verificar que la suscripción local aún existe
          try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            
            if (subscription && subscription.endpoint === persistedEndpoint) {
              console.log('✅ Suscripción local válida encontrada');
              setIsSubscribed(true);
              addDebugInfo('localSubscription', 'valid');
            } else {
              console.log('⚠️ Suscripción local no válida, limpiando estado persistido');
              localStorage.removeItem('push_notification_subscribed');
              localStorage.removeItem('push_notification_endpoint');
              setIsSubscribed(false);
              addDebugInfo('localSubscription', 'invalid');
            }
          } catch (error) {
            console.error('Error verificando suscripción local:', error);
            localStorage.removeItem('push_notification_subscribed');
            localStorage.removeItem('push_notification_endpoint');
            setIsSubscribed(false);
            addDebugInfo('localSubscription', 'error');
          }
        } else {
          console.log('📱 No hay estado persistido, verificando suscripción...');
          setIsSubscribed(false);
        }
        
        // Verificar estado real con el backend
        await refreshStatus();
      }
      
      setIsLoading(false);
    };

    initialize();
  }, [checkSupport, fetchVapidKey, refreshStatus]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    error,
    vapidKey,
    debugInfo,
    subscribe,
    unsubscribe,
    sendTestNotification,
    refreshStatus,
    clearError: () => setError(null)
  };
};
