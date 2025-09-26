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

  const footer = !expensa.pagado ? (
    <div className="flex justify-end">
      <Button variant="secondary" size="sm" icon={Plus} onClick={() => onOpenPago?.(expensa)}>
        Registrar pago
      </Button>
    </div>
  ) : (
    <div className="text-center text-[11px] text-emerald-400 font-medium">Expensa completada</div>
  );

  return (
    <Modal isOpen={true} onClose={onClose} title={titulo} size="lg" footer={footer}>
      {/* Summary / Status */}
      <section className="space-y-4 mb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {estadoBadge}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/60">
              <span>Total <span className="text-white font-medium">${total.toFixed(2)}</span></span>
              <span>Verificado <span className="text-sky-300 font-medium">${pagadoVer.toFixed(2)}</span></span>
              <span>Saldo <span className={`font-semibold ${saldo>0?'text-yellow-400':'text-emerald-400'}`}>${saldo.toFixed(2)}</span></span>
              <span>Vence {expensa.fecha_vencimiento ? new Date(expensa.fecha_vencimiento).toLocaleDateString('es-ES') : '-'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1 sm:mt-0">
            <Button variant="secondary" size="xs" icon={RefreshCw} onClick={fetchPagos} disabled={loading}>
              {loading ? '...' : 'Refrescar'}
            </Button>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[11px] mb-1 text-white/60">
            <span>Progreso</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
            <div className={`h-full transition-all duration-500 ${pct===100?'bg-emerald-500':pct>0?'bg-sky-400':'bg-white/20'}`} style={{ width: pct+'%' }} />
          </div>
        </div>
      </section>

      {!expensa.pagado && expensa.esta_vencida && (
        <div className="alert-error mb-4 flex items-start gap-3 animate-fade-in">
          <AlertTriangle className="w-5 h-5 mt-0.5" />
          <div>
            <p className="font-semibold leading-tight">Expensa vencida</p>
            <p className="text-white/70 text-xs">Regulariza el pago para evitar restricciones adicionales.</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-2">
        <div className="flex gap-1 rounded-lg p-1 bg-white/5 border border-white/10 text-[11px]">
          <button
            onClick={()=>setActiveTab('pendientes')}
            className={`flex-1 py-1.5 rounded-md font-medium transition ${activeTab==='pendientes' ? 'bg-white/15 text-sky-300 shadow-inner' : 'text-white/50 hover:text-white/80'}`}
            aria-selected={activeTab==='pendientes'}
            role="tab"
          >Pendientes ({pendientes.length})</button>
          <button
            onClick={()=>setActiveTab('verificados')}
            className={`flex-1 py-1.5 rounded-md font-medium transition ${activeTab==='verificados' ? 'bg-white/15 text-sky-300 shadow-inner' : 'text-white/50 hover:text-white/80'}`}
            aria-selected={activeTab==='verificados'}
            role="tab"
          >Verificados ({verificados.length})</button>
        </div>
      </div>

      <div className="relative -mx-1 px-1">
        <div className="space-y-2 max-h-[230px] sm:max-h-[300px] overflow-y-auto pr-1 custom-scrollbar" role="tabpanel">
          {activeTab === 'pendientes' && (
            pendientes.length === 0 ? <p className="text-[11px] text-white/40">Sin pagos pendientes.</p> : (
              pendientes.map(p => (
                <div key={p.id} className="flex items-center justify-between gap-3 text-[11px] bg-white/5 hover:bg-white/10 rounded-md px-2 py-1 border border-white/10 transition">
                  <span className="truncate flex-1 mr-2">{p.metodo_pago} - {p.comprobante || 's/comprobante'}</span>
                  <span className="font-medium text-yellow-400">${Number(p.monto).toFixed(2)}</span>
                </div>
              ))
            )
          )}
          {activeTab === 'verificados' && (
            verificados.length === 0 ? <p className="text-[11px] text-white/40">Sin pagos verificados todavía.</p> : (
              verificados.map(p => (
                <div key={p.id} className="flex items-center justify-between gap-3 text-[11px] bg-white/5 hover:bg-white/10 rounded-md px-2 py-1 border border-white/10 transition">
                  <span className="truncate flex-1 mr-2">{p.metodo_pago} - {p.comprobante || 's/comprobante'}</span>
                  <span className="font-medium text-emerald-400">${Number(p.monto).toFixed(2)}</span>
                </div>
              ))
            )
          )}
        </div>
      </div>
    </Modal>
  );
}