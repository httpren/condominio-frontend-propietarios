import React from 'react';
import PushNotificationSettings from './PushNotificationSettings';

const PushNotificationExample = () => {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Configuración de Notificaciones
        </h1>
        <p className="text-gray-600">
          Configura las notificaciones push para recibir alertas sobre nuevos comunicados y actualizaciones importantes.
        </p>
      </div>

      <PushNotificationSettings />

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">
          ¿Cómo funcionan las notificaciones?
        </h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Recibirás notificaciones instantáneas cuando se publiquen nuevos comunicados</li>
          <li>• Las notificaciones aparecerán incluso cuando la aplicación esté cerrada</li>
          <li>• Puedes hacer clic en la notificación para abrir la aplicación directamente</li>
          <li>• Las notificaciones requieren permisos del navegador y conexión HTTPS</li>
        </ul>
      </div>

      <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-yellow-800 mb-2">
          Solución de problemas
        </h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Si no ves el botón de activar, verifica que estés en HTTPS</li>
          <li>• Asegúrate de que tu navegador soporte Service Workers</li>
          <li>• Si las notificaciones no llegan, verifica la conexión a internet</li>
          <li>• En móviles, las notificaciones funcionan mejor en la versión instalada de la app</li>
        </ul>
      </div>
    </div>
  );
};

export default PushNotificationExample;
