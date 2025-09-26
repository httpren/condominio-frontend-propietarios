import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosConfig';

const NotificationsBell = () => {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pos, setPos] = useState(null);
  const ref = useRef(null);
  const navigate = useNavigate();

  // Cerrar al hacer clic afuera
  useEffect(() => {
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const handleBellClick = async () => {
    setOpen(o => !o);
    if (!loaded && !loading) {
      try {
        setLoading(true);
        const [resResumen, resLista] = await Promise.all([
          axiosInstance.get('/comunicados/resumen/'),
          axiosInstance.get('/comunicados/?leidos=false')
        ]);
        setCount(resResumen.data?.no_leidos || 0);
        const lista = Array.isArray(resLista.data?.results) ? resLista.data.results : (Array.isArray(resLista.data) ? resLista.data : []);
        setItems(lista.slice(0,5));
        setLoaded(true);
      } catch (_) {}
      finally { setLoading(false); }
    }
  };

  // Calcular posición cuando se abre
  useLayoutEffect(() => {
    if (open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleBellClick}
        className="relative text-white/90 hover:text-white transition-all duration-300 p-2 rounded-xl hover:bg-white/10 active:scale-95"
        aria-label="Notificaciones"
      >
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && pos && createPortal(
        <div
          style={{ position: 'fixed', top: pos.top, right: pos.right, zIndex: 3000, width: '16rem' }}
          className="rounded-xl shadow-lg py-2 animate-fade-in bg-[rgba(20,20,24,0.92)] backdrop-blur-xl border border-white/15 ring-1 ring-black/40 pointer-events-auto"
        >
          <p className="text-xs text-white/60 px-2 pb-1">No leídos</p>
          {loading && <p className="text-white/50 text-sm px-2 py-2">Cargando...</p>}
          {!loading && items.length === 0 && (
            <p className="text-white/50 text-sm px-2 py-2">Sin pendientes</p>
          )}
          <ul className="space-y-1 max-h-56 overflow-y-auto">
            {items.map(c => (
              <li
                key={c.id}
                className="px-2 py-2 rounded-lg hover:bg-white/10 cursor-pointer"
                onClick={() => navigate('/comunicados')}
              >
                <p className="text-sm text-white font-medium truncate">{c.titulo}</p>
                <p className="text-xs text-white/50 truncate">{c.tipo}</p>
              </li>
            ))}
          </ul>
          <button
            className="w-full mt-2 text-xs text-white/70 hover:text-white py-1 rounded-lg hover:bg-white/10"
            onClick={() => navigate('/comunicados')}
          >
            Ver todos
          </button>
        </div>,
        document.body
      )}
    </div>
  );
};

export default NotificationsBell;
