import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';

const useReportes = () => {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Obtener todos los reportes disponibles para el propietario
  const fetchReportes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axiosInstance.get('/propietario/reportes');
      
      if (response.data.success) {
        setReportes(response.data.data || []);
      } else {
        setError(response.data.message || 'Error al cargar los reportes');
      }
    } catch (err) {
      console.error('Error fetching reportes:', err);
      if (err.response?.status === 404) {
        setReportes([]);
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

  // Generar un reporte específico
  const generateReporte = async (tipoReporte, parametros = {}) => {
    try {
      const response = await axiosInstance.post('/propietario/reportes/generar', {
        tipo: tipoReporte,
        parametros
      });
      
      if (response.data.success) {
        // Refrescar la lista de reportes
        fetchReportes();
        return { success: true, data: response.data.data };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      console.error('Error generating reporte:', err);
      return { 
        success: false, 
        message: err.response?.data?.message || 'Error al generar el reporte'
      };
    }
  };

  // Descargar un reporte
  const downloadReporte = async (reporteId) => {
    try {
      const response = await axiosInstance.get(
        `/propietario/reportes/${reporteId}/download`,
        { responseType: 'blob' }
      );
      
      // Crear URL del blob y descargar
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte-${reporteId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (err) {
      console.error('Error downloading reporte:', err);
      return { 
        success: false, 
        message: err.response?.data?.message || 'Error al descargar el reporte'
      };
    }
  };

  // Obtener tipos de reportes disponibles
  const getAvailableReportTypes = () => {
    return [
      {
        id: 'expensas',
        nombre: 'Reporte de Expensas',
        descripcion: 'Historial detallado de pagos y estados de expensas',
        icon: '📄',
        parametros: ['fechaInicio', 'fechaFin', 'unidad']
      },
      {
        id: 'visitas',
        nombre: 'Reporte de Visitas',
        descripcion: 'Registro de visitas programadas y realizadas',
        icon: '👥',
        parametros: ['fechaInicio', 'fechaFin']
      },
      {
        id: 'vehiculos',
        nombre: 'Reporte de Vehículos',
        descripcion: 'Listado de vehículos registrados y códigos QR',
        icon: '🚗',
        parametros: []
      },
      {
        id: 'mascotas',
        nombre: 'Reporte de Mascotas',
        descripcion: 'Registro de mascotas autorizadas en el condominio',
        icon: '🐕',
        parametros: []
      },
      {
        id: 'resumen_anual',
        nombre: 'Resumen Anual',
        descripcion: 'Resumen completo de actividades del año',
        icon: '📊',
        parametros: ['año']
      },
      {
        id: 'estado_cuenta',
        nombre: 'Estado de Cuenta',
        descripcion: 'Estado actual de pagos y saldos pendientes',
        icon: '💰',
        parametros: []
      }
    ];
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchReportes();
  }, []);

  return {
    reportes,
    loading,
    error,
    fetchReportes,
    generateReporte,
    downloadReporte,
    getAvailableReportTypes
  };
};

export default useReportes;