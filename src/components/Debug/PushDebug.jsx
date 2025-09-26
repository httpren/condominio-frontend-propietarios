import React, { useState } from 'react';
import { registrarPush, unSubscribeAll, getUserSubscriptions, checkSubscriptionValidity } from '../../utils/push';

// Componente de diagnóstico avanzado para Web Push
// Muestra estado local, backend y permite forzar acciones.
const PushDebug = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [backendSubs, setBackendSubs] = useState(null);
  const [localSub, setLocalSub] = useState(null);
  const [validBackendMatch, setValidBackendMatch] = useState(null);
  const [vapidKey, setVapidKey] = useState(import.meta.env.VITE_VAPID_PUBLIC_KEY || '');

  const log = (msg, data) => {
    setLogs(l => [{ ts: new Date().toISOString(), msg, data }, ...l.slice(0, 499)]); // máx 500
    // eslint-disable-next-line no-console
    console.debug('[PushDebug]', msg, data || '');
  };

  const refreshLocal = async () => {
    if (!('serviceWorker' in navigator)) {
      log('SW no soportado');
      return;
    }
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setLocalSub(sub);
      if (sub) {
        const j = sub.toJSON();
        log('Suscripción local', { endpoint: sub.endpoint, keys: j.keys });
      } else {
        log('No hay suscripción local');
      }
    } catch (e) {
      log('Error obteniendo suscripción local', e.message);
    }
  };

  const refreshBackend = async () => {
    setLoading(true);
    try {
      const r = await getUserSubscriptions();
      if (r.success) {
        const raw = r.data;
        const list = Array.isArray(raw?.results) ? raw.results : (Array.isArray(raw) ? raw : []);
        setBackendSubs(list);
        log('Subs backend', list.map(s => ({ id: s.id, endpoint: s.endpoint.slice(0, 40) + '...' })));
      } else {
        log('Error backend', r.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const testValidity = async () => {
    const ok = await checkSubscriptionValidity();
    setValidBackendMatch(ok);
    log('Validez (backend reconoce suscripción local): ' + ok);
  };

  const doRegister = async () => {
    if (!vapidKey) {
      log('Clave VAPID vacía');
      return;
    }
    setLoading(true);
    try {
      const r = await registrarPush(vapidKey, { forceResetOn400: true });
      log('Resultado registrarPush', r);
    } finally {
      setLoading(false);
      refreshLocal();
      refreshBackend();
      testValidity();
    }
  };

  const rawSubscribe = async () => {
    setLoading(true);
    try {
      if (!('serviceWorker' in navigator)) return log('Sin serviceWorker');
      const reg = await navigator.serviceWorker.ready;
      const key = vapidKey.trim();
      const toUint8 = (b64) => {
        const pad = '='.repeat((4 - b64.length % 4) % 4);
        const base64 = (b64 + pad).replace(/-/g, '+').replace(/_/g, '/');
        const raw = atob(base64);
        const out = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
        return out;
      };
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        log('Ya existe una suscripción local antes de rawSubscribe');
      }
      log('Intentando pushManager.subscribe() crudo ...');
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toUint8(key) });
      log('rawSubscribe éxito', sub.toJSON());
    } catch (e) {
      log('rawSubscribe error', { name: e.name, message: e.message, stack: e.stack });
      try {
        const state = await navigator.permissions.query({ name: 'notifications' });
        log('Permisos notifications state tras fallo', state.state);
      } catch(_) {}
      try {
        const maybePush = await navigator.permissions.query({ name: 'push', userVisibleOnly: true });
        log('Permisos push state', maybePush.state);
      } catch(_) { log('Permisos push no soportado en permissions API'); }
    } finally {
      setLoading(false);
      refreshLocal();
    }
  };

  const doUnsub = async () => {
    setLoading(true);
    try {
      await unSubscribeAll();
      log('Desuscripción completa solicitada');
    } finally {
      setLoading(false);
      refreshLocal();
      refreshBackend();
      testValidity();
    }
  };

  const exportInfo = () => {
    const payload = {
      vapidKey,
      localSubscription: localSub ? localSub.toJSON() : null,
      backendSubs,
      validBackendMatch,
      userAgent: navigator.userAgent,
      origin: location.origin,
      secureContext: window.isSecureContext,
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    log('Información copiada al portapapeles');
  };

  return (
    <div style={{ padding: '1rem', border: '1px solid #933', borderRadius: 8, background: '#1f1f22', color: '#f5f5f5', fontFamily: 'system-ui', maxWidth: 900, margin: '1rem auto' }}>
      <h2 style={{ marginTop: 0 }}>🔍 Diagnóstico Push</h2>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 260px' }}>
          <label style={{ display: 'block', fontSize: 12, opacity: 0.8 }}>VAPID Public Key</label>
          <input value={vapidKey} onChange={e => setVapidKey(e.target.value)} style={{ width: '100%' }} />
          <small style={{ opacity: 0.7 }}>Len: {vapidKey?.length || 0}</small>
        </div>
        <div style={{ flex: '1 1 180px' }}>
          <label style={{ display: 'block', fontSize: 12, opacity: 0.8 }}>Contexto</label>
          <div style={{ fontSize: 12 }}>secure: {String(window.isSecureContext)}</div>
          <div style={{ fontSize: 12 }}>origin: {location.origin}</div>
        </div>
      </div>
      <div style={{ margin: '0.75rem 0', display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
        <button disabled={loading} onClick={refreshLocal}>Local</button>
        <button disabled={loading} onClick={refreshBackend}>Backend</button>
        <button disabled={loading} onClick={testValidity}>Validez</button>
        <button disabled={loading} onClick={doRegister} style={{ background: '#2563eb', color: '#fff' }}>Registrar</button>
        <button disabled={loading} onClick={doUnsub} style={{ background: '#933', color: '#fff' }}>Desuscribir</button>
        <button disabled={loading} onClick={rawSubscribe} style={{ background: '#047857', color: '#fff' }}>Raw Subscribe</button>
        <button disabled={loading} onClick={exportInfo}>Copiar Info</button>
      </div>
      <div style={{ fontSize: 12, marginBottom: '.5rem' }}>
        <strong>Subs backend:</strong> {backendSubs ? backendSubs.length : '—'} | <strong>Match válido:</strong> {validBackendMatch === null ? '—' : String(validBackendMatch)}
      </div>
      <div style={{ maxHeight: 250, overflow: 'auto', background: '#111', padding: '.5rem', fontSize: 12 }}>
        {logs.map((l, i) => (
          <div key={i} style={{ borderBottom: '1px solid #333', padding: '.25rem 0' }}>
            <div style={{ color: '#9ca3af' }}>{l.ts}</div>
            <div>{l.msg}</div>
            {l.data !== undefined && (
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>{
                typeof l.data === 'string' ? l.data : JSON.stringify(l.data, null, 2)
              }</pre>
            )}
          </div>
        ))}
        {logs.length === 0 && <div style={{ opacity: 0.6 }}>Sin eventos aún.</div>}
      </div>
    </div>
  );
};

export default PushDebug;
