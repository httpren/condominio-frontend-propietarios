// src/serviceWorkerRegistration.js
export function register() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = '/sw.js';
      
      navigator.serviceWorker
        .register(swUrl)
        .then(registration => {
          // Evento de actualización
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker == null) {
              return;
            }
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // En este punto, el contenido antiguo se habrá purgado y el nuevo 
                  // contenido se habrá añadido al caché.
                  console.log('Nuevo contenido está disponible; por favor refresque.');
                  
                  // Ejecutar callback
                  if (window.onSWUpdate) window.onSWUpdate(registration);
                } else {
                  // En este punto, todo se ha almacenado en caché previamente.
                  console.log('El contenido está almacenado en caché para uso offline.');
                }
              }
            };
          };
        })
        .catch(error => {
          console.error('Error durante el registro del Service Worker:', error);
        });
    });
  }
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(registration => {
        registration.unregister();
      })
      .catch(error => {
        console.error(error.message);
      });
  }
}

// Función para verificar si la aplicación se está ejecutando en modo standalone (instalada)
export function isInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone || 
         document.referrer.includes('android-app://');
}

// Función para verificar si el dispositivo es móvil
export function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Detectar eventos de online/offline
export function setupNetworkListeners(onlineCallback, offlineCallback) {
  window.addEventListener('online', () => {
    if (onlineCallback) onlineCallback();
  });
  
  window.addEventListener('offline', () => {
    if (offlineCallback) offlineCallback();
  });
  
  // Retorna el estado inicial
  return navigator.onLine;
}