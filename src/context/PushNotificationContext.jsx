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

  return (
    <PushNotificationContext.Provider value={pushNotificationState}>
      {children}
    </PushNotificationContext.Provider>
  );
};
