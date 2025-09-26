import React from 'react';
import { usePushNotificationsV2 } from '../hooks/usePushNotificationsV2';

const PushNotificationStatus = () => {
  const {
    isSupported,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    sendTestNotification,
    refreshStatus,
    clearError,
    debugInfo
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

  if (!isSupported) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        <p>⚠️ Tu navegador no soporta notificaciones push o no estás en un contexto seguro (HTTPS).</p>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            🔔 Notificaciones Push
          </h3>
          <p className="text-sm text-gray-600">
            Recibe notificaciones de comunicados importantes
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Estado visual */}
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              isSubscribed ? 'bg-green-500' : 'bg-gray-300'
            }`}></div>
            <span className={`text-sm font-medium ${
              isSubscribed ? 'text-green-700' : 'text-gray-500'
            }`}>
              {isSubscribed ? 'Activadas' : 'Desactivadas'}
            </span>
          </div>
          
          {/* Botón de toggle */}
          <button
            onClick={handleToggle}
            disabled={isLoading}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              isSubscribed
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? '⏳ Procesando...' : 
             isSubscribed ? '🔕 Desactivar' : '🔔 Activar'}
          </button>
        </div>
      </div>

      {/* Error message */}
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

      {/* Botones de acción */}
      <div className="flex space-x-2">
        <button
          onClick={handleTest}
          disabled={isLoading || !isSubscribed}
          className="px-3 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          🧪 Probar
        </button>
        
        <button
          onClick={refreshStatus}
          disabled={isLoading}
          className="px-3 py-2 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          🔄 Refrescar
        </button>
      </div>

      {/* Debug info (solo en desarrollo) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-gray-100 rounded-md text-xs">
          <p className="font-medium text-gray-700 mb-2">Debug Info:</p>
          <pre className="text-gray-600 overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default PushNotificationStatus;
