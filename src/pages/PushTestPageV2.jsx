import React, { useState, useEffect } from 'react';
import PushNotificationStatus from '../components/PushNotificationStatus';
import { usePushNotificationsV2 } from '../hooks/usePushNotificationsV2';

const PushTestPageV2 = () => {
  const { isSubscribed, debugInfo } = usePushNotificationsV2();
  const [notifications, setNotifications] = useState([]);

  // Simular notificaciones recibidas
  useEffect(() => {
    const handleNotification = (event) => {
      console.log('📱 Notificación recibida:', event);
      setNotifications(prev => [{
        id: Date.now(),
        title: event.detail?.title || 'Nueva notificación',
        message: event.detail?.message || 'Mensaje de notificación',
        timestamp: new Date().toLocaleTimeString()
      }, ...prev]);
    };

    // Escuchar eventos de notificaciones
    window.addEventListener('push-notification', handleNotification);
    
    return () => {
      window.removeEventListener('push-notification', handleNotification);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-2">
            🔔 Prueba de Push Notifications
          </h1>
          <p className="text-center text-gray-600">
            Sistema de notificaciones push para comunicados importantes
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel de configuración */}
          <div>
            <PushNotificationStatus />
            
            {/* Estado del sistema */}
            <div className="mt-6 bg-white border rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-semibold mb-3">📊 Estado del Sistema</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Soporte del navegador:</span>
                  <span className="text-green-600">✅ Soportado</span>
                </div>
                <div className="flex justify-between">
                  <span>Contexto seguro (HTTPS):</span>
                  <span className={window.isSecureContext ? 'text-green-600' : 'text-red-600'}>
                    {window.isSecureContext ? '✅ Seguro' : '❌ No seguro'}
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
          </div>

          {/* Panel de notificaciones */}
          <div>
            <div className="bg-white border rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-semibold mb-3">📱 Notificaciones Recibidas</h3>
              
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📭</div>
                  <p>No hay notificaciones aún</p>
                  <p className="text-sm">Activa las notificaciones y prueba el sistema</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-blue-900">{notification.title}</h4>
                          <p className="text-sm text-blue-700 mt-1">{notification.message}</p>
                        </div>
                        <span className="text-xs text-blue-500 ml-2">{notification.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Instrucciones */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-blue-900">📋 Instrucciones</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                <li>Verifica que el estado del sistema esté en verde</li>
                <li>Haz clic en "Activar" para suscribirte a las notificaciones</li>
                <li>Haz clic en "Probar" para enviar una notificación de prueba</li>
                <li>Las notificaciones del backend aparecerán automáticamente</li>
                <li>Recarga la página para verificar que el estado se mantiene</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 bg-black text-green-400 p-4 rounded-lg font-mono text-sm">
            <h3 className="font-semibold mb-2">🔧 Debug Info:</h3>
            <pre className="overflow-auto max-h-64">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default PushTestPageV2;
