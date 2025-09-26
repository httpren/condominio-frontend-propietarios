import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { CreditCard, Calendar, DollarSign } from 'lucide-react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

/**
 * Modal para registrar pago de una expensa.
 */
const PaymentModal = ({ expensa, onClose, onSubmit, saving }) => {
  const [monto, setMonto] = useState(expensa?.saldo_pendiente || '');
  const [metodo, setMetodo] = useState('transferencia');
  const [fechaPago, setFechaPago] = useState(() => new Date().toISOString().slice(0,10));
  const [comprobante, setComprobante] = useState('');
  const [notas, setNotas] = useState('');
  const [errorLocal, setErrorLocal] = useState(null);

  if (!expensa) return null;

  const saldo = parseFloat(expensa.saldo_pendiente || 0) || 0;

  const metodosOptions = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'transferencia', label: 'Transferencia' },
    { value: 'tarjeta', label: 'Tarjeta' },
    { value: 'cheque', label: 'Cheque' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorLocal(null);
    
    const montoFloat = parseFloat(monto);
    if (isNaN(montoFloat) || montoFloat <= 0) {
      setErrorLocal('Ingrese un monto válido mayor a 0');
      return;
    }
    
    if (montoFloat > saldo) {
      setErrorLocal(`El monto excede el saldo pendiente (${saldo.toFixed(2)})`);
      return;
    }
    
    onSubmit({
      expensa: expensa.id,
      fecha_pago: fechaPago, // formato YYYY-MM-DD requerido por backend (DateField)
      monto: montoFloat.toFixed(2),
      metodo_pago: metodo,
      comprobante: comprobante || undefined,
      notas: notas || undefined,
    });
  };

  const footer = (
    <div className="flex justify-end gap-3">
      <Button
        variant="secondary"
        onClick={onClose}
        disabled={saving}
        type="button"
      >
        Cancelar
      </Button>
      <Button
        type="submit"
        loading={saving}
        icon={DollarSign}
        form="payment-form"
      >
        Registrar Pago
      </Button>
    </div>
  );

  return (
    <Modal isOpen={true} onClose={onClose} title="Registrar Pago" size="sm" footer={footer}>
      <div className="mb-5">
        <div className="grid grid-cols-2 gap-3 text-[11px] bg-white/5 border border-white/10 rounded-lg p-3">
          <div className="col-span-2 flex items-center justify-between gap-2 pb-1 border-b border-white/10 mb-1">
            <span className="text-white/50">Mes</span>
            <span className="text-white font-medium truncate max-w-[60%]">
              {new Date(expensa.mes_referencia).toLocaleDateString('es-ES', { month:'long', year:'numeric' })}
            </span>
          </div>
          <div className="flex flex-col bg-white/5 rounded-md p-2">
            <span className="text-white/50">Total</span>
            <span className="text-white font-semibold text-sm">${Number(expensa.total).toFixed(2)}</span>
          </div>
            <div className="flex flex-col bg-white/5 rounded-md p-2">
            <span className="text-white/50">Saldo</span>
            <span className={`font-semibold text-sm ${saldo>0?'text-yellow-400':'text-emerald-400'}`}>${saldo.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <form id="payment-form" onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Monto a pagar"
          type="number"
          step="0.01"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          placeholder="0.00"
          icon={DollarSign}
          required
        />

        <Select
          label="Método de pago"
          value={metodo}
          onChange={(e) => setMetodo(e.target.value)}
          options={metodosOptions}
          required
        />

        <Input
          label="Fecha de pago"
          type="date"
          value={fechaPago}
          max={new Date().toISOString().slice(0,10)}
          onChange={(e) => setFechaPago(e.target.value)}
          required
        />

        <Input
          label="Comprobante (opcional)"
          value={comprobante}
          onChange={(e) => setComprobante(e.target.value)}
          placeholder="Número de referencia o comprobante"
        />

        <div>
          <label className="block text-xs font-medium text-white/70 mb-1">Notas (opcional)</label>
          <textarea
            className="w-full rounded bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 resize-none min-h-[70px]"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Detalle adicional del pago"
          />
        </div>

        {errorLocal && (
          <div className="alert-error text-xs leading-snug">
            {errorLocal}
          </div>
        )}

      </form>
    </Modal>
  );
};

PaymentModal.propTypes = {
  expensa: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};

export default PaymentModal;
