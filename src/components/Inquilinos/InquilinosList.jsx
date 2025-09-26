import React, { useState, useEffect } from 'react';
import { Users, Plus, UserMinus, UserPlus, Shield, Mail } from 'lucide-react';
import PageHeader from '../common/PageHeader';
import Table from '../common/Table';
import Button from '../common/Button';
import Modal from '../common/Modal';
import Input from '../common/Input';
import StatsGrid from '../common/StatsGrid';
import useInquilinos from '../../hooks/useInquilinos';
import axiosInstance from '../../api/axiosConfig';

const initialForm = { username: '', password: '', email: '', first_name: '', last_name: '' };

const validatePassword = (pwd) => {
  if (!pwd) return 'Password requerido';
  if (pwd.length < 8) return 'Mínimo 8 caracteres';
  if (!/[A-Z]/.test(pwd)) return 'Debe incluir una mayúscula';
  if (!/[a-z]/.test(pwd)) return 'Debe incluir una minúscula';
  if (!/[0-9]/.test(pwd)) return 'Debe incluir un número';
  return null;
};

const InquilinosList = () => {
  const { inquilinos, loading, creating, toggling, feedback, crearInquilino, desactivarInquilino, setFeedback } = useInquilinos();
  const list = Array.isArray(inquilinos) ? inquilinos : [];
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [isPropietario, setIsPropietario] = useState(false);

  // Detección directa y simple: si /propietarios/me/ responde 200, mostramos botón crear.
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const r = await axiosInstance.get('/propietarios/me/');
        if (!cancelled && r.status === 200) setIsPropietario(true);
      } catch {
        if (!cancelled) setIsPropietario(false); // es inquilino o error
      }
    };
    check();
    return () => { cancelled = true; };
  }, []);

  const openForm = () => { setFormData(initialForm); setErrors({}); setShowForm(true); };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  };

  const validateForm = () => {
    const e = {};
    if (!formData.username) e.username = 'Username requerido';
    const pwdErr = validatePassword(formData.password);
    if (pwdErr) e.password = pwdErr;
    if (!formData.email) e.email = 'Email requerido';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const v = validateForm();
    setErrors(v);
    if (Object.keys(v).length) return;
    await crearInquilino(formData);
    setShowForm(false);
    setFormData(initialForm);
  };

  const columns = [
    { key: 'username', header: 'Username', render: (_v, row) => row.user?.username || '—' },
    { key: 'nombre', header: 'Nombre', render: (_v, row) => { const u=row.user||{}; const full=((u.first_name||'')+' '+(u.last_name||'')).trim(); return full || '—'; } },
    { key: 'email', header: 'Correo', render: (_v, row) => row.user?.email || '—' },
    { key: 'activo', header: 'Estado', render: (_v, row) => row.activo ? <span className="text-green-400">Activo</span> : <span className="text-red-400">Inactivo</span> },
  ];

  if (isPropietario) {
    columns.push({
      key: 'actions',
      header: 'Acciones',
      render: (_v, row) => (
        <div className="flex gap-2">
          {row.activo && (
            <Button
              variant="secondary"
              size="sm"
              icon={UserMinus}
              loading={toggling === row.id}
              onClick={() => desactivarInquilino(row.id)}
            >
              Desactivar
            </Button>
          )}
        </div>
      )
    });
  }

  const statsData = [
    { title: 'Inquilinos', value: list.length, variant: 'info', icon: Users },
    { title: 'Activos', value: list.filter(i=>i.activo).length, variant: 'success', icon: Shield },
    { title: 'Con Email', value: list.filter(i=>i.user?.email).length, variant: 'warning', icon: Mail },
  ];

  const headerActions = isPropietario ? (
    <Button variant="secondary" icon={Plus} onClick={openForm}>Nuevo Inquilino</Button>
  ) : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Inquilinos"
        description="Gestiona las cuentas de inquilinos asociadas a tu propietario"
        icon={Users}
        actions={headerActions}
      />

      <StatsGrid stats={statsData} />

      {feedback && (
        <div className={feedback.type === 'success' ? 'alert-success' : 'alert-error'}>{feedback.message}</div>
      )}

      <Table
        columns={columns}
        data={list}
        loading={loading}
        emptyMessage="No hay inquilinos registrados"
      />

      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setFormData(initialForm); setErrors({}); setFeedback(null); }}
        title="Crear Inquilino"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Username" name="username" value={formData.username} onChange={handleChange} required error={errors.username} />
          <Input label="Password" type="password" name="password" value={formData.password} onChange={handleChange} required error={errors.password} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nombre" name="first_name" value={formData.first_name} onChange={handleChange} />
            <Input label="Apellido" name="last_name" value={formData.last_name} onChange={handleChange} />
          </div>
          <Input label="Correo Electrónico" type="email" name="email" value={formData.email} onChange={handleChange} required error={errors.email} />
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-blue-300 text-sm">
            <p><strong>Nota:</strong> Solo el propietario puede crear inquilinos. Se aplica validación básica de password.</p>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" type="button" onClick={() => { setShowForm(false); setFormData(initialForm); setErrors({}); }} disabled={creating}>Cancelar</Button>
            <Button type="submit" loading={creating} icon={UserPlus}>Crear</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InquilinosList;
