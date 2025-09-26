import React, { useState } from 'react';
import { Share2, Copy, Users, User } from 'lucide-react';
import QRCode from 'react-qr-code';
import Modal from '../common/Modal';
import Button from '../common/Button';

/**
 * Componente reutilizable para mostrar QR de una reserva (anfitrión + invitados)
 */
const ReservaQrModal = ({ open, host, invitados = [], onClose }) => {
  const [tab, setTab] = useState('host');
  const [selectedGuest, setSelectedGuest] = useState(null);
  
  if (!open) return null;

  const shareWhatsapp = (text) => {
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const copyText = async (text) => { 
    try { 
      await navigator.clipboard.writeText(text);
      // TODO: Agregar feedback visual de copiado
    } catch (error) {
      console.error('Error al copiar:', error);
    }
  };

  const guestList = invitados || [];
  const activeGuest = selectedGuest || guestList[0];

  const footer = (
    <div className="flex justify-between items-center text-xs text-white/50">
      <span>Escanear en puesto de guardia</span>
      <Button variant="secondary" onClick={onClose}>Cerrar</Button>
    </div>
  );

  return (
    <Modal isOpen={open} onClose={onClose} title="Códigos de Acceso" size="lg" footer={footer}>
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {host && (
          <Button
            variant={tab === 'host' ? 'primary' : 'secondary'}
            size="sm"
            icon={User}
            onClick={() => { setTab('host'); setSelectedGuest(null); }}
          >
            Anfitrión
          </Button>
        )}
        <Button
          variant={tab === 'guests' ? 'primary' : 'secondary'}
          size="sm"
          icon={Users}
          onClick={() => { setTab('guests'); setSelectedGuest(null); }}
        >
          Invitados ({guestList.length})
        </Button>
      </div>

      {/* HOST TAB */}
      {tab === 'host' && host && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl flex items-center justify-center shadow-lg mx-auto w-fit">
            <QRCode value={host} size={180} />
          </div>
          
          <div className="flex gap-3 justify-center">
            <Button
              variant="secondary"
              size="sm"
              icon={Copy}
              onClick={() => copyText(host)}
            >
              Copiar
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Share2}
              onClick={() => shareWhatsapp(`QR anfitrión: ${host}`)}
            >
              WhatsApp
            </Button>
          </div>
          
          <p className="text-xs text-white/50 break-all select-all text-center bg-white/5 p-3 rounded-lg font-mono">
            {host}
          </p>
        </div>
      )}

      {/* GUESTS TAB */}
      {tab === 'guests' && (
        <div className="space-y-6">
          {guestList.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-white/30 mx-auto mb-3" />
              <p className="text-white/60">No hay invitados registrados</p>
            </div>
          ) : (
            <>
              {/* Lista de invitados */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-white/70">Seleccionar invitado:</p>
                <div className="flex gap-2 flex-wrap max-h-32 overflow-y-auto custom-scrollbar p-2 bg-white/5 rounded-lg">
                  {guestList.map((g, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedGuest(g)}
                      className={`text-sm px-3 py-2 rounded-lg border transition-all ${
                        (selectedGuest ? selectedGuest.qr_code === g.qr_code : idx === 0) 
                          ? 'bg-red-500 border-red-400 text-white shadow-md' 
                          : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                      title={g.invitado || g.nombre}
                    >
                      {g.invitado || g.nombre || `Invitado ${idx + 1}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* QR del invitado seleccionado */}
              {activeGuest && (
                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-xl flex items-center justify-center shadow-lg mx-auto w-fit">
                    <QRCode value={activeGuest.qr_code || ''} size={160} />
                  </div>
                  
                  <div className="flex gap-3 justify-center flex-wrap">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Copy}
                      onClick={() => copyText(activeGuest.qr_code)}
                    >
                      Copiar
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Share2}
                      onClick={() => shareWhatsapp(`QR Invitado ${activeGuest.invitado || activeGuest.nombre}: ${activeGuest.qr_code}`)}
                    >
                      WhatsApp
                    </Button>
                    {guestList.length > 1 && (
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Share2}
                        onClick={() => shareWhatsapp('QR Invitados:\n' + guestList.map(i => `${i.invitado || i.nombre}: ${i.qr_code}`).join('\n'))}
                      >
                        Enviar Todos
                      </Button>
                    )}
                  </div>
                  
                  <p className="text-xs text-white/50 break-all select-all text-center bg-white/5 p-3 rounded-lg font-mono">
                    {activeGuest.qr_code}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

    </Modal>
  );
};

export default ReservaQrModal;