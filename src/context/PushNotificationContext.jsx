import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePushNotificationsV2 } from '../hooks/usePushNotificationsV2';

const PushNotificationContext = createContext();

export const usePushNotificationContext = () => {
  const context = useContext(PushNotificationContext);
  if (!context) {
    throw new Error('usePushNotificationContext must be used within a PushNotificationProvider');
  }
  return context;
};

export const PushNotificationProvider = ({ children }) => {
  const pushNotificationState = usePushNotificationsV2();
  
  // Refrescar estado cuando el contexto se monta
  useEffect(() => {
    if (pushNotificationState.isSupported && !pushNotificationState.isLoading) {
      console.log('🔄 PushNotificationProvider: Refrescando estado...');
      pushNotificationState.refreshStatus();
    }
  }, [pushNotificationState.isSupported, pushNotificationState.isLoading, pushNotificationState.refreshStatus]);

  // Escuchar mensajes del Service Worker
  useEffect(() => {
    const handleServiceWorkerMessage = (event) => {
      console.log('📱 Mensaje recibido del Service Worker:', event.data);
      console.log('📱 Tipo de mensaje:', event.data?.type);
      console.log('📱 Datos completos:', event.data);
      
      if (event.data?.type === 'PUSH_NOTIFICATION_RECEIVED') {
        console.log('🔔 Notificación push recibida:', event.data.data);
        console.log('🔔 Tipo de notificación:', event.data.data?.type);
        console.log('🔔 Título:', event.data.data?.titulo || event.data.data?.title);
        console.log('🔔 ID:', event.data.data?.id);
        console.log('🔔 Es masivo:', event.data.data?.es_masivo);
        
        // Emitir evento personalizado para que otros componentes puedan escuchar
        const customEvent = new CustomEvent('pushNotificationReceived', {
          detail: event.data.data
        });
        console.log('📤 Emitiendo evento personalizado:', customEvent);
        window.dispatchEvent(customEvent);
        
        // También emitir un evento específico para comunicados
        if (event.data.data?.type === 'comunicado') {
          const comunicadoEvent = new CustomEvent('comunicadoReceived', {
            detail: event.data.data
          });
          console.log('📤 Emitiendo evento de comunicado:', comunicadoEvent);
          window.dispatchEvent(comunicadoEvent);
        }
      }
      
      if (event.data?.type === 'OPEN_COMUNICADO') {
        console.log('📖 Abriendo comunicado:', event.data.id);
        
        // Emitir evento personalizado para abrir comunicado
        const customEvent = new CustomEvent('openComunicado', {
          detail: { id: event.data.id }
        });
        window.dispatchEvent(customEvent);
      }
    };

    // Escuchar mensajes del Service Worker
    if (navigator.serviceWorker) {
      console.log('🔧 Configurando listener del Service Worker...');
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
      
      // También escuchar cuando el service worker esté listo
      navigator.serviceWorker.ready.then((registration) => {
        console.log('✅ Service Worker listo para recibir mensajes');
      });
    } else {
      console.log('⚠️ Service Worker no disponible');
    }

    return () => {
      if (navigator.serviceWorker) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, []);

  return (
    <PushNotificationContext.Provider value={pushNotificationState}>
      {children}
    </PushNotificationContext.Provider>
  );
};
