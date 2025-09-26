import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import { DollarSign } from 'lucide-react';
import usePagos from '../../hooks/usePagos';
import { useAuth } from '../../context/AuthContext';

const metodosOptions = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'cheque', label: 'Cheque' }
];

export default function RegistrarPagoModal({ expensa, isOpen, onClose, onPagoCreado }) {
  const { crearPago, creating, error } = usePagos(expensa?.id, { polling: false });
  const { isPropietario } = useAuth();
  const [monto, setMonto] = useState('');
  const [metodo, setMetodo] = useState('transferencia');
  const [fechaPago, setFechaPago] = useState(() => new Date().toISOString().slice(0,10));
  const [comprobante, setComprobante] = useState('');
  const [notas, setNotas] = useState('');
  const [errorLocal, setErrorLocal] = useState(null);

  useEffect(() => {
    if (isOpen && expensa) {
      setMonto(expensa.saldo_pendiente || '');
      setMetodo('transferencia');
      setFechaPago(new Date().toISOString().slice(0,10));
      setComprobante('');
      setNotas('');
      setErrorLocal(null);
    }
  }, [isOpen, expensa]);

  if (!expensa) return null;

  const saldo = parseFloat(expensa.saldo_pendiente || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorLocal(null);
    const montoFloat = parseFloat(monto);
    if (isNaN(montoFloat) || montoFloat <= 0) { setErrorLocal('Monto inválido'); return; }
    if (montoFloat > saldo) { setErrorLocal(`Excede saldo pendiente (${saldo.toFixed(2)})`); return; }

    const payload = {
      expensa: expensa.id,
      fecha_pago: fechaPago,
      monto: montoFloat.toFixed(2),
      metodo_pago: metodo,
      comprobante: comprobante || undefined,
      notas: notas || undefined,
    };

    const res = await crearPago(payload);
    if (res.success) {
      if (onPagoCreado) onPagoCreado();
      onClose();
    } else {
      setErrorLocal(res.error || 'Error al crear pago');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={isPropietario ? 'full' : 'xl'}
      title={`Registrar pago - ${new Date(expensa.mes_referencia).toLocaleDateString('es-ES', { month:'long', year:'numeric' })}`}
      className={isPropietario ? 'payment-owner-modal' : ''}
    >
      {/* Resumen grande */}
      <div className="grid gap-4 sm:grid-cols-2 mb-8 text-sm">
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex flex-col gap-1">
          <span className="text-white/50 text-xs uppercase tracking-wide">Saldo Pendiente</span>
          <span className={`font-bold text-lg ${saldo>0?'text-yellow-300':'text-emerald-400'}`}>${saldo.toFixed(2)}</span>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex flex-col gap-1">
          <span className="text-white/50 text-xs uppercase tracking-wide">Total</span>
            <span className="font-semibold text-white text-base">${parseFloat(expensa.total || expensa.importe_total || 0).toFixed(2)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 text-sm">
        {/* Monto + botones rápidos */}
        <div className="flex flex-col gap-3">
          <div className="flex items-end gap-4 flex-wrap">
            <div className="min-w-[200px] flex-1">
              <Input
                label="Monto a pagar"
                type="number"
                step="0.01"
                value={monto}
                onChange={(e)=>setMonto(e.target.value)}
                icon={DollarSign}
                required
              />
            </div>
            <div className="flex gap-2 items-center text-xs">
              <span className="text-white/40">Rápido:</span>
              <button type="button" onClick={()=>setMonto(saldo.toFixed(2))} className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition text-[11px]">Saldo</button>
              <button type="button" onClick={()=>setMonto((saldo/2).toFixed(2))} className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition text-[11px]">50%</button>
              <button type="button" onClick={()=>setMonto((saldo*0.25).toFixed(2))} className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition text-[11px]">25%</button>
            </div>
          </div>
          <p className="text-white/50 text-xs -mt-1">Ingresa el monto o usa un atajo. No puede superar el saldo pendiente.</p>
        </div>

        {/* Grid principal */}
        <div className="grid md:grid-cols-3 gap-6">
          <Select
            label="Método"
            value={metodo}
            onChange={(e)=>setMetodo(e.target.value)}
            options={metodosOptions}
            required
          />
          <Input
            label="Fecha"
            type="date"
            value={fechaPago}
            max={new Date().toISOString().slice(0,10)}
            onChange={(e)=>setFechaPago(e.target.value)}
            required
          />
          <Input
            label="Comprobante"
            placeholder="Opcional"
            value={comprobante}
            onChange={(e)=>setComprobante(e.target.value)}
          />
        </div>

        {/* Notas */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">Notas (opcional)</label>
          <textarea
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-primary-500 resize-none min-h-[90px] placeholder:text-white/30"
            value={notas}
            onChange={(e)=>setNotas(e.target.value)}
            placeholder="Información adicional del pago"
          />
        </div>

        {/* Errores */}
        {(errorLocal || error) && (
          <div className="space-y-2">
            {errorLocal && <div className="alert-error text-sm">{errorLocal}</div>}
            {error && !errorLocal && <div className="alert-error text-sm">{error}</div>}
          </div>
        )}

        {/* Acciones */}
        <div className="flex justify-end gap-3 pt-2 mobile-sticky-actions">
          <Button variant="secondary" type="button" onClick={onClose} disabled={creating}>
            Cancelar
          </Button>
          <Button type="submit" loading={creating}>
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
