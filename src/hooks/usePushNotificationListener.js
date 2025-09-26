import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export const usePushNotificationListener = () => {
  const navigate = useNavigate();

  const handlePushNotification = useCallback((event) => {
    const data = event.detail;
    console.log('🔔 Procesando notificación push:', data);
    
    if (data?.type === 'comunicado') {
      console.log('📢 Notificación de comunicado recibida:', data);
      
      // Aquí puedes agregar lógica para actualizar el estado de comunicados
      // Por ejemplo, refrescar la lista de comunicados, mostrar un toast, etc.
      
      // Mostrar notificación en la consola para debug
      console.log('📋 Detalles del comunicado:');
      console.log('   - ID:', data.id);
      console.log('   - Título:', data.titulo || data.title);
      console.log('   - Tipo:', data.tipo);
      console.log('   - Es masivo:', data.es_masivo);
      console.log('   - URL:', data.url);
      
      // Emitir evento para que otros componentes puedan reaccionar
      const refreshEvent = new CustomEvent('refreshComunicados');
      window.dispatchEvent(refreshEvent);
      
      // Opcional: Mostrar notificación visual en la UI
      if (data.titulo || data.title) {
        console.log(`🎉 ¡Nuevo comunicado: ${data.titulo || data.title}!`);
      }
    }
  }, []);

  const handleOpenComunicado = useCallback((event) => {
    const { id } = event.detail;
    console.log('📖 Navegando a comunicado:', id);
    
    if (id) {
      navigate(`/comunicados/${id}`);
    }
  }, [navigate]);

  useEffect(() => {
    // Escuchar notificaciones push
    window.addEventListener('pushNotificationReceived', handlePushNotification);
    
    // Escuchar solicitudes de abrir comunicado
    window.addEventListener('openComunicado', handleOpenComunicado);

    return () => {
      window.removeEventListener('pushNotificationReceived', handlePushNotification);
      window.removeEventListener('openComunicado', handleOpenComunicado);
    };
  }, [handlePushNotification, handleOpenComunicado]);

  return {
    // Función para refrescar comunicados manualmente
    refreshComunicados: () => {
      const refreshEvent = new CustomEvent('refreshComunicados');
      window.dispatchEvent(refreshEvent);
    }
  };
};
