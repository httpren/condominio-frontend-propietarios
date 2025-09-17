import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';

const useUnidades = () => {
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Obtener todas las unidades del propietario
  const fetchUnidades = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axiosInstance.get('/propietario/unidades');
      
      if (response.data.success) {
        setUnidades(response.data.data || []);
      } else {
        setError(response.data.message || 'Error al cargar las unidades');
      }
    } catch (err) {
      console.error('Error fetching unidades:', err);
      if (err.response?.status === 404) {
        setUnidades([]);
        setError(null);
      } else {
        setError(
          err.response?.data?.message || 
          'Error de conexión. Por favor, intenta nuevamente.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Obtener detalles específicos de una unidad
  const fetchUnidadDetails = async (unidadId) => {
    try {
      const response = await axiosInstance.get(`/propietario/unidades/${unidadId}`);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      console.error('Error fetching unidad details:', err);
      return { 
        success: false, 
        message: err.response?.data?.message || 'Error al obtener detalles de la unidad'
      };
    }
  };

  // Obtener información de convivencia (inquilinos actuales)
  const fetchConvivientes = async (unidadId) => {
    try {
      const response = await axiosInstance.get(`/propietario/unidades/${unidadId}/convivientes`);
      
      if (response.data.success) {
        return { success: true, data: response.data.data || [] };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      console.error('Error fetching convivientes:', err);
      return { 
        success: false, 
        message: err.response?.data?.message || 'Error al obtener información de convivientes'
      };
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchUnidades();
  }, []);

  return {
    unidades,
    loading,
    error,
    fetchUnidades,
    fetchUnidadDetails,
    fetchConvivientes
  };
};

export default useUnidades;