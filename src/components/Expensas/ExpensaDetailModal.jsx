import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import Button from '../common/Button';
import usePagos from '../../hooks/usePagos';
import { Loader2, RefreshCw, AlertTriangle, Check, Plus } from 'lucide-react';

// Modal de detalle de expensa (sin formulario de pago)
export default function ExpensaDetailModal({ expensa, onClose, onOpenPago }) {
  const [activeTab, setActiveTab] = useState('pendientes'); // 'pendientes' | 'verificados'
  const { pagos, verificados, pendientes, loading, fetchPagos } = usePagos(expensa?.id, { polling: true });

  const total = Number(expensa.total) || 0;
  const pagadoVer = Number(expensa.total_pagado_verificado) || 0;
  const pct = total > 0 ? Math.min(100, Math.round((pagadoVer / total) * 100)) : 0;
  const saldo = Number(expensa.saldo_pendiente) || 0;

  const estadoBadge = useMemo(() => {
    if (expensa.pagado) return <Badge variant="success" className="flex items-center gap-1"><Check className="w-3 h-3"/> Pagada</Badge>;
    if (expensa.esta_vencida) return <Badge variant="error">Vencida</Badge>;
    if (pct > 0 && pct < 100) return <Badge variant="info">Parcial</Badge>;
    return <Badge variant="warning">Pendiente</Badge>;
  }, [expensa.pagado, expensa.esta_vencida, pct]);

  useEffect(() => { /* no-op removed form related effect */ }, []);

  const titulo = `Expensa ${new Date(expensa.mes_referencia).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`;

  return (
    <Modal isOpen={true} onClose={onClose} title={titulo} size="lg">
      {/* Summary Bar */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {estadoBadge}
          <div className="flex flex-wrap gap-4 text-[11px] text-white/60">
            <span>Total <span className="text-white font-medium">${total.toFixed(2)}</span></span>
            <span>Verificado <span className="text-info-300 font-medium">${pagadoVer.toFixed(2)}</span></span>
            <span>Saldo <span className={`font-semibold ${saldo>0?'text-yellow-400':'text-emerald-400'}`}>${saldo.toFixed(2)}</span></span>
            <span>Vencimiento {expensa.fecha_vencimiento ? new Date(expensa.fecha_vencimiento).toLocaleDateString('es-ES') : '-'}</span>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[11px] mb-1 text-white/60">
            <span>Progreso</span>
            <span>{pct}%</span>
          </div>
            <div className="h-2.5 w-full rounded bg-white/10 overflow-hidden">
              <div className={`h-full ${pct===100?'bg-emerald-500':pct>0?'bg-info-400':'bg-white/20'}`} style={{ width: pct+'%' }} />
            </div>
        </div>
      </div>

      {/* Alert vencida */}
      {!expensa.pagado && expensa.esta_vencida && (
        <div className="alert-error mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 mt-0.5" />
          <div>
            <p className="font-semibold">Expensa vencida</p>
            <p className="text-white/70 text-xs">Regulariza el pago para evitar restricciones adicionales.</p>
          </div>
        </div>
      )}
      {/* Tabs pagos */}
      <div className="mb-5">
        <div className="flex gap-2 border-b border-white/10 mb-3">
          <button onClick={()=>setActiveTab('pendientes')} className={`px-3 py-1.5 text-xs rounded-t ${activeTab==='pendientes'?'bg-white/10 text-info-300':'text-white/50 hover:text-white/70'}`}>Pendientes ({pendientes.length})</button>
          <button onClick={()=>setActiveTab('verificados')} className={`px-3 py-1.5 text-xs rounded-t ${activeTab==='verificados'?'bg-white/10 text-info-300':'text-white/50 hover:text-white/70'}`}>Verificados ({verificados.length})</button>
          <div className="flex-1" />
          <Button variant="secondary" size="xs" icon={RefreshCw} onClick={fetchPagos} disabled={loading}>
            {loading ? 'Actualizando' : 'Refrescar'}
          </Button>
        </div>
        <div className="max-h-52 overflow-auto pr-1 space-y-2">
          {activeTab === 'pendientes' && (
            pendientes.length === 0 ? <p className="text-[11px] text-white/40">Sin pagos pendientes.</p> : (
              pendientes.map(p => (
                <div key={p.id} className="flex justify-between items-center text-[11px] bg-white/5 rounded px-2 py-1 border border-white/10">
                  <span className="truncate mr-2">{p.metodo_pago} - {p.comprobante || 's/comprobante'}</span>
                  <span className="font-medium text-yellow-400">${Number(p.monto).toFixed(2)}</span>
                </div>
              ))
            )
          )}
          {activeTab === 'verificados' && (
            verificados.length === 0 ? <p className="text-[11px] text-white/40">Sin pagos verificados todavía.</p> : (
              verificados.map(p => (
                <div key={p.id} className="flex justify-between items-center text-[11px] bg-white/5 rounded px-2 py-1 border border-white/10">
                  <span className="truncate mr-2">{p.metodo_pago} - {p.comprobante || 's/comprobante'}</span>
                  <span className="font-medium text-emerald-400">${Number(p.monto).toFixed(2)}</span>
                </div>
              ))
            )
          )}
        </div>
      </div>

      {!expensa.pagado && (
        <div className="mt-2 mb-2 flex justify-end">
          <Button variant="primary" size="sm" icon={Plus} onClick={() => onOpenPago?.(expensa)}>
            Registrar pago
          </Button>
        </div>
      )}
      {expensa.pagado && (<div className="text-center text-[11px] text-emerald-400 font-medium mb-2">Expensa completada</div>)}
    </Modal>
  );
}