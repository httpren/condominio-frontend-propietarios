import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Plus, Users, MapPin, Clock, DollarSign, ArrowLeft, CheckCircle, AlertCircle, UserPlus, X } from 'lucide-react';
import useReservas from '../hooks/useReservas';
import axiosInstance from '../api/axiosConfig';
import PageHeader from '../components/common/PageHeader';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';

// Estado inicial del formulario
const initialForm = {
  area: '',
  fecha_reserva: '',
  hora_inicio: '',
  hora_fin: '',
  num_personas: '',
  invitados: []
};

const CrearReservaPage = () => {
  const navigate = useNavigate();
  const { createReserva } = useReservas();

  const [formData, setFormData] = useState(initialForm);
  const [guestInput, setGuestInput] = useState({ nombre: '', documento: '' });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }
  const [areas, setAreas] = useState([]);
  const [loadingAreas, setLoadingAreas] = useState(true);

  // Cargar áreas disponibles
  useEffect(() => {
    let mounted = true;
    const loadAreas = async () => {
      try {
        const resp = await axiosInstance.get('/areas/');
        const list = resp.data?.results || resp.data || [];
        if (mounted) setAreas(list);
      } catch (e) {
        console.error('Error cargando áreas:', e);
        if (mounted) setFeedback({ type: 'error', message: 'Error al cargar las áreas disponibles' });
      } finally {
        if (mounted) setLoadingAreas(false);
      }
    };
    loadAreas();
    return () => { mounted = false; };
  }, []);

  // Handlers básicos
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  }, []);

  const addInvitado = useCallback(() => {
    if (!guestInput.nombre.trim()) return;
    setFormData(p => ({
      ...p,
      invitados: [
        ...p.invitados,
        { nombre: guestInput.nombre.trim(), documento: guestInput.documento.trim() }
      ]
    }));
    setGuestInput({ nombre: '', documento: '' });
  }, [guestInput]);

  const removeInvitado = useCallback((idx) => {
    setFormData(p => ({
      ...p,
      invitados: p.invitados.filter((_, i) => i !== idx)
    }));
  }, []);

  // Validaciones frontend simples
  const validate = useCallback(() => {
    if (!formData.area) return 'Área requerida';
    if (!formData.fecha_reserva) return 'Fecha requerida';
    if (!formData.hora_inicio || !formData.hora_fin) return 'Horas de inicio y fin requeridas';
    if (formData.hora_inicio >= formData.hora_fin) return 'La hora de inicio debe ser anterior a la hora de fin';
    if (!formData.num_personas || parseInt(formData.num_personas, 10) <= 0) return 'Número de personas debe ser mayor a 0';

    // Validar que la fecha/hora sea futura
    try {
      const fechaReserva = new Date(formData.fecha_reserva + 'T' + formData.hora_inicio);
      if (isNaN(fechaReserva.getTime())) return 'Fecha u hora inválida';
      if (fechaReserva <= new Date()) return 'La fecha y hora deben ser futuras';
    } catch {
      return 'Fecha inválida';
    }

    return null;
  }, [formData]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setFeedback({ type: 'error', message: validationError });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    const payload = {
      ...formData,
      num_personas: parseInt(formData.num_personas, 10)
    };

    const result = await createReserva(payload);

    if (result.success) {
      setFeedback({
        type: 'success',
        message: result.offlinePending
          ? 'Reserva creada (pendiente de sincronizar)'
          : 'Reserva creada exitosamente'
      });
      // Redirigir luego de 2s
      setTimeout(() => navigate('/reservas'), 1800);
      setFormData(initialForm);
      setGuestInput({ nombre: '', documento: '' });
    } else {
      setFeedback({ type: 'error', message: result.error || 'Error al crear la reserva' });
    }

    setSubmitting(false);
  }, [formData, validate, createReserva, navigate]);

  // Opciones de áreas
  const areaOptions = areas.map(a => ({
    value: a.id,
    label: a.nombre || `Área ${a.id}`
  }));

  // Acciones del header (volver a listado)
  const headerActions = (
    <Button
      variant="secondary"
      icon={ArrowLeft}
      onClick={() => navigate('/reservas')}
    >
      Volver a Reservas
    </Button>
  );

  if (loadingAreas) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-red-500 border-t-transparent mx-auto" />
          <p>Cargando áreas disponibles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Nueva Reserva de Área Común"
        description="Reserva un área común para tu evento o reunión"
        icon={Calendar}
        actions={headerActions}
      />

      {/* Feedback */}
      {feedback && (
        <div
          className={`border rounded-xl p-4 flex items-center gap-3 animate-slide-down backdrop-blur-sm ${
            feedback.type === 'success'
              ? 'bg-green-500/20 border-green-500/30 text-green-300'
              : 'bg-red-500/20 border-red-500/30 text-red-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Formulario */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card-minimal">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Área y Fecha */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                  <MapPin className="w-5 h-5 text-red-400" />
                  <h3 className="text-lg font-semibold text-white">Área y Fecha</h3>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Select
                    label="Área a Reservar"
                    name="area"
                    value={formData.area}
                    onChange={handleChange}
                    options={areaOptions}
                    placeholder="Seleccione un área"
                    required
                  />
                  <Input
                    label="Fecha de la Reserva"
                    type="date"
                    name="fecha_reserva"
                    value={formData.fecha_reserva}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Horarios */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                  <Clock className="w-5 h-5 text-red-400" />
                  <h3 className="text-lg font-semibold text-white">Horarios</h3>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label="Hora de Inicio"
                    type="time"
                    name="hora_inicio"
                    value={formData.hora_inicio}
                    onChange={handleChange}
                    required
                  />
                  <Input
                    label="Hora de Finalización"
                    type="time"
                    name="hora_fin"
                    value={formData.hora_fin}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Número de Personas */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                  <Users className="w-5 h-5 text-red-400" />
                  <h3 className="text-lg font-semibold text-white">Asistentes</h3>
                </div>
                <Input
                  label="Número Total de Personas"
                  type="number"
                  name="num_personas"
                  value={formData.num_personas}
                  onChange={handleChange}
                  placeholder="Ej: 15"
                  min="1"
                  required
                />
              </div>

              {/* Invitados */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                  <UserPlus className="w-5 h-5 text-red-400" />
                  <h3 className="text-lg font-semibold text-white">Lista de Invitados</h3>
                  <span className="text-sm text-white/60">(Opcional)</span>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nombre del invitado"
                      value={guestInput.nombre}
                      onChange={(e) => setGuestInput(g => ({ ...g, nombre: e.target.value }))}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Documento (opcional)"
                      value={guestInput.documento}
                      onChange={(e) => setGuestInput(g => ({ ...g, documento: e.target.value }))}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={addInvitado}
                      disabled={!guestInput.nombre.trim()}
                      icon={Plus}
                    >
                      Agregar
                    </Button>
                  </div>

                  {formData.invitados.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                      <p className="text-white/70 text-sm font-medium">
                        Invitados agregados ({formData.invitados.length})
                      </p>
                      {formData.invitados.map((inv, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between bg-white/5 px-4 py-3 rounded-lg backdrop-blur-sm border border-white/10"
                        >
                          <div className="flex-1">
                            <span className="text-white font-medium">{inv.nombre}</span>
                            {inv.documento && (
                              <span className="text-white/60 ml-2 text-sm">({inv.documento})</span>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeInvitado(i)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            icon={X}
                            title="Remover invitado"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {formData.invitados.length === 0 && (
                    <p className="text-white/40 text-sm text-center py-6 bg-white/5 rounded-lg border border-dashed border-white/20">
                      No hay invitados en la lista
                    </p>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-white/10">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => navigate('/reservas')}
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
                  {submitting ? 'Creando Reserva...' : 'Crear Reserva'}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Panel lateral informativo */}
        <div className="space-y-6">
          <div className="card-minimal space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-blue-400" />
              </div>
              <h4 className="text-blue-300 font-semibold">Información Importante</h4>
            </div>
            <div className="space-y-3 text-blue-200/80 text-sm">
              <p>• El costo se calculará automáticamente después de crear la reserva</p>
              <p>• Los códigos QR se generarán al confirmar la reserva</p>
              <p>• Una vez confirmada, no podrás editar los datos</p>
              <p>• El pago se incluirá en tu próxima expensa</p>
              <p>• Puedes agregar invitados para generar códigos QR individuales</p>
            </div>
          </div>

          <div className="card-minimal space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <h4 className="text-green-300 font-semibold">Costos de Referencia</h4>
            </div>
            <div className="space-y-2 text-green-200/80 text-sm">
              <div className="flex justify-between"><span>Salón de fiestas:</span><span className="font-medium">$50.000/día</span></div>
              <div className="flex justify-between"><span>Piscina:</span><span className="font-medium">$30.000/día</span></div>
              <div className="flex justify-between"><span>Cancha deportiva:</span><span className="font-medium">$25.000/día</span></div>
              <div className="flex justify-between"><span>Zona BBQ:</span><span className="font-medium">$40.000/día</span></div>
              <p className="text-xs pt-2 border-t border-white/10">*Los costos exactos pueden variar según el área y la temporada</p>
            </div>
          </div>

          <div className="card-minimal space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-orange-400" />
              </div>
              <h4 className="text-orange-300 font-semibold">Horarios Disponibles</h4>
            </div>
            <div className="space-y-2 text-orange-200/80 text-sm">
              <p><strong>Lunes a Viernes:</strong></p>
              <p className="ml-3">9:00 AM - 10:00 PM</p>
              <p><strong>Fines de semana:</strong></p>
              <p className="ml-3">8:00 AM - 11:00 PM</p>
              <p className="text-xs pt-2 border-t border-white/10 text-orange-200/60">Los horarios pueden variar según el área específica</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrearReservaPage;
