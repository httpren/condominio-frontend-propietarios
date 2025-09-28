import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DollarSign, ArrowLeft, CreditCard, ShieldCheck, Clock, CheckCircle2, Activity, Info, Lock, TrendingUp } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Badge from '../components/common/Badge';
import StatsGrid from '../components/common/StatsGrid';
import useExpensas from '../hooks/useExpensas';
import usePagos from '../hooks/usePagos';

// Opciones de método de pago
const metodosOptions = [
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'cheque', label: 'Cheque' },
];

// Utilidad para formatear dinero
const money = (v) => `$${Number(v || 0).toFixed(2)}`;

export default function CrearPagoPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const expensaIdParam = searchParams.get('expensa');

  // Hooks de expensas
  const { expensas, fetchExpensas, fetchExpensaDetail, getEstado, computeStats } = useExpensas();
  const [selectedExpensa, setSelectedExpensa] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [detalleError, setDetalleError] = useState(null);

  // Pago state
  const [monto, setMonto] = useState('');
  const [metodo, setMetodo] = useState('transferencia');
  const [fechaPago, setFechaPago] = useState(() => new Date().toISOString().slice(0,10));
  const [comprobante, setComprobante] = useState('');
  const [notas, setNotas] = useState('');
  const [feedback, setFeedback] = useState(null); // {type, message}
  const [errorLocal, setErrorLocal] = useState(null);
  const [submittedPago, setSubmittedPago] = useState(null); // datos del pago creado para pantalla de confirmación

  // Cargar expensas abiertas si están vacías
  useEffect(() => { fetchExpensas(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Detalle de la expensa seleccionada (cuando hay param o selección manual)
  useEffect(() => {
    const loadDetalle = async (id) => {
      if (!id) return;
      setLoadingDetalle(true); setDetalleError(null);
      const res = await fetchExpensaDetail(id);
      if (res.success) {
        setSelectedExpensa(res.data);
        // Prefill monto con saldo si existe
        const saldo = parseFloat(res.data.saldo_pendiente || 0) || 0;
        setMonto(saldo > 0 ? saldo.toFixed(2) : '');
      } else {
        setDetalleError(res.error || 'No se pudo cargar la expensa');
      }
      setLoadingDetalle(false);
    };
    if (expensaIdParam) loadDetalle(expensaIdParam);
  }, [expensaIdParam, fetchExpensaDetail]);

  // Hook de pagos (solo cuando hay expensa)
  const { pagos, verificados, pendientes, crearPago, creating, error: errorPago } = usePagos(selectedExpensa?.id, { auto: true, polling: true });

  const saldoPendiente = useMemo(() => parseFloat(selectedExpensa?.saldo_pendiente || 0) || 0, [selectedExpensa]);
  const totalExpensa = useMemo(() => parseFloat(selectedExpensa?.total || selectedExpensa?.importe_total || 0) || 0, [selectedExpensa]);
  const pagadoVerificado = useMemo(() => parseFloat(selectedExpensa?.total_pagado_verificado || 0) || 0, [selectedExpensa]);
  const progresoPct = totalExpensa > 0 ? Math.min(100, Math.round((pagadoVerificado / totalExpensa) * 100)) : 0;

  const statsGlobal = computeStats();

  const estado = selectedExpensa ? getEstado(selectedExpensa) : null;

  const handleSelectExpensa = (id) => {
    setSearchParams(id ? { expensa: id } : {});
    setSelectedExpensa(null);
    setSubmittedPago(null);
    setFeedback(null);
  };

  const quickSet = (fraction) => {
    if (!saldoPendiente) return;
    if (fraction === 'saldo') {
      setMonto(saldoPendiente.toFixed(2));
    } else {
      setMonto((saldoPendiente * fraction).toFixed(2));
    }
  };

  const validate = () => {
    setErrorLocal(null);
    if (!selectedExpensa) return 'Selecciona una expensa';
    if (!monto) return 'Ingresa un monto';
    const m = parseFloat(monto);
    if (isNaN(m) || m <= 0) return 'Monto inválido';
    if (m > saldoPendiente) return `El monto excede el saldo pendiente (${saldoPendiente.toFixed(2)})`;
    if (!metodo) return 'Selecciona un método';
    if (!fechaPago) return 'Fecha requerida';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setErrorLocal(err); return; }
    const payload = {
      expensa: selectedExpensa.id,
      fecha_pago: fechaPago,
      monto: parseFloat(monto).toFixed(2),
      metodo_pago: metodo,
      comprobante: comprobante || undefined,
      notas: notas || undefined,
    };
    const res = await crearPago(payload);
    if (res.success) {
      setSubmittedPago(res.data);
      setFeedback({ type: 'success', message: 'Pago registrado correctamente. Queda pendiente de verificación.' });
      // Limpiar campos menos método (para posibles múltiples pagos)
      setComprobante(''); setNotas('');
    } else {
      setErrorLocal(res.error || 'Error al registrar pago');
    }
  };

  // Lista de expensas elegibles (saldo > 0 o no pagadas)
  const expensasElegibles = useMemo(() => expensas.filter(e => !e.pagado || parseFloat(e.saldo_pendiente || 0) > 0), [expensas]);

  const statsData = [
    { title: 'Pendientes', value: statsGlobal.pendientes, icon: Clock, variant: 'warning' },
    { title: 'Vencidas', value: statsGlobal.vencidas, icon: Activity, variant: 'error' },
    { title: 'Pagadas', value: statsGlobal.pagadas, icon: CheckCircle2, variant: 'success' },
    { title: 'Saldo', value: money(statsGlobal.saldoAcumulado), icon: DollarSign, variant: statsGlobal.saldoAcumulado > 0 ? 'info' : 'success' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Pasarela de Pago"
        description="Registra y visualiza los pagos de tus expensas"
        icon={DollarSign}
        actions={
          <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/expensas')}>
            Volver
          </Button>
        }
      />

      <StatsGrid stats={statsData} />

      {/* Selección de expensa */}
      {!selectedExpensa && (
        <div className="card-minimal animate-slide-down">
          <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary-400"/> Selecciona la expensa a pagar</h3>
          {expensasElegibles.length === 0 && (
            <p className="text-white/60 text-sm">No hay expensas pendientes de pago.</p>
          )}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {expensasElegibles.map(e => {
              const saldo = parseFloat(e.saldo_pendiente || 0) || 0;
              const total = parseFloat(e.total || 0) || 0;
              const verif = parseFloat(e.total_pagado_verificado || 0) || 0;
              const pct = total > 0 ? Math.min(100, Math.round((verif / total) * 100)) : 0;
              return (
                <button
                  key={e.id}
                  onClick={() => handleSelectExpensa(e.id)}
                  className="group relative rounded-lg bg-white/5 border border-white/10 p-4 text-left hover:border-primary-500/60 hover:bg-white/10 transition focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs uppercase tracking-wide text-white/40 font-medium">{new Date(e.mes_referencia).toLocaleDateString('es-ES', { month:'long', year:'numeric' })}</span>
                    <Badge variant={e.pagado ? 'success' : (e.esta_vencida ? 'error' : (saldo > 0 && verif > 0 ? 'info' : 'warning'))}>
                      {getEstado(e)}
                    </Badge>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-white font-semibold text-base">{money(total)}</span>
                    {saldo > 0 && (
                      <span className="text-[11px] text-yellow-300 font-medium">Saldo {money(saldo)}</span>
                    )}
                  </div>
                  <div className="h-1.5 rounded bg-white/10 overflow-hidden mt-3">
                    <div className={`h-full ${pct===100?'bg-emerald-500':pct>0?'bg-sky-400':'bg-white/20'}`} style={{ width:pct+'%' }} />
                  </div>
                  <div className="mt-2 flex justify-between text-[10px] text-white/40">
                    <span>Progreso {pct}%</span>
                    <span>Verificado {money(verif)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Pantalla de pago */}
      {selectedExpensa && (
        <div className="grid lg:grid-cols-3 gap-6 items-start">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card-minimal relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none opacity-[0.07]" style={{background:"radial-gradient(circle at 30% 20%, #1d8cf880, transparent 60%)"}} />
              <div className="relative">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-white font-semibold text-xl flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary-400"/> Pago de expensa</h3>
                    <p className="text-white/50 text-sm">{new Date(selectedExpensa.mes_referencia).toLocaleDateString('es-ES', { month:'long', year:'numeric' })}</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="bg-white/5 rounded-lg px-4 py-2 text-center min-w-[110px]">
                      <span className="block text-[10px] uppercase tracking-wide text-white/40">Saldo</span>
                      <span className={`font-semibold text-sm ${saldoPendiente>0?'text-yellow-300':'text-emerald-400'}`}>{money(saldoPendiente)}</span>
                    </div>
                    <div className="bg-white/5 rounded-lg px-4 py-2 text-center min-w-[110px]">
                      <span className="block text-[10px] uppercase tracking-wide text-white/40">Total</span>
                      <span className="font-semibold text-sm text-white">{money(totalExpensa)}</span>
                    </div>
                  </div>
                </div>
                <div className="h-2 rounded bg-white/10 overflow-hidden mb-8">
                  <div className={`h-full transition-all duration-500 ${progresoPct===100?'bg-emerald-500':progresoPct>0?'bg-sky-400':'bg-white/20'}`} style={{ width: progresoPct+'%' }} />
                </div>

                {/* Feedback */}
                {feedback && (
                  <div className={`mb-6 ${feedback.type==='success'?'alert-success':'alert-error'}`}>{feedback.message}</div>
                )}

                {submittedPago && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 mb-6 animate-scale-in">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-semibold text-emerald-300">Pago registrado</p>
                        <p className="text-white/60 mt-0.5">Monto {money(submittedPago.monto)} • Método {submittedPago.metodo_pago} • Estado: pendiente de verificación</p>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                  {/* Monto y atajos */}
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-end gap-4">
                      <div className="min-w-[180px] flex-1">
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
                        <button type="button" onClick={()=>quickSet('saldo')} className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition text-[11px]">Saldo</button>
                        <button type="button" onClick={()=>quickSet(0.5)} className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition text-[11px]">50%</button>
                        <button type="button" onClick={()=>quickSet(0.25)} className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition text-[11px]">25%</button>
                      </div>
                    </div>
                    <p className="text-white/50 text-xs -mt-1">El monto no puede superar el saldo pendiente. Puedes registrar varios pagos parciales.</p>
                  </div>

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

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Notas (opcional)</label>
                    <textarea
                      className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-primary-500 resize-none min-h-[100px] placeholder:text-white/30"
                      value={notas}
                      onChange={(e)=>setNotas(e.target.value)}
                      placeholder="Información adicional del pago"
                    />
                  </div>

                  {(errorLocal || errorPago) && (
                    <div className="space-y-2">
                      {errorLocal && <div className="alert-error text-sm">{errorLocal}</div>}
                      {errorPago && !errorLocal && <div className="alert-error text-sm">{errorPago}</div>}
                    </div>
                  )}

                  <div className="flex flex-wrap justify-between gap-3 pt-2">
                    <div className="flex gap-2 order-2 sm:order-1">
                      <Button type="button" variant="secondary" onClick={()=>handleSelectExpensa(null)} disabled={creating}>Cambiar expensa</Button>
                      <Button type="button" variant="secondary" onClick={()=>navigate('/expensas')} disabled={creating}>Ir a Expensas</Button>
                    </div>
                    <div className="flex gap-3 order-1 sm:order-2">
                      <Button type="submit" loading={creating} disabled={estado==='pagada' || saldoPendiente<=0}>
                        {estado==='pagada'?'Expensa pagada':'Registrar Pago'}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Historial de pagos */}
            <div className="card-minimal">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-primary-400"/>
                <h4 className="font-semibold text-white text-base">Historial de Pagos</h4>
              </div>
              {(!pagos || pagos.length===0) && <p className="text-sm text-white/50">Aún no se registran pagos para esta expensa.</p>}
              <div className="space-y-3">
                {pagos.map(p => (
                  <div key={p.id} className="flex items-start justify-between bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="text-xs">
                      <p className="font-medium text-white flex items-center gap-2">{money(p.monto)} {p.verificado ? <Badge variant="success">verificado</Badge> : <Badge variant="warning">pendiente</Badge>}</p>
                      <p className="text-white/50 mt-0.5">{new Date(p.fecha_pago || p.created_at).toLocaleDateString('es-ES')} • {p.metodo_pago}</p>
                      {p.comprobante && <p className="text-[11px] text-white/40 break-all">Comprobante: {p.comprobante}</p>}
                      {p.notas && <p className="text-[11px] text-white/40 mt-0.5">{p.notas}</p>}
                    </div>
                    <div className="text-[10px] text-white/40 flex flex-col items-end">
                      <span>{new Date(p.created_at).toLocaleTimeString('es-ES',{hour:'2-digit', minute:'2-digit'})}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Columna lateral */}
          <div className="space-y-6">
            <div className="card-minimal">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-5 h-5 text-primary-400" />
                <h4 className="font-semibold text-white">Resumen</h4>
              </div>
              <ul className="text-xs space-y-2 text-white/60">
                <li className="flex justify-between"><span>Total</span><span className="text-white font-medium">{money(totalExpensa)}</span></li>
                <li className="flex justify-between"><span>Pagado Verificado</span><span className="text-emerald-300 font-medium">{money(pagadoVerificado)}</span></li>
                <li className="flex justify-between"><span>Saldo</span><span className={`${saldoPendiente>0?'text-yellow-300':'text-emerald-400'} font-medium`}>{money(saldoPendiente)}</span></li>
                <li className="flex justify-between"><span>Estado</span><span className="capitalize">{estado}</span></li>
              </ul>
              <div className="mt-5 text-[11px] leading-relaxed text-white/40 space-y-2">
                <p>Los pagos quedan en estado <span className="text-yellow-200">pendiente</span> hasta que la administración los verifique.</p>
                <p>Puedes registrar varios pagos parciales hasta completar el saldo.</p>
              </div>
            </div>

            <div className="card-minimal">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-primary-400" />
                <h4 className="font-semibold text-white">Consejos</h4>
              </div>
              <ul className="text-xs space-y-2 text-white/60 list-disc pl-4">
                <li>Para agilizar la verificación incluye el comprobante si es transferencia.</li>
                <li>El método tarjeta puede tener recargos gestionados por la administración.</li>
                <li>Verifica que el importe no exceda el saldo.</li>
              </ul>
            </div>

            <div className="card-minimal bg-gradient-to-br from-white/5 to-white/10 border-primary-500/30 relative overflow-hidden">
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-primary-500/10 blur-2xl" />
              <div className="flex items-center gap-2 mb-3 relative">
                <ShieldCheck className="w-5 h-5 text-primary-400" />
                <h4 className="font-semibold text-white">Seguridad</h4>
              </div>
              <div className="text-[11px] text-white/50 space-y-3 relative">
                <p><Lock className="inline w-3.5 h-3.5 mr-1 text-primary-400"/> Datos transmitidos mediante canales seguros.</p>
                <p>La administración valida cada pago para evitar fraudes.</p>
                <p>Conserva el comprobante hasta su verificación.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {detalleError && (
        <div className="alert-error">{detalleError}</div>
      )}
      {loadingDetalle && selectedExpensa === null && expensaIdParam && (
        <div className="text-white/50 text-sm">Cargando detalle...</div>
      )}
    </div>
  );
}
