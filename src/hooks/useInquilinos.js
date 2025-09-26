import { useState, useCallback, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';

/**
 * Hook para gestionar inquilinos según API_INQUILINOS.md
 * Funcionalidades: listar, crear (solo propietario), desactivar.
 */
const useInquilinos = () => {
  const [inquilinos, setInquilinos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [toggling, setToggling] = useState(null); // id en proceso de desactivar
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const fetchInquilinos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await axiosInstance.get('/inquilinos/');
      const data = resp.data;
      let list = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (data && Array.isArray(data.results)) {
        // Soporte por si backend cambia a paginado estilo DRF PageNumberPagination
        list = data.results;
      } else if (data && typeof data === 'object') {
        // Si devuelve objeto único inadvertidamente, lo ignoramos para no romper UI
        list = [];
      }
      setInquilinos(list);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cargar inquilinos');
      setInquilinos([]); // Garantizar array
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInquilinos(); }, [fetchInquilinos]);

  const crearInquilino = async (userData) => {
    setCreating(true);
    setFeedback(null);
    try {
      const resp = await axiosInstance.post('/inquilinos/', { user_data: userData });
      setInquilinos(prev => {
        const base = Array.isArray(prev) ? prev : [];
        return [...base, resp.data];
      });
      setFeedback({ type: 'success', message: 'Inquilino creado exitosamente' });
      return resp.data;
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.detail || 'Error al crear inquilino' });
      return null;
    } finally {
      setCreating(false);
    }
  };

  const desactivarInquilino = async (id) => {
    setToggling(id);
    setFeedback(null);
    try {
      // Primero intentamos el PATCH estándar del recurso enviando activo:false.
      // Tu backend actual (según el código compartido) NO define la acción /desactivar/,
      // así que el endpoint correcto debe ser /inquilinos/{id}/ con el campo activo.
      let updated = null;
      try {
        const resp = await axiosInstance.patch(`/inquilinos/${id}/`, { activo: false });
        updated = resp.data;
      } catch (errPrimary) {
        // Fallback: si en algún momento agregaste la acción personalizada /desactivar/
        // y el PATCH estándar falla con 404/405, probamos ese endpoint legacy.
        const status = errPrimary.response?.status;
        if (status === 404 || status === 405) {
          const resp2 = await axiosInstance.patch(`/inquilinos/${id}/desactivar/`);
          updated = resp2.data || null;
        } else {
          throw errPrimary;
        }
      }

      // Actualizamos estado local. Si el backend devolvió el objeto actualizado lo usamos; sino mutación local mínima.
      setInquilinos(prev => prev.map(i => {
        if (i.id !== id) return i;
        if (updated && typeof updated === 'object') return { ...i, ...updated };
        return { ...i, activo: false, user: { ...i.user, is_active: false } };
      }));
      setFeedback({ type: 'success', message: 'Inquilino desactivado' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.detail || 'Error al desactivar inquilino' });
    } finally {
      setToggling(null);
    }
  };

  // Normalización defensiva para el consumidor
  const safeInquilinos = Array.isArray(inquilinos) ? inquilinos : [];

  return {
    inquilinos: safeInquilinos,
    loading,
    creating,
    toggling,
    error,
    feedback,
    crearInquilino,
    desactivarInquilino,
    fetchInquilinos,
    setFeedback
  };
};

export default useInquilinos;
