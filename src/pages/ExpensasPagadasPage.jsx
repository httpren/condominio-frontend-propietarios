import React, { useEffect } from 'react';
import useExpensas from '../hooks/useExpensas';
import PageHeader from '../components/common/PageHeader';
import Table from '../components/common/Table';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { Calendar, Check, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Página histórica de expensas pagadas (vista propietario)
const ExpensasPagadasPage = () => {
  const { expensas, loading, error, filters, setFilter, fetchExpensas, getEstado } = useExpensas();
  const navigate = useNavigate();

  // Forzar filtro pagado=true sólo en esta página
  useEffect(() => {
    if (filters.pagado !== 'true') setFilter('pagado', 'true');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = [
    {
      key: 'mes_referencia',
      header: 'Mes',
      render: (value) => new Date(value).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
    },
    {
      key: 'total',
      header: 'Total',
      render: (value) => `$${Number(value).toFixed(2)}`,
    },
    {
      key: 'fecha_vencimiento',
      header: 'Vencimiento',
      render: (value) => value ? new Date(value).toLocaleDateString('es-ES') : '-',
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (_, row) => (
        <Badge variant="success" className="inline-flex items-center gap-1">
          <Check className="w-3 h-3" /> Pagada
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Expensas Pagadas"
        description="Historial de expensas ya canceladas"
        icon={Calendar}
        actions={(
          <Button variant="secondary" size="sm" onClick={() => navigate('/expensas')}>
            <ArrowLeft className="w-4 h-4" /> Volver
          </Button>
        )}
      />

      {error && <div className="alert-error">{error}</div>}

      <Table
        columns={columns}
        data={expensas}
        loading={loading}
        emptyMessage="No hay expensas pagadas aún"
      />
    </div>
  );
};

export default ExpensasPagadasPage;