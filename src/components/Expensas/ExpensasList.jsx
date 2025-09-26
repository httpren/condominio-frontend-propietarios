import React, { useState, useEffect } from 'react';
import { Calendar, Filter, RefreshCw, DollarSign, FilterX, Download, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useExpensas from '../../hooks/useExpensas';
import usePropietario from '../../hooks/usePropietario';
// PaymentModal eliminado: reemplazado por ExpensaDetailModal
import ExpensaDetailModal from './ExpensaDetailModal';
import RegistrarPagoModal from './RegistrarPagoModal';
import Pagination from '../common/Pagination';
import PageHeader from '../common/PageHeader';
import StatsGrid from '../common/StatsGrid';
import Table from '../common/Table';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Input from '../common/Input';
import Select from '../common/Select';

const ExpensasList = () => {
  const { 
    expensas, 
    loading, 
    error, 
    filters, 
    setFilter, 
    computeStats, 
    getEstado, 
    page, 
    setPage, 
    count, 
    pageSize, 
    setPageSize, 
    fetchExpensas 
  } = useExpensas();
  
  const { perfil, fetchPerfil } = usePropietario();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedExpensa, setSelectedExpensa] = useState(null); // para ver detalle
  const [pagoExpensa, setPagoExpensa] = useState(null); // para registrar pago
  const [feedback, setFeedback] = useState(null);

  const stats = computeStats();
  const navigate = useNavigate();

  // Forzar carga inicial de expensas abiertas (no pagadas) si no hay filtro definido
  useEffect(() => {
    if (filters.pagado === '') {
      setFilter('pagado', 'false');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearFilters = () => {
    setFilter('mes', ''); 
    setFilter('pagado', ''); 
    setFilter('vencida', '');
  };

  // Manejo del pago ahora se hace dentro de RegistrarPagoModal (usa hook propio)

  const getBadgeVariant = (estado) => {
    switch (estado) {
      case 'pagada': return 'success';
      case 'vencida': return 'error';
      case 'parcial': return 'info';
      default: return 'warning';
    }
  };

  // Configuración de la tabla
  const columns = [
    {
      key: 'mes_referencia',
      header: 'Mes',
      render: (value) => new Date(value).toLocaleDateString('es-ES', { 
        month: 'short', 
        year: 'numeric' 
      }),
    },
    {
      key: 'progreso',
      header: '%',
      render: (_, row) => {
        const total = Number(row.total) || 0;
        const pagadoVer = Number(row.total_pagado_verificado) || 0;
        const pct = total > 0 ? Math.min(100, Math.round((pagadoVer / total) * 100)) : 0;
        return (
          <div className="w-14">
            <div className="h-1.5 rounded bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded ${pct === 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-sky-400' : 'bg-white/20'}`}
                style={{ width: pct + '%' }}
              />
            </div>
            <div className="text-[10px] text-white/50 mt-1 text-center">{pct}%</div>
          </div>
        );
      }
    },
    {
      key: 'total',
      header: 'Total',
      render: (value) => `$${Number(value).toFixed(2)}`,
    },
    {
      key: 'total_pagado_verificado',
      header: 'Pagado',
      render: (value) => `$${Number(value).toFixed(2)}`,
    },
    {
      key: 'saldo_pendiente',
      header: 'Saldo',
      render: (value) => (
        <span className={Number(value) > 0 ? 'text-yellow-400 font-medium' : 'text-white/70'}>
          ${Number(value).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'fecha_vencimiento',
      header: 'Vencimiento',
      render: (value) => value ? new Date(value).toLocaleDateString('es-ES') : '-',
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (_, row) => {
        const estado = getEstado(row);
        return (
          <Badge variant={getBadgeVariant(estado)}>
            {estado}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: 'Acciones',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (_, row) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            size="xs"
            onClick={() => setSelectedExpensa(row)}
          >
            Detalle
          </Button>
          {getEstado(row) !== 'pagada' && (
            <Button
              variant="primary"
              size="xs"
              icon={DollarSign}
              onClick={() => setPagoExpensa(row)}
            >
              Pagar
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Estadísticas para el grid
  const statsData = [
    {
      title: 'Pagadas',
      value: stats.pagadas,
      variant: 'success',
      icon: Calendar,
    },
    {
      title: 'Vencidas',
      value: stats.vencidas,
      variant: 'error',
      icon: AlertTriangle,
    },
    {
      title: 'Saldo Total',
      value: `$${stats.saldoAcumulado.toFixed(2)}`,
      variant: stats.saldoAcumulado > 0 ? 'warning' : 'default',
      icon: DollarSign,
    },
  ];

  // Acciones del header
  const headerActions = (
    <>
      <Button
        variant="secondary"
        icon={Filter}
        onClick={() => setFiltersOpen(!filtersOpen)}
      >
        Filtros
      </Button>
      <Button
        variant="secondary"
        icon={RefreshCw}
        onClick={() => fetchExpensas()}
      >
        Refrescar
      </Button>
      <Button
        variant="secondary"
        icon={CheckCircle2}
        onClick={() => navigate('/expensas/pagadas')}
      >
        Pagadas
      </Button>
      <Button
        variant="secondary"
        icon={Download}
      >
        Exportar
      </Button>
    </>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Expensas"
        description="Gestiona los pagos de expensas del condominio"
        icon={Calendar}
        actions={headerActions}
      />

      {/* Alerta de mora */}
      {perfil?.restringido_por_mora && (
        <div className="alert-error flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Cuenta en mora</p>
            <p className="text-white/70">
              {perfil.meses_mora} expensas vencidas. Algunas funciones están limitadas.
            </p>
          </div>
        </div>
      )}

      {/* Estadísticas */}
      <StatsGrid stats={statsData} />

      {/* Filtros */}
      {filtersOpen && (
        <div className="card-minimal animate-slide-down">
          <div className="grid md:grid-cols-4 grid-cols-2 gap-4">
            <Input
              label="Mes"
              type="month"
              value={filters.mes}
              onChange={(e) => setFilter('mes', e.target.value)}
            />
            
            <Select
              label="Pagado"
              value={filters.pagado}
              onChange={(e) => setFilter('pagado', e.target.value)}
              options={[
                { value: '', label: 'Todos' },
                { value: 'true', label: 'Sí' },
                { value: 'false', label: 'No' }
              ]}
            />
            
            <Select
              label="Vencida"
              value={filters.vencida}
              onChange={(e) => setFilter('vencida', e.target.value)}
              options={[
                { value: '', label: 'Todas' },
                { value: 'true', label: 'Sí' },
                { value: 'false', label: 'No' }
              ]}
            />
            
            <div className="flex items-end">
              <Button
                variant="secondary"
                icon={FilterX}
                onClick={clearFilters}
                className="w-full"
              >
                Limpiar
              </Button>
            </div>
          </div>
        </div>
      )}

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
        data={expensas}
        loading={loading}
        emptyMessage="No hay expensas registradas"
      />

      {/* Paginación */}
      {count > 0 && (
        <Pagination
          currentPage={page}
          totalCount={count}
          pageSize={pageSize}
          variant="compact"
          onPageChange={(p) => setPage(p)}
        />
      )}

      {/* Modal detalle */}
      {selectedExpensa && (
        <ExpensaDetailModal
          expensa={selectedExpensa}
          onClose={() => { setSelectedExpensa(null); setFeedback(null); }}
          onOpenPago={(exp) => { setSelectedExpensa(null); setPagoExpensa(exp); }}
        />
      )}

      {/* Modal registrar pago */}
      {pagoExpensa && (
        <RegistrarPagoModal
          expensa={pagoExpensa}
          isOpen={!!pagoExpensa}
          onClose={() => setPagoExpensa(null)}
          onPagoCreado={() => { setPagoExpensa(null); fetchExpensas(); fetchPerfil(); setFeedback({ type: 'success', message: 'Pago registrado correctamente' }); }}
        />
      )}
    </div>
  );
};

export default ExpensasList;