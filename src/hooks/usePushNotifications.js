import { useState, useEffect, useCallback } from 'react';
import { registrarPush, unSubscribeAll, checkSubscriptionStatus, isPushSupported } from '../utils/push';
import axiosInstance from '../api/axiosConfig';

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [vapidKey, setVapidKey] = useState(null);

  // Obtener clave VAPID del backend
  const fetchVapidKey = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/vapid-public-key/');
      setVapidKey(response.data.public_key);
      return response.data.public_key;
    } catch (err) {
      console.error('Error obteniendo clave VAPID:', err);
      setError('No se pudo obtener la clave VAPID del servidor');
      return null;
    }
  }, []);

  // Verificar soporte y estado inicial
  useEffect(() => {
    const checkSupport = () => {
      const supported = isPushSupported();
      setIsSupported(supported);
      
      if (supported) {
        checkSubscriptionStatus().then(setIsSubscribed);
        fetchVapidKey();
      }
    };

    checkSupport();
  }, [fetchVapidKey]);

  // Suscribirse a push notifications
  const subscribe = useCallback(async () => {
    if (!isSupported || !vapidKey) {
      setError('Push notifications no soportadas o clave VAPID no disponible');
      return { success: false, message: 'No soportado' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await registrarPush(vapidKey);
      
      if (result.success) {
        setIsSubscribed(true);
        console.log('✅ Push notifications activadas');
      } else {
        setError(result.message);
      }
      
      return result;
    } catch (err) {
      const errorMsg = err.message || 'Error desconocido al suscribirse';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, vapidKey]);

  // Desuscribirse de push notifications
  const unsubscribe = useCallback(async () => {
    if (!isSupported) {
      return { success: false, message: 'No soportado' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await unSubscribeAll();
      
      if (result.success) {
        setIsSubscribed(false);
        console.log('✅ Push notifications desactivadas');
      } else {
        setError(result.message);
      }
      
      return result;
    } catch (err) {
      const errorMsg = err.message || 'Error desconocido al desuscribirse';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // Enviar notificación de prueba
  const sendTestNotification = useCallback(async () => {
    if (!isSubscribed) {
      setError('No estás suscrito a push notifications');
      return { success: false, message: 'No suscrito' };
    }

    try {
      const response = await axiosInstance.post('/push-subscriptions/send_test_notification/');
      return { success: true, data: response.data };
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Error enviando notificación de prueba';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    }
  }, [isSubscribed]);

  // Refrescar estado de suscripción
  const refreshStatus = useCallback(async () => {
    if (!isSupported) return;
    
    try {
      const status = await checkSubscriptionStatus();
      setIsSubscribed(status);
    } catch (err) {
      console.error('Error verificando estado de suscripción:', err);
    }
  }, [isSupported]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    error,
    vapidKey,
    subscribe,
    unsubscribe,
    sendTestNotification,
    refreshStatus,
    clearError: () => setError(null)
  };
};

export default usePushNotifications;
