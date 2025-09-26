import React, { useState, useEffect } from 'react';
import { usePushNotificationsV2 } from '../hooks/usePushNotificationsV2';
import { checkServiceWorkerStatus } from '../utils/serviceWorker';

const PushDiagnostic = () => {
  const {
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
    clearError
  } = usePushNotificationsV2();

  const [swStatus, setSwStatus] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  const checkServiceWorker = async () => {
    try {
      const status = await checkServiceWorkerStatus();
      setSwStatus(status);
      addLog(`Service Worker: ${status ? '✅ Registrado' : '❌ No registrado'}`);
    } catch (error) {
      addLog(`❌ Error verificando Service Worker: ${error.message}`);
    }
  };

  const handleToggle = async () => {
    addLog(`🔄 Cambiando estado de suscripción...`);
    
    if (isSubscribed) {
      const result = await unsubscribe();
      addLog(`📤 Resultado desuscripción: ${JSON.stringify(result)}`);
    } else {
      const result = await subscribe();
      addLog(`📤 Resultado suscripción: ${JSON.stringify(result)}`);
    }
    
    // Refrescar estado después de la operación
    setTimeout(() => {
      refreshStatus();
    }, 1000);
  };

  const handleTest = async () => {
    addLog(`🧪 Enviando notificación de prueba...`);
    const result = await sendTestNotification();
    addLog(`📤 Resultado prueba: ${JSON.stringify(result)}`);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  useEffect(() => {
    checkServiceWorker();
  }, []);

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">
        🔧 Diagnóstico Completo de Push Notifications
      </h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
          <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={clearError}>
            <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <title>Close</title>
              <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
            </svg>
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estado del Sistema */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">📊 Estado del Sistema</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Soporte del navegador:</span>
              <span className={isSupported ? 'text-green-600' : 'text-red-600'}>
                {isSupported ? '✅ Soportado' : '❌ No soportado'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Contexto seguro (HTTPS):</span>
              <span className={window.isSecureContext ? 'text-green-600' : 'text-red-600'}>
                {window.isSecureContext ? '✅ Seguro' : '❌ No seguro'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Service Worker:</span>
              <span className={swStatus ? 'text-green-600' : 'text-red-600'}>
                {swStatus ? '✅ Registrado' : '❌ No registrado'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Clave VAPID:</span>
              <span className={vapidKey ? 'text-green-600' : 'text-red-600'}>
                {vapidKey ? '✅ Disponible' : '❌ No disponible'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Suscripción:</span>
              <span className={isSubscribed ? 'text-green-600' : 'text-red-600'}>
                {isSubscribed ? '✅ Activa' : '❌ Inactiva'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Origen:</span>
              <span className="text-gray-600">{window.location.origin}</span>
            </div>
          </div>
        </div>

        {/* Controles */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">🎯 Controles</h3>
          <div className="space-y-3">
            <button
              onClick={handleToggle}
              disabled={isLoading || !isSupported}
              className={`w-full py-2 px-4 rounded font-medium ${
                isSubscribed
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading ? '⏳ Procesando...' : 
               isSubscribed ? '🔕 Desactivar Notificaciones' : '🔔 Activar Notificaciones'}
            </button>
            
            <button
              onClick={handleTest}
              disabled={isLoading || !isSubscribed}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🧪 Probar Notificación
            </button>
            
            <button
              onClick={refreshStatus}
              disabled={isLoading}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🔄 Refrescar Estado
            </button>
            
            <button
              onClick={checkServiceWorker}
              disabled={isLoading}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🔧 Verificar Service Worker
            </button>
          </div>
        </div>
      </div>

      {/* Logs del Sistema */}
      <div className="mt-6 bg-black text-green-400 p-4 rounded-lg font-mono text-sm">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">📝 Logs del Sistema</h3>
          <button
            onClick={clearLogs}
            className="bg-red-500 text-white px-2 py-1 rounded text-xs"
          >
            Limpiar
          </button>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className="mb-1">{log}</div>
          ))}
        </div>
      </div>

      {/* Debug Info */}
      <div className="mt-6 bg-gray-100 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">🔧 Debug Info</h3>
        <pre className="text-xs overflow-auto max-h-64">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>

      {/* Instrucciones */}
      <div className="mt-6 bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-blue-900">📋 Instrucciones de Diagnóstico</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
          <li>Verifica que todos los elementos del estado estén en verde</li>
          <li>Si el Service Worker no está registrado, haz clic en "Verificar Service Worker"</li>
          <li>Activa las notificaciones si no están activas</li>
          <li>Prueba enviando una notificación</li>
          <li>Revisa los logs para ver si hay errores</li>
          <li>Si las notificaciones no llegan, verifica la consola del navegador</li>
        </ol>
      </div>
    </div>
  );
};

export default PushDiagnostic;
