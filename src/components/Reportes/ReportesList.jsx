import React, { useState } from 'react';
import { FileText, Plus, Download, Calendar, Filter, Eye, RefreshCw } from 'lucide-react';
import useReportes from '../../hooks/useReportes';
import PageHeader from '../common/PageHeader';
import Table from '../common/Table';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import Badge from '../common/Badge';
import StatsGrid from '../common/StatsGrid';

const ReportesList = () => {
  const { 
    reportes, 
    loading, 
    error, 
    generateReporte, 
    downloadReporte, 
    getAvailableReportTypes,
    fetchReportes 
  } = useReportes();

  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [parametros, setParametros] = useState({});
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState({});
  const [feedback, setFeedback] = useState(null);

  const availableTypes = getAvailableReportTypes();

  const handleTypeChange = (e) => {
    const typeId = e.target.value;
    setSelectedType(typeId);
    setParametros({});
  };

  const handleParameterChange = (param, value) => {
    setParametros(prev => ({ ...prev, [param]: value }));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedType) return;

    setGenerating(true);
    setFeedback(null);

    const result = await generateReporte(selectedType, parametros);
    
    if (result.success) {
      setFeedback({ type: 'success', message: 'Reporte generado exitosamente' });
      setShowGenerator(false);
      setSelectedType('');
      setParametros({});
    } else {
      setFeedback({ type: 'error', message: result.message || 'Error al generar el reporte' });
    }
    
    setGenerating(false);
  };

  const handleDownload = async (reporte) => {
    setDownloading(prev => ({ ...prev, [reporte.id]: true }));
    
    const result = await downloadReporte(reporte.id);
    
    if (!result.success) {
      setFeedback({ type: 'error', message: result.message || 'Error al descargar el reporte' });
    } else {
      setFeedback({ type: 'success', message: 'Reporte descargado exitosamente' });
    }
    
    setDownloading(prev => ({ ...prev, [reporte.id]: false }));
  };

  // Configuración de la tabla
  const getEstadoBadgeVariant = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'completado': return 'success';
      case 'generando': return 'warning';
      case 'error': return 'error';
      default: return 'neutral';
    }
  };

  const getTypeIcon = (tipo) => {
    const typeData = availableTypes.find(t => t.id === tipo);
    return typeData?.icon || '📄';
  };

  const columns = [
    {
      key: 'tipo',
      header: 'Tipo',
      render: (value, row) => {
        const typeData = availableTypes.find(t => t.id === value);
        return (
          <div className="flex items-center gap-2">
            <span className="text-lg">{getTypeIcon(value)}</span>
            <span className="font-medium">{typeData?.nombre || value || '—'}</span>
          </div>
        );
      },
    },
    {
      key: 'created_at',
      header: 'Fecha de Creación',
      render: (value) => {
        if (!value) return '—';
        try {
          return new Date(value).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        } catch {
          return value;
        }
      },
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (value) => (
        <Badge variant={getEstadoBadgeVariant(value)}>
          {value || 'Desconocido'}
        </Badge>
      ),
    },
    {
      key: 'parametros',
      header: 'Parámetros',
      render: (value) => {
        if (!value || Object.keys(value).length === 0) return '—';
        const params = Object.entries(value)
          .map(([key, val]) => `${key}: ${val}`)
          .join(', ');
        return (
          <span className="text-white/70 text-sm" title={params}>
            {params.length > 30 ? `${params.substring(0, 30)}...` : params}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Acciones',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (_, row) => (
        <div className="flex items-center gap-2 justify-end">
          {row.estado === 'completado' && (
            <Button
              variant="icon"
              icon={Download}
              onClick={() => handleDownload(row)}
              loading={downloading[row.id]}
              title="Descargar reporte"
            />
          )}
        </div>
      ),
    },
  ];

  // Estadísticas
  const completados = reportes.filter(r => r.estado === 'completado').length;
  const enProceso = reportes.filter(r => r.estado === 'generando').length;
  const tiposGenerados = new Set(reportes.map(r => r.tipo)).size;

  const statsData = [
    {
      title: 'Total',
      value: reportes.length,
      variant: 'info',
      icon: FileText,
    },
    {
      title: 'Completados',
      value: completados,
      variant: 'success',
      icon: Download,
    },
    {
      title: 'Tipos Diferentes',
      value: tiposGenerados,
      variant: 'warning',
      icon: Filter,
    },
  ];

  // Obtener tipo seleccionado
  const selectedTypeData = availableTypes.find(t => t.id === selectedType);

  // Acciones del header
  const headerActions = (
    <>
      <Button
        variant="secondary"
        icon={RefreshCw}
        onClick={() => fetchReportes()}
      >
        Refrescar
      </Button>
      <Button
        variant="primary"
        icon={Plus}
        onClick={() => setShowGenerator(true)}
      >
        Generar Reporte
      </Button>
    </>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Reportes"
        description="Genera y descarga reportes de tu información"
        icon={FileText}
        actions={headerActions}
      />

      {/* Estadísticas */}
      <StatsGrid stats={statsData} />

      {/* Feedback */}
      {feedback && (
        <div className={feedback.type === 'success' ? 'alert-success' : 'alert-error'}>
          {feedback.message}
        </div>
      )}

      {/* Error general */}
      {error && !feedback && (
        <div className="alert-error">{error}</div>
      )}

      {/* Tabla */}
      <Table
        columns={columns}
        data={reportes}
        loading={loading}
        emptyMessage="No hay reportes generados"
      />

      {/* Modal generador */}
      <Modal
        isOpen={showGenerator}
        onClose={() => {
          setShowGenerator(false);
          setSelectedType('');
          setParametros({});
          setFeedback(null);
        }}
        title="Generar Nuevo Reporte"
        size="lg"
      >
        <form onSubmit={handleGenerate} className="space-y-6">
          {/* Selección de tipo */}
          <Select
            label="Tipo de Reporte"
            value={selectedType}
            onChange={handleTypeChange}
            options={[
              { value: '', label: 'Selecciona un tipo de reporte' },
              ...availableTypes.map(type => ({
                value: type.id,
                label: `${type.icon} ${type.nombre}`
              }))
            ]}
            required
          />

          {/* Descripción del tipo seleccionado */}
          {selectedTypeData && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-blue-300 text-sm">
                <strong>{selectedTypeData.nombre}:</strong> {selectedTypeData.descripcion}
              </p>
            </div>
          )}

          {/* Parámetros específicos */}
          {selectedTypeData && selectedTypeData.parametros.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-white font-medium">Parámetros del Reporte</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedTypeData.parametros.map(param => {
                  if (param === 'fechaInicio' || param === 'fechaFin') {
                    return (
                      <Input
                        key={param}
                        label={param === 'fechaInicio' ? 'Fecha de Inicio' : 'Fecha de Fin'}
                        type="date"
                        value={parametros[param] || ''}
                        onChange={(e) => handleParameterChange(param, e.target.value)}
                      />
                    );
                  }
                  
                  if (param === 'año') {
                    const currentYear = new Date().getFullYear();
                    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
                    return (
                      <Select
                        key={param}
                        label="Año"
                        value={parametros[param] || ''}
                        onChange={(e) => handleParameterChange(param, e.target.value)}
                        options={[
                          { value: '', label: 'Seleccionar año' },
                          ...years.map(year => ({ value: year.toString(), label: year.toString() }))
                        ]}
                      />
                    );
                  }

                  if (param === 'unidad') {
                    return (
                      <Input
                        key={param}
                        label="Número de Unidad"
                        value={parametros[param] || ''}
                        onChange={(e) => handleParameterChange(param, e.target.value)}
                        placeholder="Ej: 101, A-01"
                      />
                    );
                  }

                  return (
                    <Input
                      key={param}
                      label={param}
                      value={parametros[param] || ''}
                      onChange={(e) => handleParameterChange(param, e.target.value)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setShowGenerator(false);
                setSelectedType('');
                setParametros({});
                setFeedback(null);
              }}
              disabled={generating}
            >
              Cancelar
            </Button>
            
            <Button
              type="submit"
              loading={generating}
              icon={Plus}
              disabled={!selectedType}
            >
              Generar Reporte
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ReportesList