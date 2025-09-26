import { useState, useCallback, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';

// Hook para manejar pagos de una expensa específica (perspectiva propietario)
// Features: listar pagos, separar verificados/pendientes, crear pago, polling opcional
export default function usePagos(expensaId, { auto = true, polling = false, intervalMs = 45000 } = {}) {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const fetchPagos = useCallback(async () => {
    if (!expensaId) return;
    setLoading(true); setError(null);
    try {
      const { data } = await axiosInstance.get(`/pagos/?expensa=${expensaId}`);
      const lista = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
      // Ordenar más recientes primero
      lista.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
      setPagos(lista);
    } catch (e) {
      setError(e.response?.data?.detail || 'Error cargando pagos');
    } finally {
      setLoading(false);
    }
  }, [expensaId]);

  const crearPago = useCallback(async (payload) => {
    if (!expensaId) return { success: false, error: 'Expensa inválida' };
    setCreating(true); setError(null);
    try {
      // Sanitizar fecha_pago
      if (!payload.fecha_pago) payload.fecha_pago = new Date().toISOString().slice(0,10);
      if (payload.fecha_pago.length > 10) payload.fecha_pago = payload.fecha_pago.slice(0,10);
      const { data } = await axiosInstance.post('/pagos/', payload);
      // Refetch inmediato
      fetchPagos();
      return { success: true, data };
    } catch (e) {
      let msg = e.response?.data?.detail;
      if (!msg && e.response?.data) {
        const first = Object.values(e.response.data)[0];
        msg = Array.isArray(first) ? first[0] : first;
      }
      if (!msg) msg = 'Error al crear pago';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setCreating(false);
    }
  }, [expensaId, fetchPagos]);

  const verificados = pagos.filter(p => p.verificado);
  const pendientes = pagos.filter(p => !p.verificado);

  // Carga inicial
  useEffect(() => { if (auto) fetchPagos(); }, [auto, fetchPagos]);

  // Polling mientras haya pendientes y se habilite polling
  useEffect(() => {
    if (!polling || !pendientes.length) return;
    const id = setInterval(() => { fetchPagos(); }, intervalMs);
    return () => clearInterval(id);
  }, [polling, pendientes.length, fetchPagos, intervalMs]);

  return { pagos, verificados, pendientes, loading, creating, error, fetchPagos, crearPago };
}
