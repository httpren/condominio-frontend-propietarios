import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import Table from '../components/common/Table';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import useComunicados from '../hooks/useComunicados';
import { usePushNotificationListener } from '../hooks/usePushNotificationListener';
import { Bell, Check } from 'lucide-react';
import { registrarPush } from '../utils/push';

const tipoConfig = {
  expensa: { variant: 'info', label: 'Expensa' },
  mora: { variant: 'error', label: 'Mora' },
  reunion: { variant: 'warning', label: 'Reunión' },
  seguridad: { variant: 'warning', label: 'Seguridad' },
  general: { variant: 'neutral', label: 'General' }
};

const ComunicadosPage = () => {
  const { comunicados, loading, error, resumen, setFiltroLeidos, setFiltroTipo, marcarLeido } = useComunicados();
  const { refreshComunicados } = usePushNotificationListener();
  const [soloNoLeidos, setSoloNoLeidos] = useState(false);
  const [tipoSel, setTipoSel] = useState('');
  const [selected, setSelected] = useState(null);
  const [pushStatus, setPushStatus] = useState(null); // null | 'ok' | 'error' | 'ya'
  const [newNotification, setNewNotification] = useState(null);
  const VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY; // asumir variable

  const columns = [
    {
      key: 'titulo',
      header: 'Título',
      render: (value, row) => (
        <Link to={`/comunicados/${row.id}`} className="flex flex-col group">
          <span className={`font-medium group-hover:underline ${row.leido ? 'text-white/70' : 'text-white'}`}>{value}</span>
          <span className="text-xs text-white/40 truncate max-w-[280px] group-hover:text-white/60">{row.mensaje}</span>
        </Link>
      )
    },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (value) => {
        const cfg = tipoConfig[value] || tipoConfig.general;
        return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
      }
    },
    {
      key: 'fecha_envio',
      header: 'Enviado',
      render: (value) => value ? new Date(value).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }) : '—'
    },
    {
      key: 'leido',
      header: 'Estado',
      render: (_, row) => row.leido ? <span className="text-xs text-white/40">Leído</span> : <span className="text-xs text-info-300 font-semibold">No leído</span>
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (_, row) => row.leido ? (
        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-white/5 text-white/50 border border-white/10">
          <Check className="w-3 h-3 text-emerald-400" /> Leído
        </span>
      ) : (
        <Button variant="secondary" size="xs" onClick={() => marcarLeido(row.id)}>Marcar leído</Button>
      )
    }
  ];

  const toggleNoLeidos = () => {
    const next = !soloNoLeidos;
    setSoloNoLeidos(next);
    setFiltroLeidos(next);
  };

  const onTipoChange = (e) => {
    const val = e.target.value;
    setTipoSel(val);
    setFiltroTipo(val || undefined);
  };

  const activarPush = async () => {
    if (!VAPID_KEY) { setPushStatus('error'); return; }
    const res = await registrarPush(VAPID_KEY);
    if (res.success) setPushStatus(res.message === 'Ya registrado' ? 'ya' : 'ok');
    else setPushStatus('error');
  };

  // Abrir comunicado específico si viene desde notificación
  useEffect(() => {
    const id = sessionStorage.getItem('openComunicadoId');
    if (id && comunicados.length) {
      const target = comunicados.find(c => String(c.id) === id);
      if (target) {
        // Marcar leído automáticamente (optimistic)
        if (!target.leido) marcarLeido(target.id);
        // Simple selección local (si se quisiera mostrar detalle futuro)
        setSelected(target);
      }
      sessionStorage.removeItem('openComunicadoId');
    }
  }, [comunicados]);

  // Escuchar notificaciones push para mostrar indicador visual
  useEffect(() => {
    const handlePushNotification = (event) => {
      if (event.detail?.type === 'comunicado') {
        console.log('📢 Nueva notificación de comunicado recibida en la página');
        setNewNotification({
          titulo: event.detail.titulo || event.detail.title,
          id: event.detail.id,
          timestamp: new Date().toLocaleTimeString()
        });
        
        // Limpiar el indicador después de 5 segundos
        setTimeout(() => {
          setNewNotification(null);
        }, 5000);
      }
    };

    window.addEventListener('pushNotificationReceived', handlePushNotification);

    return () => {
      window.removeEventListener('pushNotificationReceived', handlePushNotification);
    };
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Comunicados"
        description="Avisos importantes y mensajes de la administración"
        icon={Bell}
      />

      <div className="flex flex-wrap gap-3 items-center">
        <Button variant={soloNoLeidos ? 'primary' : 'secondary'} size="sm" onClick={toggleNoLeidos}>
          {soloNoLeidos ? 'Ver todos' : 'Solo no leídos'}
        </Button>
        <Button
          variant={pushStatus === 'ok' || pushStatus === 'ya' ? 'secondary' : 'secondary'}
          size="sm"
          onClick={activarPush}
          disabled={pushStatus === 'ok' || pushStatus === 'ya'}
          title={pushStatus === 'ok' || pushStatus === 'ya' ? 'Suscripción push registrada' : 'Registrar notificaciones push'}
        >
          {pushStatus === 'ok' && 'Push activo'}
          {pushStatus === 'ya' && 'Push ya activo'}
          {pushStatus === null && 'Activar Push'}
          {pushStatus === 'error' && 'Reintentar Push'}
        </Button>
        <select value={tipoSel} onChange={onTipoChange} className="bg-white/5 text-sm rounded px-2 py-1 text-white outline-none">
          <option value="">Todos los tipos</option>
          <option value="expensa">Expensa</option>
          <option value="mora">Mora</option>
          <option value="reunion">Reunión</option>
          <option value="seguridad">Seguridad</option>
          <option value="general">General</option>
        </select>
        {resumen && (
          <div className="text-xs text-white/60 flex gap-2">
            <span>Total: {resumen.total}</span>
            <span>Leídos: {resumen.leidos}</span>
            <span>No leídos: {resumen.no_leidos}</span>
          </div>
        )}
      </div>

      {error && <div className="alert-error">{error}</div>}

      {/* Indicador de nueva notificación */}
      {newNotification && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
            <div>
              <p className="text-green-400 font-medium">¡Nuevo comunicado recibido!</p>
              <p className="text-green-300 text-sm">{newNotification.titulo}</p>
              <p className="text-green-400/60 text-xs">{newNotification.timestamp}</p>
            </div>
            <button 
              onClick={() => setNewNotification(null)}
              className="ml-auto text-green-400/60 hover:text-green-400"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <Table
        columns={columns}
        data={comunicados}
        loading={loading}
        emptyMessage="No hay comunicados"
      />

      {selected && (
        <div></div>
      )}
    </div>
  );
};

export default ComunicadosPage;
