import React from 'react';
import { Share2, Copy, QrCode } from 'lucide-react';
import QRCode from 'react-qr-code';
import Modal from '../common/Modal';
import Button from '../common/Button';

// Modal compacto para mostrar el QR de una visita y opciones de compartir
const VisitQrModal = ({ open, code, onClose, onCopied }) => {
  if (!open) return null;

  const shareWhatsapp = () => {
    const text = `Código QR de visita: ${code}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const copyCode = async () => {
    try { 
      await navigator.clipboard.writeText(code); 
      onCopied && onCopied();
    } catch (error) {
      console.error('Error al copiar:', error);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Código QR de Visita"
      size="sm"
    >
      <div className="space-y-6">
        {/* QR Code */}
        <div className="bg-white p-6 rounded-xl flex items-center justify-center shadow-lg mx-auto w-fit">
          <QRCode value={code || ''} size={180} />
        </div>

        {/* Código de texto */}
        <div className="space-y-2">
          <p className="text-sm text-white/70 text-center">Código de acceso:</p>
          <p className="text-sm text-white break-all select-all text-center bg-white/5 p-3 rounded-lg font-mono border border-white/10">
            {code}
          </p>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            icon={Copy}
            onClick={copyCode}
          >
            Copiar
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Share2}
            onClick={shareWhatsapp}
          >
            WhatsApp
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center pt-4 border-t border-white/10">
          <p className="text-xs text-white/50 mb-4">
            Escanear en el control de acceso
          </p>
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default VisitQrModal;