import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';

const PushNotificationDebug = () => {
  const [debugInfo, setDebugInfo] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  const checkSystemStatus = async () => {
    setIsLoading(true);
    addLog('🔍 Iniciando diagnóstico completo...');
    
    try {
      // 1. Verificar soporte del navegador
      const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
      addLog(`📱 Soporte del navegador: ${isSupported ? '✅' : '❌'}`);
      
      // 2. Verificar contexto seguro
      const isSecure = window.isSecureContext;
      addLog(`🔒 Contexto seguro (HTTPS): ${isSecure ? '✅' : '❌'}`);
      
      // 3. Verificar Service Worker
      let swStatus = '❌ No registrado';
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          swStatus = '✅ Registrado';
          addLog(`🔧 Service Worker: ${swStatus}`);
          addLog(`🔧 Scope: ${registration.scope}`);
        }
      }
      
      // 4. Verificar suscripción local
      let localSub = null;
      if (isSupported) {
        try {
          const registration = await navigator.serviceWorker.ready;
          localSub = await registration.pushManager.getSubscription();
          addLog(`📱 Suscripción local: ${localSub ? '✅ Existe' : '❌ No existe'}`);
          if (localSub) {
            addLog(`📱 Endpoint: ${localSub.endpoint.substring(0, 50)}...`);
          }
        } catch (error) {
          addLog(`❌ Error verificando suscripción local: ${error.message}`);
        }
      }
      
      // 5. Verificar clave VAPID del backend
      try {
        const vapidResponse = await axiosInstance.get('/push-subscriptions/vapid_public_key/');
        const vapidKey = vapidResponse.data.public_key;
        addLog(`🔑 Clave VAPID: ${vapidKey ? '✅ Recibida' : '❌ No disponible'}`);
        if (vapidKey) {
          addLog(`🔑 Longitud: ${vapidKey.length} caracteres`);
        }
      } catch (error) {
        addLog(`❌ Error obteniendo clave VAPID: ${error.message}`);
      }
      
      // 6. Verificar suscripciones en backend
      try {
        const subsResponse = await axiosInstance.get('/push-subscriptions/');
        const backendSubs = subsResponse.data.results || subsResponse.data || [];
        addLog(`📊 Suscripciones en backend: ${backendSubs.length}`);
        
        const activeSubs = backendSubs.filter(sub => sub.activo);
        addLog(`📊 Suscripciones activas: ${activeSubs.length}`);
        
        if (localSub && activeSubs.length > 0) {
          const matchingSub = activeSubs.find(sub => sub.endpoint === localSub.endpoint);
          addLog(`🎯 Coincidencia local-backend: ${matchingSub ? '✅' : '❌'}`);
        }
      } catch (error) {
        addLog(`❌ Error verificando backend: ${error.message}`);
      }
      
      // 7. Verificar permisos
      if ('Notification' in window) {
        const permission = Notification.permission;
        addLog(`🔔 Permisos de notificación: ${permission}`);
      }
      
      setDebugInfo({
        isSupported,
        isSecure,
        swStatus,
        localSub: localSub ? 'exists' : 'none',
        vapidKey: 'checked',
        backendSubs: 'checked'
      });
      
    } catch (error) {
      addLog(`❌ Error en diagnóstico: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermission = async () => {
    try {
      addLog('🔔 Solicitando permisos...');
      const permission = await Notification.requestPermission();
      addLog(`🔔 Permiso concedido: ${permission}`);
      return permission === 'granted';
    } catch (error) {
      addLog(`❌ Error solicitando permisos: ${error.message}`);
      return false;
    }
  };

  const subscribeToPush = async () => {
    try {
      addLog('📱 Iniciando suscripción...');
      
      // 1. Obtener clave VAPID
      const vapidResponse = await axiosInstance.get('/push-subscriptions/vapid_public_key/');
      const vapidKey = vapidResponse.data.public_key;
      
      if (!vapidKey) {
        addLog('❌ No se pudo obtener clave VAPID');
        return;
      }
      
      addLog('🔑 Clave VAPID obtenida');
      
      // 2. Convertir clave VAPID
      const vapidKeyBytes = Uint8Array.from(atob(vapidKey), c => c.charCodeAt(0));
      addLog('🔑 Clave VAPID convertida');
      
      // 3. Obtener Service Worker
      const registration = await navigator.serviceWorker.ready;
      addLog('🔧 Service Worker listo');
      
      // 4. Crear suscripción
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKeyBytes
      });
      
      addLog('📱 Suscripción creada localmente');
      addLog(`📱 Endpoint: ${subscription.endpoint.substring(0, 50)}...`);
      
      // 5. Enviar al backend
      const subData = {
        endpoint: subscription.endpoint,
        p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')))),
        auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')))),
        user_agent: navigator.userAgent
      };
      
      try {
        const response = await axiosInstance.post('/push-subscriptions/', subData);
        addLog('✅ Suscripción registrada en backend');
        addLog(`✅ ID: ${response.data.id}`);
      } catch (error) {
        if (error.response?.status === 400) {
          addLog('⚠️ Suscripción ya existe, intentando activar...');
          try {
            const activateResponse = await axiosInstance.post('/push-subscriptions/activate_by_endpoint/', {
              endpoint: subscription.endpoint
            });
            addLog('✅ Suscripción existente activada');
          } catch (activateError) {
            addLog('✅ Tratado como éxito (idempotente)');
          }
        } else {
          addLog(`❌ Error registrando suscripción: ${error.message}`);
        }
      }
      
    } catch (error) {
      addLog(`❌ Error en suscripción: ${error.message}`);
    }
  };

  const sendTestNotification = async () => {
    try {
      addLog('🧪 Enviando notificación de prueba...');
      const response = await axiosInstance.post('/push-subscriptions/send_test_notification/');
      addLog('✅ Notificación de prueba enviada');
      addLog(`📱 Respuesta: ${JSON.stringify(response.data)}`);
    } catch (error) {
      addLog(`❌ Error enviando notificación: ${error.message}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  useEffect(() => {
    checkSystemStatus();
  }, []);

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">🔧 Diagnóstico de Push Notifications</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">📊 Estado del Sistema</h3>
          <div className="space-y-1 text-sm">
            <p>Soporte: {debugInfo.isSupported ? '✅' : '❌'}</p>
            <p>HTTPS: {debugInfo.isSecure ? '✅' : '❌'}</p>
            <p>Service Worker: {debugInfo.swStatus}</p>
            <p>Suscripción Local: {debugInfo.localSub === 'exists' ? '✅' : '❌'}</p>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">🎯 Acciones</h3>
          <div className="space-y-2">
            <button
              onClick={checkSystemStatus}
              disabled={isLoading}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {isLoading ? 'Verificando...' : 'Verificar Sistema'}
            </button>
            
            <button
              onClick={requestPermission}
              className="w-full bg-green-500 text-white px-4 py-2 rounded"
            >
              Solicitar Permisos
            </button>
            
            <button
              onClick={subscribeToPush}
              className="w-full bg-purple-500 text-white px-4 py-2 rounded"
            >
              Suscribirse a Push
            </button>
            
            <button
              onClick={sendTestNotification}
              className="w-full bg-orange-500 text-white px-4 py-2 rounded"
            >
              Probar Notificación
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">📝 Logs del Sistema</h3>
          <button
            onClick={clearLogs}
            className="bg-red-500 text-white px-2 py-1 rounded text-xs"
          >
            Limpiar
          </button>
        </div>
        {logs.map((log, index) => (
          <div key={index} className="mb-1">{log}</div>
        ))}
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        <p><strong>Instrucciones:</strong></p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Verifica que el sistema esté funcionando</li>
          <li>Solicita permisos de notificación</li>
          <li>Suscríbete a push notifications</li>
          <li>Prueba enviando una notificación</li>
          <li>Si todo está verde, las notificaciones deberían funcionar</li>
        </ol>
      </div>
    </div>
  );
};

export default PushNotificationDebug;
