import React, { useState, useEffect } from 'react';
import { usePushNotificationContext } from '../../context/PushNotificationContext';
import Button from '../common/Button';

const PushNotificationDebug = () => {
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
    refreshStatus
  } = usePushNotificationContext();

  const [logs, setLogs] = useState([]);
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState(null);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
  };

  useEffect(() => {
    // Verificar estado del Service Worker
    const checkServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            setServiceWorkerStatus({
              registered: true,
              scope: registration.scope,
              state: registration.active?.state,
              scriptURL: registration.active?.scriptURL
            });
            addLog('Service Worker registrado correctamente', 'success');
          } else {
            setServiceWorkerStatus({ registered: false });
            addLog('Service Worker no registrado', 'warning');
          }
        } catch (error) {
          addLog(`Error verificando Service Worker: ${error.message}`, 'error');
        }
      } else {
        addLog('Service Worker no soportado', 'error');
      }
    };

    checkServiceWorker();
  }, []);

  useEffect(() => {
    // Escuchar notificaciones push para debug
    const handlePushNotification = (event) => {
      addLog(`Notificación push recibida: ${JSON.stringify(event.detail)}`, 'info');
    };

    const handleComunicadoReceived = (event) => {
      addLog(`Comunicado recibido: ${JSON.stringify(event.detail)}`, 'info');
    };

    window.addEventListener('pushNotificationReceived', handlePushNotification);
    window.addEventListener('comunicadoReceived', handleComunicadoReceived);

    return () => {
      window.removeEventListener('pushNotificationReceived', handlePushNotification);
      window.removeEventListener('comunicadoReceived', handleComunicadoReceived);
    };
  }, []);

  const handleSubscribe = async () => {
    addLog('Iniciando suscripción...', 'info');
    const result = await subscribe();
    if (result.success) {
      addLog(`Suscripción exitosa: ${result.message}`, 'success');
    } else {
      addLog(`Error en suscripción: ${result.message}`, 'error');
    }
  };

  const handleUnsubscribe = async () => {
    addLog('Iniciando desuscripción...', 'info');
    const result = await unsubscribe();
    if (result.success) {
      addLog('Desuscripción exitosa', 'success');
    } else {
      addLog(`Error en desuscripción: ${result.message}`, 'error');
    }
  };

  const handleTestNotification = async () => {
    addLog('Enviando notificación de prueba...', 'info');
    const result = await sendTestNotification();
    if (result.success) {
      addLog('Notificación de prueba enviada', 'success');
    } else {
      addLog(`Error en notificación de prueba: ${result.message}`, 'error');
    }
  };

  const handleRefreshStatus = async () => {
    addLog('Refrescando estado...', 'info');
    await refreshStatus();
    addLog('Estado refrescado', 'success');
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="space-y-6 p-6 bg-gray-900 rounded-lg">
      <h2 className="text-2xl font-bold text-white">Debug de Notificaciones Push</h2>
      
      {/* Estado del sistema */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-2">Estado del Sistema</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">Soporte:</span>
              <span className={isSupported ? 'text-green-400' : 'text-red-400'}>
                {isSupported ? 'Sí' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Suscripción:</span>
              <span className={isSubscribed ? 'text-green-400' : 'text-red-400'}>
                {isSubscribed ? 'Activa' : 'Inactiva'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Cargando:</span>
              <span className={isLoading ? 'text-yellow-400' : 'text-gray-400'}>
                {isLoading ? 'Sí' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Clave VAPID:</span>
              <span className={vapidKey ? 'text-green-400' : 'text-red-400'}>
                {vapidKey ? 'Presente' : 'Ausente'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-2">Service Worker</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">Registrado:</span>
              <span className={serviceWorkerStatus?.registered ? 'text-green-400' : 'text-red-400'}>
                {serviceWorkerStatus?.registered ? 'Sí' : 'No'}
              </span>
            </div>
            {serviceWorkerStatus?.registered && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-300">Estado:</span>
                  <span className="text-blue-400">{serviceWorkerStatus.state}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Scope:</span>
                  <span className="text-blue-400 text-xs">{serviceWorkerStatus.scope}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Información de debug */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-2">Información de Debug</h3>
        <pre className="text-xs text-gray-300 bg-gray-900 p-3 rounded overflow-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>

      {/* Controles */}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={handleSubscribe}
          disabled={isLoading || isSubscribed}
          variant="primary"
          size="sm"
        >
          Suscribirse
        </Button>
        <Button
          onClick={handleUnsubscribe}
          disabled={isLoading || !isSubscribed}
          variant="secondary"
          size="sm"
        >
          Desuscribirse
        </Button>
        <Button
          onClick={handleTestNotification}
          disabled={isLoading}
          variant="primary"
          size="sm"
        >
          Probar Notificación
        </Button>
        <Button
          onClick={handleRefreshStatus}
          disabled={isLoading}
          variant="secondary"
          size="sm"
        >
          Refrescar Estado
        </Button>
        <Button
          onClick={clearLogs}
          variant="secondary"
          size="sm"
        >
          Limpiar Logs
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-4">
          <h4 className="text-red-400 font-semibold mb-2">Error:</h4>
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Logs */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-2">Logs</h3>
        <div className="max-h-64 overflow-y-auto space-y-1">
          {logs.length === 0 ? (
            <p className="text-gray-400 text-sm">No hay logs</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="text-xs font-mono">
                <span className="text-gray-500">[{log.timestamp}]</span>
                <span className={`ml-2 ${
                  log.type === 'error' ? 'text-red-400' :
                  log.type === 'success' ? 'text-green-400' :
                  log.type === 'warning' ? 'text-yellow-400' :
                  'text-gray-300'
                }`}>
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PushNotificationDebug;
