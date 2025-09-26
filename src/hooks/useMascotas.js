import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';

/**
 * Hook para gestionar las mascotas del propietario
 */
const useMascotas = () => {
  const [mascotas, setMascotas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar todas las mascotas
  const fetchMascotas = async () => {
    setLoading(true);
    setError(null);
    try {
  const response = await axiosInstance.get('/mascotas/');
      setMascotas(response.data.results || response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar mascotas');
      console.error('Error fetching mascotas:', err);
    } finally {
      setLoading(false);
    }
  };

  // Crear nueva mascota
  const createMascota = async (mascotaData) => {
    setLoading(true);
    setError(null);
    try {
  const response = await axiosInstance.post('/mascotas/', mascotaData);
      setMascotas(prev => [...prev, response.data]);
      return { success: true, data: response.data };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al crear mascota';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Actualizar mascota existente
  const updateMascota = async (id, mascotaData) => {
    setLoading(true);
    setError(null);
    try {
      // Usar PATCH para actualizaciones parciales según documentación
      const response = await axiosInstance.patch(`/mascotas/${id}/`, mascotaData);
      setMascotas(prev => 
        prev.map(mascota => mascota.id === id ? response.data : mascota)
      );
      return { success: true, data: response.data };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al actualizar mascota';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Eliminar mascota
  const deleteMascota = async (id) => {
    setLoading(true);
    setError(null);
    try {
  await axiosInstance.delete(`/mascotas/${id}/`);
      setMascotas(prev => prev.filter(mascota => mascota.id !== id));
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al eliminar mascota';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Cargar mascotas al montar el componente
  useEffect(() => {
    fetchMascotas();
  }, []);

  return {
    mascotas,
    loading,
    error,
    createMascota,
    updateMascota,
    deleteMascota,
    refetch: fetchMascotas
  };
};

export default useMascotas;