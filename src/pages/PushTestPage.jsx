import React from 'react';
import { usePushNotificationContext } from '../context/PushNotificationContext';

const PushTestPage = () => {
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
  } = usePushNotificationContext();

  const handleToggle = async () => {
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
    const result = await sendTestNotification();
    console.log('📤 Resultado prueba:', result);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-center mb-6">
            🔔 Prueba de Push Notifications
          </h1>
          
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Estado del Sistema */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">📊 Estado del Sistema</h2>
              <div className="space-y-2">
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
              </div>
            </div>

            {/* Controles */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">🎯 Controles</h2>
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
              </div>
            </div>
          </div>

          {/* Información de Debug */}
          <div className="mt-6 bg-gray-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">🔧 Información de Debug</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <strong>Origen:</strong><br />
                <code className="bg-gray-200 px-2 py-1 rounded">{window.location.origin}</code>
              </div>
              <div>
                <strong>User Agent:</strong><br />
                <code className="bg-gray-200 px-2 py-1 rounded text-xs">
                  {navigator.userAgent.substring(0, 50)}...
                </code>
              </div>
              <div>
                <strong>Clave VAPID:</strong><br />
                <code className="bg-gray-200 px-2 py-1 rounded text-xs">
                  {vapidKey ? vapidKey.substring(0, 20) + '...' : 'No disponible'}
                </code>
              </div>
              <div>
                <strong>Estado:</strong><br />
                <code className="bg-gray-200 px-2 py-1 rounded">
                  {isSubscribed ? 'Suscrito' : 'No suscrito'}
                </code>
              </div>
            </div>
          </div>

          {/* Debug Info */}
          <div className="mt-6 bg-black text-green-400 p-4 rounded-lg font-mono text-sm">
            <h3 className="font-semibold mb-2">📝 Debug Info:</h3>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>

          {/* Instrucciones */}
          <div className="mt-6 bg-blue-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">📋 Instrucciones</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li><strong>Verifica el estado:</strong> Asegúrate de que todos los elementos estén en verde</li>
              <li><strong>Activa las notificaciones:</strong> Haz clic en "Activar Notificaciones"</li>
              <li><strong>Prueba el sistema:</strong> Haz clic en "Probar Notificación"</li>
              <li><strong>Verifica la recepción:</strong> Deberías ver una notificación en tu navegador</li>
              <li><strong>Si no funciona:</strong> Revisa la consola del navegador para más detalles</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PushTestPage;
