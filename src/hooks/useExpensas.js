import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';

/**
 * Hook para gestionar expensas y pagos del propietario usando endpoints REST estándar.
 * Endpoints usados:
 *  - GET /expensas/
 *  - GET /expensas/{id}/
 *  - POST /pagos/  (crear pago)
 *  - (Opcional futuro) PATCH /api/pagos/{id}/verificar/ (admin)
 */
const useExpensas = () => {
  const [expensas, setExpensas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savingPayment, setSavingPayment] = useState(false);

  // Normalizar array desde respuesta paginada o no
  const extractResults = (data) => Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);

  const fetchExpensas = async () => {
    setLoading(true);
    setError(null);
    try {
  const response = await axiosInstance.get('/expensas/');
      setExpensas(extractResults(response.data));
    } catch (err) {
      console.error('Error fetchExpensas:', err);
      setError(err.response?.data?.message || 'Error al cargar expensas');
    } finally {
      setLoading(false);
    }
  };

  const fetchExpensaDetail = async (id) => {
    try {
  const response = await axiosInstance.get(`/expensas/${id}/`);
      return { success: true, data: response.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Error al obtener expensa' };
    }
  };

  // Crear pago: campos básicos inferidos (expensa, monto, metodo_pago, comprobante opcional)
  const createPago = async (payload) => {
    setSavingPayment(true);
    setError(null);
    try {
      let dataToSend; let headers = {};
      if (payload.comprobante) {
        const form = new FormData();
        Object.entries(payload).forEach(([k,v]) => { if (v !== undefined && v !== null) form.append(k, v); });
        dataToSend = form;
        headers['Content-Type'] = 'multipart/form-data';
      } else {
        dataToSend = payload;
      }
  const response = await axiosInstance.post('/pagos/', dataToSend, { headers });
      // refrescar expensas (estado podría cambiar a pagada)
      fetchExpensas();
      return { success: true, data: response.data };
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al registrar pago';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setSavingPayment(false);
    }
  };

  const getExpensasByPeriod = (year, month) => {
    return expensas.filter(e => {
      const fecha = new Date(e.periodo || e.mes || e.created_at || e.fecha_generacion);
      return fecha.getFullYear() === year && fecha.getMonth() === month;
    });
  };

  const isVencida = (expensa) => {
    if (!expensa) return false;
    const fv = new Date(expensa.fecha_vencimiento || expensa.vencimiento);
    if (isNaN(fv.getTime())) return false;
    const hoy = new Date();
    return (expensa.estado?.toLowerCase() === 'pendiente') && fv < hoy;
  };

  const getPaymentSummary = () => {
    const total = expensas.length;
    let pagadas = 0, pendientes = 0, vencidas = 0, totalAmount = 0, paidAmount = 0, pendingAmount = 0;
    expensas.forEach(e => {
      const estado = e.estado?.toLowerCase();
      const monto = parseFloat(e.valor_total || e.total || 0) || 0;
      totalAmount += monto;
      if (estado === 'pagada') { pagadas++; paidAmount += monto; }
      else if (estado === 'pendiente') { pendientes++; pendingAmount += monto; if (isVencida(e)) vencidas++; }
    });
    return { total, pagadas, pendientes, vencidas, totalAmount, paidAmount, pendingAmount };
  };

  useEffect(() => { fetchExpensas(); }, []);

  return {
    expensas,
    loading,
    error,
    savingPayment,
    fetchExpensas,
    fetchExpensaDetail,
    createPago,
    getExpensasByPeriod,
    getPaymentSummary,
    isVencida
  };
};

export default useExpensas;