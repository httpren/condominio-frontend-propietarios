import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FileDown, Loader2, AlertCircle } from 'lucide-react';
import Button from '../common/Button';
import Select from '../common/Select';
import Input from '../common/Input';

/**
 * Componente de formulario para generar reportes.
 */
export default function ReportGenerator({ onGenerate, loading, error }) {
  const [tipo, setTipo] = useState('expensas');
  const [formato, setFormato] = useState('csv');
  const [pagado, setPagado] = useState('');
  const [vencida, setVencida] = useState('');
  const [mes, setMes] = useState('');
  const [expensaId, setExpensaId] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const filtros = {};
    if (tipo === 'expensas') {
      if (pagado) filtros.pagado = pagado;
      if (vencida) filtros.vencida = vencida;
      if (mes) filtros.mes = mes;
    } else if (tipo === 'pagos') {
      if (expensaId) filtros.expensaId = expensaId;
      if (desde) filtros.desde = desde;
      if (hasta) filtros.hasta = hasta;
    }
    onGenerate({ tipo, formato, filtros });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <Select
          label="Tipo"
          value={tipo}
          onChange={(e)=>setTipo(e.target.value)}
          options={[
            { value: 'expensas', label: 'Expensas' },
            { value: 'pagos', label: 'Pagos' },
            { value: 'reservas', label: 'Reservas' },
            { value: 'visitas', label: 'Visitas' },
          ]}
          required
        />
        <Select
          label="Formato"
          value={formato}
          onChange={(e)=>setFormato(e.target.value)}
          options={[
            { value: 'csv', label: 'CSV' },
            { value: 'pdf', label: 'PDF' },
          ]}
          required
        />
        {tipo === 'expensas' && (
          <Input
            label="Mes (YYYY-MM)"
            type="month"
            value={mes}
            onChange={(e)=>setMes(e.target.value)}
          />
        )}
        {tipo === 'expensas' && (
          <Select
            label="Pagado"
            value={pagado}
            onChange={(e)=>setPagado(e.target.value)}
            options={[
              { value: '', label: 'Todos' },
              { value: 'true', label: 'Sí' },
              { value: 'false', label: 'No' },
            ]}
          />
        )}
        {tipo === 'expensas' && (
          <Select
            label="Vencida"
            value={vencida}
            onChange={(e)=>setVencida(e.target.value)}
            options={[
              { value: '', label: 'Todas' },
              { value: 'true', label: 'Sí' },
              { value: 'false', label: 'No' },
            ]}
          />
        )}
        {tipo === 'pagos' && (
          <Input
            label="ID Expensa (opcional)"
            value={expensaId}
            onChange={(e)=>setExpensaId(e.target.value)}
            placeholder="Expensa específica"
          />
        )}
        {tipo === 'pagos' && (
          <Input
            label="Desde"
            type="date"
            value={desde}
            onChange={(e)=>setDesde(e.target.value)}
          />
        )}
        {tipo === 'pagos' && (
          <Input
            label="Hasta"
            type="date"
            value={hasta}
            onChange={(e)=>setHasta(e.target.value)}
          />
        )}
      </div>
      <div className="flex justify-end">
        <Button type="submit" variant="secondary" disabled={loading} icon={loading ? Loader2 : FileDown}>
          {loading ? 'Generando...' : 'Generar'}
        </Button>
      </div>
      {error && (
        <div className="alert-error flex items-center gap-2 text-sm"><AlertCircle className="w-4 h-4" />{error}</div>
      )}
    </form>
  );
}

ReportGenerator.propTypes = {
  onGenerate: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
};
