import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import './assets/mobile.css'
import App from './App.jsx'
import { register } from './serviceWorkerRegistration';

// Registrar el service worker para PWA
register();

// Detectar si es un dispositivo móvil para ajustes específicos
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
if (isMobile) {
  // Añadir clase al body para estilos específicos de móviles
  document.body.classList.add('mobile-device');
  
  // Prevenir comportamientos indeseados en dispositivos táctiles
  document.addEventListener('touchmove', (e) => {
    if (e.target.classList.contains('prevent-scroll')) {
      e.preventDefault();
    }
  }, { passive: false });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
