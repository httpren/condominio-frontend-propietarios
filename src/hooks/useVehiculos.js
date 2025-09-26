import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';

/**
 * Hook para gestionar los vehículos del propietario
 */
const useVehiculos = () => {
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Utilidad: transformar objeto del API a forma usada en UI
  const transformFromAPI = (item) => ({
    ...item,
    // Alias para compatibilidad previa donde se usaba 'tipo'
    tipo: item.tipo_vehiculo,
  });

  // Utilidad: preparar payload para API
  const toAPIPayload = (data) => {
    const { tipo, tipo_vehiculo, ...rest } = data;
    return {
      ...rest,
      tipo_vehiculo: tipo_vehiculo || tipo, // aceptar cualquiera de los dos desde UI
    };
  };

  // Cargar todos los vehículos
  const fetchVehiculos = async () => {
    setLoading(true);
    setError(null);
    try {
  const response = await axiosInstance.get('/vehiculos/');
      const raw = response.data.results || response.data;
      setVehiculos(Array.isArray(raw) ? raw.map(transformFromAPI) : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar vehículos');
      console.error('Error fetching vehiculos:', err);
    } finally {
      setLoading(false);
    }
  };

  // Crear nuevo vehículo (propietario puede crear según especificación)
  const createVehiculo = async (vehiculoData) => {
    setLoading(true);
    setError(null);
    try {
      const payload = toAPIPayload(vehiculoData);
      const response = await axiosInstance.post('/vehiculos/', payload);
      const created = transformFromAPI(response.data);
      setVehiculos(prev => [...prev, created]);
      return { success: true, data: created };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al crear vehículo';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Actualizar vehículo existente
  const updateVehiculo = async (id, vehiculoData) => {
    setLoading(true);
    setError(null);
    try {
      const payload = toAPIPayload(vehiculoData);
      // Usar PATCH para actualizaciones parciales según guía REST
      const response = await axiosInstance.patch(`/vehiculos/${id}/`, payload);
      setVehiculos(prev => 
        prev.map(vehiculo => vehiculo.id === id ? transformFromAPI(response.data) : vehiculo)
      );
      return { success: true, data: transformFromAPI(response.data) };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al actualizar vehículo';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Eliminar vehículo
  const deleteVehiculo = async (id) => {
    setLoading(true);
    setError(null);
    try {
  await axiosInstance.delete(`/vehiculos/${id}/`);
      setVehiculos(prev => prev.filter(vehiculo => vehiculo.id !== id));
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al eliminar vehículo';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Generar QR para vehículo
  const generateQR = async (id) => {
    setLoading(true);
    setError(null);
    try {
  const response = await axiosInstance.post(`/vehiculos/${id}/generate_qr/`, {});
      // Actualizar el vehículo con el nuevo QR
      setVehiculos(prev => 
        prev.map(vehiculo => 
          vehiculo.id === id 
            ? { ...vehiculo, qr_code_url: response.data.qr_code_url }
            : vehiculo
        )
      );
      return { success: true, data: response.data };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al generar código QR';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Nota: Se removió toggleActivo porque no está descrito en el alcance para propietarios.

  // Cargar vehículos al montar el componente
  useEffect(() => {
    fetchVehiculos();
  }, []);

  return {
    vehiculos,
    loading,
    error,
    createVehiculo,
    updateVehiculo,
    deleteVehiculo,
    generateQR,
    refetch: fetchVehiculos
  };
};

export default useVehiculos;