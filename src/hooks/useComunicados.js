import { useEffect, useState, useCallback } from 'react';
import axiosInstance from '../api/axiosConfig';
import { checkSubscriptionStatus } from '../utils/push';

// Hook sencillo para gestionar comunicados (lista, resumen, filtros, marcar leído/no leído)
const useComunicados = () => {
  const [comunicados, setComunicados] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filtros, setFiltros] = useState({ leidos: undefined, tipo: undefined });

  const buildQuery = () => {
    const params = [];
    if (filtros.leidos !== undefined) params.push(`leidos=${filtros.leidos}`);
    if (filtros.tipo) params.push(`tipo=${encodeURIComponent(filtros.tipo)}`);
    return params.length ? `?${params.join('&')}` : '';
  };

  const fetchState = { inFlight: false, last: 0 };

  const fetchComunicados = useCallback(async () => {
    const now = Date.now();
    if (fetchState.inFlight || (now - fetchState.last < 1500)) {
      return; // throttle simple 1.5s
    }
    fetchState.inFlight = true;
    try {
      setLoading(true); setError(null);
      const query = buildQuery();
      const { data } = await axiosInstance.get(`/comunicados/${query}`);
      const lista = Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);
      lista.sort((a,b) => new Date(b.fecha_envio) - new Date(a.fecha_envio));
  setComunicados(lista);
  window.dispatchEvent(new CustomEvent('comunicados:update', { detail: { type: 'lista' } }));
    } catch (e) {
      setError(e.response?.data?.detail || 'Error cargando comunicados');
    } finally {
      fetchState.inFlight = false;
      fetchState.last = Date.now();
      setLoading(false);
    }
  }, [filtros]);

  const fetchResumen = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get('/comunicados/resumen/');
  setResumen(data);
  window.dispatchEvent(new CustomEvent('comunicados:update', { detail: { type: 'resumen', resumen: data } }));
    } catch (_) { /* silencioso */ }
  }, []);

  const marcarLeido = async (id) => {
    setComunicados(prev => prev.map(c => c.id === id ? { ...c, leido: true } : c));
    try {
  await axiosInstance.post(`/comunicados/${id}/marcar_leido/`);
  fetchResumen();
  window.dispatchEvent(new CustomEvent('comunicados:update', { detail: { type: 'marcar_leido', id } }));
    } catch (e) {
      // revertir
      setComunicados(prev => prev.map(c => c.id === id ? { ...c, leido: false } : c));
    }
  };

  // Importante: Se elimina la posibilidad de revertir un comunicado a "no leído".
  // Una vez marcado como leído permanece así; por eso NO se expone marcarNoLeido.

  const setFiltroLeidos = useCallback((soloNoLeidos) => {
    setFiltros(f => {
      const desired = soloNoLeidos === true ? false : undefined;
      if (f.leidos === desired) return f; // evitar renders innecesarios
      return { ...f, leidos: desired };
    });
  }, []);

  const setFiltroTipo = useCallback((tipo) => {
    setFiltros(f => {
      const desired = tipo || undefined;
      if (f.tipo === desired) return f;
      return { ...f, tipo: desired };
    });
  }, []);

  // Auto refresh inicial
  useEffect(() => { fetchComunicados(); }, [fetchComunicados]);
  useEffect(() => { fetchResumen(); }, [fetchResumen]);

  // Escuchar eventos de push notifications
  useEffect(() => {
    const handlePushNotification = async (event) => {
      console.log('📱 Push notification recibida en useComunicados:', event.detail);
      console.log('📱 Tipo de evento:', event.type);
      console.log('📱 Detalle completo:', event.detail);
      
      // Verificar si es una notificación de comunicado
      if (event.detail?.type === 'comunicado') {
        console.log('📢 Notificación de comunicado recibida, refrescando...');
        console.log('📢 ID del comunicado:', event.detail.id);
        console.log('📢 Título:', event.detail.titulo || event.detail.title);
        console.log('📢 Es masivo:', event.detail.es_masivo);
        
        // Pequeño delay para asegurar que el backend haya procesado el comunicado
        setTimeout(() => {
          console.log('🔄 Ejecutando refresh después de delay...');
          fetchComunicados();
          fetchResumen();
        }, 1000);
      } else {
        console.log('⚠️ Notificación recibida pero no es de comunicado:', event.detail?.type);
      }
    };

    const handleComunicadoReceived = async (event) => {
      console.log('📢 Comunicado específico recibido en useComunicados:', event.detail);
      console.log('📢 ID del comunicado:', event.detail.id);
      console.log('📢 Título:', event.detail.titulo || event.detail.title);
      console.log('📢 Es masivo:', event.detail.es_masivo);
      
      // Refrescar inmediatamente para comunicados específicos
      console.log('🔄 Refrescando comunicados por evento de comunicado...');
      fetchComunicados();
      fetchResumen();
    };

    // Escuchar eventos personalizados de push notifications
    console.log('🔧 Configurando listener de pushNotificationReceived en useComunicados...');
    window.addEventListener('pushNotificationReceived', handlePushNotification);
    
    // Escuchar eventos específicos de comunicados
    console.log('🔧 Configurando listener de comunicadoReceived en useComunicados...');
    window.addEventListener('comunicadoReceived', handleComunicadoReceived);
    
    // Escuchar eventos de refresh de comunicados
    const handleRefreshComunicados = () => {
      console.log('🔄 Refrescando comunicados por evento...');
      fetchComunicados();
      fetchResumen();
    };
    
    window.addEventListener('refreshComunicados', handleRefreshComunicados);

    return () => {
      console.log('🧹 Limpiando listeners en useComunicados...');
      window.removeEventListener('pushNotificationReceived', handlePushNotification);
      window.removeEventListener('comunicadoReceived', handleComunicadoReceived);
      window.removeEventListener('refreshComunicados', handleRefreshComunicados);
    };
  }, [fetchComunicados, fetchResumen]);

  // API para refresco externo (por ejemplo después de push)
  const refresh = () => { fetchComunicados(); fetchResumen(); };

  return {
    comunicados,
    resumen,
    loading,
    error,
    filtros,
    refresh,
    setFiltroLeidos,
    setFiltroTipo,
  marcarLeido,
    fetchComunicados,
    fetchResumen,
  };
};

export default useComunicados;
