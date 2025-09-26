import React from 'react';
import { FileBarChart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/common/PageHeader';
import ReportGenerator from '../components/Reportes/ReportGenerator';
import useReportes from '../hooks/useReportes';

export default function ReportesPage() {
  const { isPropietario } = useAuth();
  const { generarReporte, loading, error } = useReportes();

  if (!isPropietario) {
    return (
      <div className="alert-error mt-4">Solo disponible para propietarios.</div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Reportes"
        description="Genera reportes descargables de tus datos (solo visibles para tu cuenta)."
        icon={FileBarChart}
      />
      <div className="card-minimal">
        <h2 className="text-white font-semibold mb-4 text-sm tracking-wide">Generador de Reportes</h2>
        <ReportGenerator
          variant="secondary"
          onGenerate={generarReporte}
          loading={loading}
          error={error}
        />
        <p className="text-[11px] text-white/40 mt-6 leading-relaxed">
          Los reportes se generan usando los datos disponibles en tu sesión actual. Para información consolidada histórica verifica que las expensas y pagos estén actualizados. Los filtros de fecha en pagos se aplican del lado del cliente.
        </p>
      </div>
    </div>
  );
}
