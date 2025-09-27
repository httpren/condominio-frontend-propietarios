import React from 'react';
import PageHeader from '../components/common/PageHeader';
import PushNotificationDebug from '../components/Debug/PushNotificationDebug';
import { Bell } from 'lucide-react';

const PushNotificationDebugPage = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Debug de Notificaciones Push"
        description="Herramientas de diagnóstico para notificaciones push"
        icon={Bell}
      />

      <PushNotificationDebug />
    </div>
  );
};

export default PushNotificationDebugPage;
