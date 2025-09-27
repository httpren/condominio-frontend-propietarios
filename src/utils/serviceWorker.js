// serviceWorker.js
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('✅ Service Worker registrado exitosamente:', registration);
      
      // Verificar si hay actualizaciones
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 Nueva versión del Service Worker disponible');
              // Opcional: mostrar notificación al usuario para recargar
            }
          });
        }
      });
      
      return registration;
    } catch (error) {
      console.error('❌ Error registrando Service Worker:', error);
      throw error;
    }
  } else {
    console.warn('⚠️ Service Worker no soportado en este navegador');
    return null;
  }
};

export const unregisterServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (let registration of registrations) {
        await registration.unregister();
        console.log('✅ Service Worker desregistrado');
      }
    } catch (error) {
      console.error('❌ Error desregistrando Service Worker:', error);
    }
  }
};

export const checkServiceWorkerStatus = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        console.log('📱 Service Worker registrado:', {
          scope: registration.scope,
          state: registration.active?.state,
          scriptURL: registration.active?.scriptURL
        });
        return true;
      } else {
        console.log('❌ No hay Service Worker registrado');
        return false;
      }
    } catch (error) {
      console.error('❌ Error verificando Service Worker:', error);
      return false;
    }
  }
  return false;
};

