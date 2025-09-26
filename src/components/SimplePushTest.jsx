import React from 'react';
import { usePushNotificationsV2 } from '../hooks/usePushNotificationsV2';

const SimplePushTest = () => {
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

  const handleToggle = async () => {
    console.log('🔄 Cambiando estado de suscripción...');
    
    if (isSubscribed) {
      const result = await unsubscribe();
      console.log('📤 Resultado desuscripción:', result);
    } else {
      const result = await subscribe();
      console.log('📤 Resultado suscripción:', result);
    }
    
    // Refrescar estado después de la operación
    setTimeout(() => {
      refreshStatus();
    }, 1000);
  };

  const handleTest = async () => {
    console.log('🧪 Enviando notificación de prueba...');
    const result = await sendTestNotification();
    console.log('📤 Resultado prueba:', result);
  };

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">
        🔔 Prueba Simple de Push Notifications
      </h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Estado */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">📊 Estado</h3>
          <div className="space-y-1 text-sm">
            <p>Soporte: {isSupported ? '✅' : '❌'}</p>
            <p>HTTPS: {window.isSecureContext ? '✅' : '❌'}</p>
            <p>VAPID: {vapidKey ? '✅' : '❌'}</p>
            <p>Suscripción: {isSubscribed ? '✅' : '❌'}</p>
          </div>
        </div>
        
        {/* Controles */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">🎯 Controles</h3>
          <div className="space-y-2">
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
               isSubscribed ? '🔕 Desactivar' : '🔔 Activar'}
            </button>
            
            <button
              onClick={handleTest}
              disabled={isLoading || !isSubscribed}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🧪 Probar
            </button>
            
            <button
              onClick={refreshStatus}
              disabled={isLoading}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🔄 Refrescar
            </button>
          </div>
        </div>
      </div>

      {/* Debug Info */}
      <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm">
        <h3 className="font-semibold mb-2">📝 Debug Info:</h3>
        <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
      </div>

      {/* Instrucciones */}
      <div className="mt-4 text-xs text-gray-500">
        <p><strong>Instrucciones:</strong></p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Verifica que todo esté en verde</li>
          <li>Activa las notificaciones</li>
          <li>Prueba enviando una notificación</li>
          <li>Revisa la consola para logs detallados</li>
        </ol>
      </div>
    </div>
  );
};

export default SimplePushTest;
