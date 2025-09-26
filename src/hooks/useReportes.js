import { useState, useCallback } from 'react';
import axiosInstance from '../api/axiosConfig';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Hook para generar y descargar reportes (solo propietario) basados en endpoints existentes.
 * Soporta: expensas, pagos (por expensa o rango), reservas, visitas.
 */
export default function useReportes() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAllPages = async (baseUrl) => {
    // Intenta detectar paginación DRF (results + next) o lista directa.
    let results = [];
    let url = baseUrl;
    while (url) {
      const { data } = await axiosInstance.get(url);
      if (Array.isArray(data)) {
        results = data; // sin paginación
        break;
      }
      const pageResults = Array.isArray(data.results) ? data.results : [];
      results = results.concat(pageResults);
      url = data.next ? data.next.replace(/^.*\/api\//, '/api/') : null; // normaliza relativo
    }
    return results;
  };

  const buildCsv = (rows, headers) => {
    const headerLine = headers.map(h => '"' + h.label.replace(/"/g,'""') + '"').join(',');
    const lines = rows.map(r => headers.map(h => {
      const val = h.accessor(r);
      return '"' + (val !== undefined && val !== null ? String(val).replace(/"/g,'""') : '') + '"';
    }).join(','));
    return [headerLine, ...lines].join('\n');
  };

  const descargarArchivo = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    setTimeout(()=>URL.revokeObjectURL(url), 2000);
  };

  const generarReporte = useCallback(async ({ tipo, formato='csv', filtros={} }) => {
    setLoading(true); setError(null);
    try {
      let datos = [];
      let headers = [];
      if (tipo === 'expensas') {
        // filtros: pagado, vencida, mes
        const params = new URLSearchParams();
        if (filtros.pagado) params.append('pagado', filtros.pagado);
        if (filtros.vencida) params.append('vencida', filtros.vencida);
        if (filtros.mes) params.append('mes', filtros.mes);
        datos = await fetchAllPages(`/expensas/${params.toString() ? '?' + params.toString() : ''}`);
        headers = [
          { label: 'Mes', accessor: r => new Date(r.mes_referencia).toLocaleDateString('es-ES', { month:'long', year:'numeric' }) },
          { label: 'Total', accessor: r => Number(r.total).toFixed(2) },
          { label: 'Pagado Verificado', accessor: r => Number(r.total_pagado_verificado||0).toFixed(2) },
          { label: 'Saldo Pendiente', accessor: r => Number(r.saldo_pendiente||0).toFixed(2) },
          { label: 'Pagada', accessor: r => r.pagado ? 'Sí' : 'No' },
          { label: 'Vencida', accessor: r => r.esta_vencida ? 'Sí' : 'No' },
        ];
      } else if (tipo === 'pagos') {
        // filtros: expensaId, desde, hasta
        const params = new URLSearchParams();
        if (filtros.expensaId) params.append('expensa', filtros.expensaId);
        // No hay filtros de fecha estándar en backend según spec, se filtra client side si se bajan todos los pagos
        datos = await fetchAllPages(`/pagos/${params.toString() ? '?' + params.toString() : ''}`);
        if (filtros.desde || filtros.hasta) {
          datos = datos.filter(p => {
            const f = new Date(p.fecha_pago || p.created_at);
            if (filtros.desde && f < new Date(filtros.desde)) return false;
            if (filtros.hasta && f > new Date(filtros.hasta + 'T23:59:59')) return false;
            return true;
          });
        }
        headers = [
          { label: 'Fecha Pago', accessor: r => r.fecha_pago || (r.created_at ? r.created_at.slice(0,10): '') },
          { label: 'Expensa ID', accessor: r => r.expensa },
            { label: 'Monto', accessor: r => Number(r.monto).toFixed(2) },
          { label: 'Método', accessor: r => r.metodo_pago },
          { label: 'Verificado', accessor: r => r.verificado ? 'Sí':'No' },
        ];
      } else if (tipo === 'reservas') {
        datos = await fetchAllPages('/reservas/');
        headers = [
          { label: 'Área', accessor: r => r.area_nombre || r.area || '' },
          { label: 'Fecha', accessor: r => r.fecha || (r.inicio ? r.inicio.slice(0,10): '') },
          { label: 'Estado', accessor: r => r.estado },
          { label: 'Duración', accessor: r => r.duracion_horas || '' },
        ];
      } else if (tipo === 'visitas') {
        datos = await fetchAllPages('/visitas/');
        headers = [
          { label: 'Nombre', accessor: r => r.nombre || '' },
          { label: 'Documento', accessor: r => r.documento || '' },
          { label: 'Placa', accessor: r => r.placa || '' },
          { label: 'Creado', accessor: r => r.created_at ? new Date(r.created_at).toLocaleString('es-ES') : '' },
        ];
      } else {
        throw new Error('Tipo de reporte no soportado');
      }

      if (!datos.length) throw new Error('No hay datos para generar el reporte');

      if (formato === 'csv') {
        const csv = buildCsv(datos, headers);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        descargarArchivo(blob, `${tipo}_reporte_${Date.now()}.csv`);
      } else if (formato === 'pdf') {
        const doc = new jsPDF();
        doc.setFontSize(12);
        doc.text(`Reporte de ${tipo} - ${new Date().toLocaleString('es-ES')}`, 14, 14);
        autoTable(doc, {
          startY: 20,
          head: [headers.map(h => h.label)],
          body: datos.map(r => headers.map(h => h.accessor(r))),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [220,38,38] }
        });
        doc.save(`${tipo}_reporte_${Date.now()}.pdf`);
      } else {
        throw new Error('Formato no soportado');
      }

      return { success: true };
    } catch (e) {
      setError(e.message || 'Error generando reporte');
      return { success: false, error: e.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return { generarReporte, loading, error };
}
