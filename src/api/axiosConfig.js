// src/api/axiosConfig.js
import axios from "axios";
import { refresh as refreshToken, logout as rawLogout } from './auth';

// Determinar si el dispositivo está en línea
const isOnline = () => navigator.onLine;

const axiosInstance = axios.create({
  baseURL: "http://localhost:8000/api",
});

// Interceptor para añadir token de autenticación
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Comprobar si el dispositivo está offline
  if (!isOnline()) {
    // Cancelar solicitudes que no estén configuradas para trabajar offline
    if (!config.offlineSupport) {
      throw new axios.Cancel("Operación cancelada: No hay conexión a internet");
    }
    
    // Si la solicitud admite offline, podemos continuar (se manejará en otro lugar)
    config.offlineRequest = true;
  }
  
  return config;
});

// Interceptor para manejar respuestas
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Si es una cancelación (como offline) no hacer nada más
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }
    
    // Si el error es por falta de conexión, guardar la solicitud para reintentarla
    if (!isOnline() || (error.message && error.message.includes('Network Error'))) {
      const { config } = error;
      
      // Si la solicitud admite operaciones offline, guardarla para reintento
      if (config && config.offlineSupport) {
        // Guardar en cola de operaciones pendientes
        const pendingOperation = {
          url: config.url,
          method: config.method,
          data: config.data ? JSON.parse(config.data) : null,
          headers: config.headers,
          timestamp: Date.now()
        };
        
        // Guardar en localStorage
        try {
          const pendingOps = JSON.parse(localStorage.getItem('pendingOperations') || '[]');
          pendingOps.push(pendingOperation);
          localStorage.setItem('pendingOperations', JSON.stringify(pendingOps));
        } catch (err) {
          console.error('Error al guardar operación para sincronización:', err);
        }
        
        // Retornar una respuesta simulada para operaciones offline
        return Promise.resolve({
          data: { success: true, offlineOperation: true, pendingSync: true },
          status: 200,
          offlineOperation: true
        });
      }
    }
    
    // Manejo de 401 para refrescar token una sola vez
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshed = await refreshToken();
        if (refreshed && refreshed.access) {
          // Actualizar header y reintentar
          originalRequest.headers.Authorization = `Bearer ${refreshed.access}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshErr) {
        // Ignorado: proceder a logout abajo
      }
      // Si no se pudo refrescar, cerrar sesión globalmente
      rawLogout();
      localStorage.removeItem('user');
      // Emitir evento para que AuthContext pueda reaccionar si escucha
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:logout'));
      }
    }
    return Promise.reject(error);
  }
);

// Función para habilitar soporte offline en una solicitud
export const withOfflineSupport = (config) => {
  return {
    ...config,
    offlineSupport: true
  };
};

// Función para sincronizar operaciones pendientes
export const syncPendingOperations = async () => {
  if (!isOnline()) return { success: false, message: 'Sin conexión a internet' };
  
  try {
    const pendingOps = JSON.parse(localStorage.getItem('pendingOperations') || '[]');
    if (pendingOps.length === 0) return { success: true, synced: 0 };
    
    const successfulOps = [];
    
    for (const op of pendingOps) {
      try {
        await axiosInstance({
          url: op.url,
          method: op.method,
          data: op.data,
          headers: op.headers
        });
        successfulOps.push(op);
      } catch (error) {
        console.error('Error sincronizando operación:', error);
      }
    }
    
    // Eliminar operaciones sincronizadas
    const remainingOps = pendingOps.filter(op => 
      !successfulOps.some(sop => 
        sop.url === op.url && 
        sop.method === op.method && 
        sop.timestamp === op.timestamp
      )
    );
    
    localStorage.setItem('pendingOperations', JSON.stringify(remainingOps));
    
    return { 
      success: true, 
      synced: successfulOps.length,
      pending: remainingOps.length
    };
  } catch (error) {
    console.error('Error durante la sincronización:', error);
    return { success: false, error: error.message };
  }
};

// Escuchar eventos de conexión para sincronizar automáticamente
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Conexión recuperada. Sincronizando datos...');
    syncPendingOperations()
      .then(result => {
        if (result.synced > 0) {
          console.log(`Sincronización completada: ${result.synced} operaciones sincronizadas, ${result.pending} pendientes.`);
        }
      });
  });
}

export default axiosInstance;
