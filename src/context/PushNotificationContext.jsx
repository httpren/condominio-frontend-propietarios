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
    let mounted = true;
    
    const initializeStatus = async () => {
      if (pushNotificationState.isSupported && !pushNotificationState.isLoading && mounted) {
        pushNotificationState.refreshStatus();
      }
    };
    
    initializeStatus();
    
    return () => {
      mounted = false;
    };
  }, [pushNotificationState.isSupported, pushNotificationState.isLoading, pushNotificationState.refreshStatus]);

  // Escuchar mensajes del Service Worker
  useEffect(() => {
    const handleServiceWorkerMessage = (event) => {
      if (event.data?.type === 'PUSH_NOTIFICATION_RECEIVED') {
        // Emitir evento personalizado para que otros componentes puedan escuchar
        const customEvent = new CustomEvent('pushNotificationReceived', {
          detail: event.data.data
        });
        window.dispatchEvent(customEvent);
        
        // También emitir un evento específico para comunicados
        if (event.data.data?.type === 'comunicado') {
          const comunicadoEvent = new CustomEvent('comunicadoReceived', {
            detail: event.data.data
          });
          window.dispatchEvent(comunicadoEvent);
        }
      }
      
      if (event.data?.type === 'OPEN_COMUNICADO') {
        // Emitir evento personalizado para abrir comunicado
        const customEvent = new CustomEvent('openComunicado', {
          detail: { id: event.data.id }
        });
        window.dispatchEvent(customEvent);
      }
    };

    // Escuchar mensajes del Service Worker
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
      
      // También escuchar cuando el service worker esté listo
      navigator.serviceWorker.ready.then(() => {
        // Service worker listo
      });
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
