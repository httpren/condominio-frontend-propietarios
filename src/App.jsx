import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { PushNotificationProvider } from './context/PushNotificationContext'
import MainLayout from './components/Layout/MainLayout'
import LoginPage from './components/Auth/LoginPage'

// Páginas
import DashboardPage from './pages/DashboardPage'
import ExpensasPage from './pages/ExpensasPage'
import ExpensasPagadasPage from './pages/ExpensasPagadasPage'
import UnidadesPage from './pages/UnidadesPage'

import VisitasPage from './pages/VisitasPage'
import InquilinosPage from './pages/InquilinosPage'
import VehiculosPage from './pages/VehiculosPage'
import MascotasPage from './pages/MascotasPage'
import NotFoundPage from './pages/NotFoundPage'
import ReservasPage from './pages/ReservasPage'
import ComunicadosPage from './pages/ComunicadosPage'
import ReportesPage from './pages/ReportesPage'
import ComunicadoDetallePage from './pages/ComunicadoDetallePage'
import PushTestPage from './pages/PushTestPage'
import PushNotificationDebugPage from './pages/PushNotificationDebugPage'
import CrearVisitaPage from './pages/CrearVisitaPage'
import CrearReservaPage from './pages/CrearReservaPage'
import CrearPagoPage from './pages/CrearPagoPage'

// Debug components
import ApiTest from './components/Debug/ApiTest'
import PushDebug from './components/Debug/PushDebug'

// Componente protegido con layout
const ProtectedLayout = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Cargando...
      </div>
    )

  return isAuthenticated ? <MainLayout>{children}</MainLayout> : <Navigate to="/login" />
}

function App() {
  return (
    

    <AuthProvider>
      <PushNotificationProvider>
        <Router>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/push-debug" element={<PushDebug />} />
          <Route path="/push-test" element={<PushTestPage />} />
          <Route path="/push-debug-page" element={<PushNotificationDebugPage />} />
          {/* Rutas protegidas */}
          <Route
            path="/dashboard"
            element={
              <ProtectedLayout>
                <DashboardPage />
              </ProtectedLayout>
            }
          />

          <Route
            path="/expensas"
            element={
              <ProtectedLayout>
                <ExpensasPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/expensas/pagadas"
            element={
              <ProtectedLayout>
                <ExpensasPagadasPage />
              </ProtectedLayout>
            }
          />

          <Route
            path="/unidades"
            element={
              <ProtectedLayout>
                <UnidadesPage />
              </ProtectedLayout>
            }
          />

          <Route
            path="/comunicados"
            element={
              <ProtectedLayout>
                <ComunicadosPage />
              </ProtectedLayout>
            }
          />


          {/* Rutas del submenú "Gestionar" para propietario */}
          <Route
            path="/inquilinos"
            element={
              <ProtectedLayout>
                <InquilinosPage />
              </ProtectedLayout>
            }
          />

          <Route
            path="/visitas"
            element={
              <ProtectedLayout>
                <VisitasPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/reservas"
            element={
              <ProtectedLayout>
                <ReservasPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/vehiculos"
            element={
              <ProtectedLayout>
                <VehiculosPage />
              </ProtectedLayout>
            }
          />

          <Route
            path="/mascotas"
            element={
              <ProtectedLayout>
                <MascotasPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/reportes"
            element={
              <ProtectedLayout>
                <ReportesPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/comunicados/:id"
            element={
              <ProtectedLayout>
                <ComunicadoDetallePage />
              </ProtectedLayout>
            }
          />

          {/* Crear Visita */}
          <Route
            path="/visitas/crear"
            element={
              <ProtectedLayout>
                <CrearVisitaPage />
              </ProtectedLayout>
            }
          />

          {/* Crear Reserva */}
          <Route
            path="/reservas/crear"
            element={
              <ProtectedLayout>
                <CrearReservaPage />
              </ProtectedLayout>
            }
          />

          {/* Pasarela Pago */}
          <Route
            path="/pagos/crear"
            element={
              <ProtectedLayout>
                <CrearPagoPage />
              </ProtectedLayout>
            }
          />

          {/* Debug Route */}
          <Route
            path="/debug"
            element={
              <ProtectedLayout>
                <ApiTest />
              </ProtectedLayout>
            }
          />

          {/* Ruta por defecto */}
          <Route path="/" element={<Navigate to="/dashboard" />} />

          {/* Ruta 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </Router>
      </PushNotificationProvider>
    </AuthProvider>
  )
}

export default App
