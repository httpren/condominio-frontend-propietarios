import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, Plus, Trash2, Edit2, QrCode, Calendar, Clock, Users } from 'lucide-react';
import VisitQrModal from './VisitQrModal';
import useVisitas from '../../hooks/useVisitas';
import PageHeader from '../common/PageHeader';
import Table from '../common/Table';
import Button from '../common/Button';
import Badge from '../common/Badge';
import StatsGrid from '../common/StatsGrid';

const VisitasList = () => {
  const navigate = useNavigate();
  const { visitas, loading, error, deleteVisita } = useVisitas();
  const [feedback, setFeedback] = useState(null);
  const [qrModal, setQrModal] = useState({ open: false, code: '' });

  const handleDelete = useCallback(async (v) => {
    if (!window.confirm('¿Cancelar / eliminar esta visita?')) return;
    const r = await deleteVisita(v.id);
    if (!r.success) {
      setFeedback({ type: 'error', message: r.error || 'Error al eliminar la visita' });
    } else {
      setFeedback({ type: 'success', message: 'Visita eliminada exitosamente' });
    }
  }, [deleteVisita]);

  const isFutura = useCallback((fechaStr) => {
    if (!fechaStr) return false;
    // Si viene sólo YYYY-MM-DD evitar tratarlo como UTC (que desplaza al día anterior en TZ negativa)
    if (/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
      const [y,m,d] = fechaStr.split('-').map(n => parseInt(n,10));
      const hoy = new Date();
      const fechaLocal = new Date(y, m-1, d, 23, 59, 59); // fin del día local
      // Consideramos "Programada" si es hoy o en el futuro (>= hoy)
      return fechaLocal >= new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    }
    // Si tiene hora, parse normal (se interpreta en local) y comparar contra ahora
    const dObj = new Date(fechaStr);
    if (isNaN(dObj.getTime())) return false;
    const now = new Date();
    // También considerar "programada" si la fecha es hoy aunque la hora ya pasó? Mantendremos lógica original: futura estricta
    return dObj >= new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  // Configuración de la tabla
  const columns = useMemo(() => [
    {
      key: 'nombre_visitante',
      header: 'Visitante',
      render: (value, row) => {
        const nombre = value || row.nombre || '—';
        return <span className="font-medium">{nombre}</span>;
      },
    },
    {
      key: 'documento_visitante',
      header: 'Documento',
      render: (value) => value || '—',
    },
    {
      key: 'fecha',
      header: 'Fecha y Hora',
      render: (value, row) => {
        const fechaBase = value || row.fecha_visita;
        if (!fechaBase) return '—';
        const horaLocal = row.hora_local || (row.fecha_completa_ui && row.fecha_completa_ui.split('T')[1]?.slice(0,5));
        // Si recibimos sólo fecha (YYYY-MM-DD) y no hay hora local, mostrar sólo la fecha formateada
        if (/^\d{4}-\d{2}-\d{2}$/.test(fechaBase) && !horaLocal) {
          try {
            const [y,m,d] = fechaBase.split('-').map(n=>parseInt(n,10));
            const dLocal = new Date(y, m-1, d);
            return dLocal.toLocaleDateString('es-ES', { year:'numeric', month:'short', day:'numeric' });
          } catch { return fechaBase; }
        }
        // Construir fecha completa para mostrar (asumir hora local)
        const fechaCompleta = horaLocal && /^\d{4}-\d{2}-\d{2}$/.test(fechaBase)
          ? `${fechaBase}T${horaLocal}`
          : fechaBase;
        try {
          const d = new Date(fechaCompleta);
          if (isNaN(d.getTime())) return fechaBase;
          return d.toLocaleString('es-ES', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
          });
        } catch { return fechaBase; }
      },
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (_, row) => {
        const fecha = row.fecha || row.fecha_visita;
        const futura = fecha && isFutura(fecha);
        return (
          <Badge variant={futura ? 'info' : 'neutral'}>
            {futura ? 'Programada' : 'Pasada'}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: 'Acciones',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (_, row) => {
        return (
          <div className="flex items-center gap-2 justify-end">
            {row.qr_code && (
              <Button
                variant="icon"
                icon={QrCode}
                onClick={() => setQrModal({ open: true, code: row.qr_code })}
                title="Ver código QR"
              />
            )}
            <Button
              variant="icon"
              icon={Trash2}
              onClick={() => handleDelete(row)}
              className="text-red-400 hover:text-red-300"
              title="Eliminar visita"
            />
          </div>
        );
      },
    },
  ], [handleDelete]);

  // Estadísticas
  const statsData = useMemo(() => {
    const now = new Date();
    const futuras = visitas.filter(v => {
      const fecha = v.fecha || v.fecha_visita;
      return fecha && isFutura(fecha);
    });
    const hoy = visitas.filter(v => {
      const fecha = v.fecha || v.fecha_visita;
      if (!fecha) return false;
      const d = new Date(fecha);
      const today = new Date();
      return d.toDateString() === today.toDateString();
    });

    return [
      {
        title: 'Total',
        value: visitas.length,
        variant: 'info',
        icon: Users,
      },
      {
        title: 'Programadas',
        value: futuras.length,
        variant: 'success',
        icon: Calendar,
      },
      {
        title: 'Para hoy',
        value: hoy.length,
        variant: 'warning',
        icon: Clock,
      },
    ];
  }, [visitas, isFutura]);

  // Acciones del header
  const headerActions = useMemo(() => (
    <Button
      variant="secondary"
      icon={Plus}
      onClick={() => navigate('/visitas/crear')}
    >
      Nueva Visita
    </Button>
  ), [navigate]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Visitas"
        description="Registra y administra las visitas a tu unidad"
        icon={UserCheck}
        actions={headerActions}
      />

      {/* Estadísticas */}
      <StatsGrid stats={statsData} />

      {/* Feedback */}
      {feedback && (
        <div className={feedback.type === 'success' ? 'alert-success' : 'alert-error'}>
          {feedback.message}
        </div>
      )}

      {/* Error general */}
      {error && !feedback && (
        <div className="alert-error">{error}</div>
      )}

      {/* Tabla */}
      <Table
        columns={columns}
        data={visitas}
        loading={loading}
        emptyMessage="No hay visitas registradas"
      />

      {/* Modal QR */}
      <VisitQrModal
        open={qrModal.open}
        code={qrModal.code}
        onClose={() => setQrModal({ open: false, code: '' })}
        onCopied={() => setFeedback({ type: 'success', message: 'Código copiado al portapapeles' })}
      />
    </div>
  );
};

export default VisitasList;