import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, Plus, Calendar, Clock, User, FileText, ArrowLeft, CheckCircle } from 'lucide-react';
import useVisitas from '../hooks/useVisitas';
import PageHeader from '../components/common/PageHeader';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import VisitQrModal from '../components/Visitas/VisitQrModal';

const initialForm = { 
  nombre_visitante: '', 
  documento_visitante: '', 
  fecha: '' 
};

const CrearVisitaPage = () => {
  const navigate = useNavigate();
  const { createVisita } = useVisitas();
  
  const [formData, setFormData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [qrModal, setQrModal] = useState({ open: false, code: '' });

  const handleChange = useCallback((e) => { 
    const { name, value } = e.target; 
    setFormData(p => ({ ...p, [name]: value })); 
  }, []);

  const validate = useCallback(() => {
    if (!formData.fecha) return 'Fecha requerida';
    const d = new Date(formData.fecha);
    if (isNaN(d.getTime())) return 'Fecha inválida';
    const now = new Date();
    if (d < now) return 'La fecha debe ser futura';
    if (!formData.nombre_visitante.trim()) return 'Nombre del visitante requerido';
    return null;
  }, [formData]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const valErr = validate();
    if (valErr) { 
      setFeedback({ type: 'error', message: valErr }); 
      return; 
    }
    
    setSubmitting(true);
    setFeedback(null);
    
    const payload = {
      nombre_visitante: formData.nombre_visitante.trim(),
      documento_visitante: formData.documento_visitante.trim(),
      fecha: formData.fecha
    };
    
    const result = await createVisita(payload);
    
    if (result.success) {
      const base = 'Visita registrada exitosamente';
      const message = result.offlinePending ? `${base} (pendiente de sincronizar)` : base;
      setFeedback({ type: 'success', message });
      
      // Si se creó online y hay qr_code, mostrar modal con QR
      if (!result.offlinePending && result.data?.qr_code) {
        setQrModal({ open: true, code: result.data.qr_code });
      } else {
        // Redirigir después de un momento si no hay QR que mostrar
        setTimeout(() => {
          navigate('/visitas');
        }, 2000);
      }
      
      // Reset form
      setFormData(initialForm);
    } else {
      setFeedback({ type: 'error', message: result.error || 'Error al registrar la visita' });
    }
    setSubmitting(false);
  }, [formData, validate, createVisita, navigate]);

  const handleQrClose = () => {
    setQrModal({ open: false, code: '' });
    navigate('/visitas');
  };

  // Acciones del header
  const headerActions = (
    <Button
      variant="secondary"
      icon={ArrowLeft}
      onClick={() => navigate('/visitas')}
    >
      Volver a Visitas
    </Button>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Registrar Nueva Visita"
        description="Programa una visita y genera un código QR de acceso"
        icon={UserCheck}
        actions={headerActions}
      />

      {/* Feedback */}
      {feedback && (
        <div className={`${
          feedback.type === 'success' 
            ? 'bg-green-500/20 border-green-500/30 text-green-300' 
            : 'bg-red-500/20 border-red-500/30 text-red-300'
        } border rounded-xl p-4 flex items-center gap-3 animate-slide-down backdrop-blur-sm`}>
          {feedback.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <div className="w-5 h-5 flex-shrink-0 rounded-full bg-red-500/20 flex items-center justify-center">
              <span className="text-xs font-bold">!</span>
            </div>
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Formulario Principal */}
      <div className="max-w-2xl mx-auto">
        <div className="card-minimal">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información del Visitante */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                <User className="w-5 h-5 text-red-400" />
                <h3 className="text-lg font-semibold text-white">Información del Visitante</h3>
              </div>
              
              <Input
                id="nombre_visitante"
                label="Nombre Completo del Visitante"
                name="nombre_visitante"
                value={formData.nombre_visitante}
                onChange={handleChange}
                placeholder="Ej: Juan Carlos Pérez"
                required
                icon={User}
              />
              
              <Input
                id="documento_visitante"
                label="Documento de Identidad"
                name="documento_visitante"
                value={formData.documento_visitante}
                onChange={handleChange}
                placeholder="Número de cédula o documento (opcional)"
                icon={FileText}
              />
            </div>

            {/* Programación de la Visita */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                <Calendar className="w-5 h-5 text-red-400" />
                <h3 className="text-lg font-semibold text-white">Programación de la Visita</h3>
              </div>
              
              <Input
                id="fecha_visita"
                label="Fecha y Hora de la Visita"
                type="datetime-local"
                name="fecha"
                value={formData.fecha}
                onChange={handleChange}
                required
                icon={Clock}
              />
            </div>

            {/* Información Importante */}
            <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/30 rounded-xl p-6 space-y-3 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-blue-400" />
                </div>
                <h4 className="text-blue-300 font-semibold">Información Importante</h4>
              </div>
              <div className="space-y-2 text-blue-200/80 text-sm ml-11">
                <p>• Se generará automáticamente un código QR para el acceso del visitante</p>
                <p>• La fecha y hora deben ser futuras</p>
                <p>• Incluir el documento de identidad es recomendado para mayor seguridad</p>
                <p>• El visitante deberá presentar el código QR en la portería</p>
                <p>• Podrás visualizar y compartir el código QR después de crear la visita</p>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button
                variant="secondary"
                type="button"
                onClick={() => navigate('/visitas')}
                disabled={submitting}
                className="sm:w-auto w-full"
              >
                Cancelar
              </Button>
              
              <Button
                type="submit"
                loading={submitting}
                icon={Plus}
                className="sm:w-auto w-full"
              >
                {submitting ? 'Registrando Visita...' : 'Registrar Visita'}
              </Button>
            </div>
          </form>
        </div>

        {/* Consejos Adicionales */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="glass-effect rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-400" />
              </div>
              <h4 className="text-white font-medium">Mejores Prácticas</h4>
            </div>
            <ul className="space-y-2 text-white/70 text-sm ml-11">
              <li>• Confirma los datos con tu visitante antes de enviar</li>
              <li>• Programa la visita con al menos 30 minutos de anticipación</li>
              <li>• Comparte el código QR por WhatsApp o email</li>
            </ul>
          </div>

          <div className="glass-effect rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-orange-400" />
              </div>
              <h4 className="text-white font-medium">Horarios Recomendados</h4>
            </div>
            <ul className="space-y-2 text-white/70 text-sm ml-11">
              <li>• Lunes a Viernes: 8:00 AM - 10:00 PM</li>
              <li>• Fines de semana: 9:00 AM - 9:00 PM</li>
              <li>• Evita horarios muy tardíos por seguridad</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal QR */}
      <VisitQrModal
        open={qrModal.open}
        code={qrModal.code}
        onClose={handleQrClose}
        onCopied={() => setFeedback({ type: 'success', message: 'Código copiado al portapapeles' })}
      />
    </div>
  );
};

export default CrearVisitaPage;