import React from 'react';
import { usePushNotificationContext } from '../context/PushNotificationContext';

const PushNotificationSettings = () => {
  const {
    isSupported,
    isSubscribed,
    isLoading,
    error,
    vapidKey,
    subscribe,
    unsubscribe,
    sendTestNotification,
    refreshStatus,
    clearError
  } = usePushNotificationContext();

  const handleToggle = async () => {
    console.log('🔄 Cambiando estado de suscripción:', { isSubscribed, isLoading });
    
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

  // Refrescar estado al montar el componente
  React.useEffect(() => {
    if (isSupported && !isLoading) {
      console.log('🔄 Refrescando estado de notificaciones al montar componente...');
      refreshStatus();
    }
  }, [isSupported, isLoading, refreshStatus]);

  const handleTest = async () => {
    await sendTestNotification();
  };

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Push Notifications No Soportadas
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>Tu navegador no soporta push notifications o no estás en un contexto seguro (HTTPS).</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Notificaciones Push
        </h3>
        <div className="flex items-center">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isSubscribed 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {isSubscribed ? 'Activadas' : 'Desactivadas'}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-2">
                <button
                  onClick={clearError}
                  className="text-sm font-medium text-red-800 hover:text-red-600"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-4">
            Recibe notificaciones instantáneas sobre nuevos comunicados y actualizaciones importantes.
          </p>
          
          {vapidKey && (
            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <p className="text-xs text-gray-500 mb-1">Clave VAPID:</p>
              <code className="text-xs text-gray-700 break-all">
                {vapidKey.substring(0, 20)}...
              </code>
            </div>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleToggle}
            disabled={isLoading}
            className={`flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
              isSubscribed
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Procesando...
              </>
            ) : (
              <>
                {isSubscribed ? 'Desactivar' : 'Activar'} Notificaciones
              </>
            )}
          </button>

          {isSubscribed && (
            <button
              onClick={handleTest}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Probar
            </button>
          )}
        </div>

        <div className="text-xs text-gray-500">
          <p>• Las notificaciones requieren permisos del navegador</p>
          <p>• Funciona mejor en dispositivos móviles</p>
          <p>• Se requiere conexión HTTPS para funcionar</p>
        </div>

        {/* Debug info */}
        <div className="mt-4 p-3 bg-gray-100 rounded-md text-xs">
          <p className="font-medium text-gray-700 mb-2">Debug Info:</p>
          <div className="space-y-1 text-gray-600">
            <p>• Soportado: {isSupported ? '✅' : '❌'}</p>
            <p>• Suscrito: {isSubscribed ? '✅' : '❌'}</p>
            <p>• Cargando: {isLoading ? '⏳' : '✅'}</p>
            <p>• Clave VAPID: {vapidKey ? '✅' : '❌'}</p>
            <p>• Origen: {window.location.origin}</p>
            <p>• Contexto seguro: {window.isSecureContext ? '✅' : '❌'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PushNotificationSettings;
