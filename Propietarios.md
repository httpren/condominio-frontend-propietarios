Flujo del Propietario - Casos de Uso Esenciales
Basado en los modelos y API proporcionados, aquí están todos los casos de uso que un propietario debería poder gestionar en el frontend, ordenados por importancia y funcionalidad:

1. Autenticación y Perfil
Login/logout usando JWT tokens

Ver perfil personal con información de contacto

Actualizar información personal (teléfono, etc.)

Ver estado de mora y restricciones actuales

2. Gestión de Unidades Habitacionales
Ver listado de unidades asociadas


3. Gestión de Vehículos
Registrar nuevos vehículos (carros, motos, bicicletas)

Ver listado de vehículos registrados

Generar/regenerar QR para cada vehículo

Marcar vehículos como inactivos cuando sea necesario

4. Gestión de Mascotas
Registrar mascotas con toda su información

Actualizar información de mascotas existentes

Subir fotos de las mascotas

Gestionar estado de vacunación

5. Reservas de Áreas Comunes
Consultar disponibilidad de áreas comunes

Solicitar reservas para fechas y horarios específicos

Ver historial de reservas realizadas

Cancelar reservas pendientes

Gestionar lista de invitados para cada reserva

Ver/descargar QRs para anfitrión e invitados

6. Gestión de Expensas y Pagos
Consultar estado de expensas (pagadas, pendientes, vencidas)

Ver detalle completo de cada expensa (cuota básica, reservas, multas)

Realizar pagos mediante diferentes métodos

Subir comprobantes de pago

Ver historial de pagos realizados

7. Gestión de Visitas
Registrar visitas anticipadas con información de visitantes

Ver/descargar QR para cada visita registrada

Consultar historial de visitas

Cancelar visitas programadas

8. Reportes e Incidencias
Reportar problemas (mantenimiento, ruido, seguridad, etc.)

Seguimiento del estado de reportes realizados

Agregar comentarios a reportes existentes

Subir fotos como evidencia de reportes

9. Notificaciones y Comunicaciones
Ver notificaciones del sistema

Marcar notificaciones como leídas

Recibir alertas sobre cambios de estado en reportes/reservas

Flujos Críticos de Validación
El sistema debe validar automáticamente:

Restricciones por mora (impedir reservas si tiene 3+ meses de mora)

Límites de capacidad en áreas comunes

Disponibilidad de áreas en fechas/horas solicitadas

Horarios permitidos según configuración de cada área

Endpoints Clave para el Frontend
/api/token/ - Autenticación

/api/api/propietarios/{id}/ - Datos del propietario

/api/api/unidades/ - Unidades del propietario

/api/api/vehiculos/ - Vehículos del propietario

/api/api/reservas/ - Reservas del propietario

/api/api/expensas/ - Expensas del propietario

/api/api/visitas/ - Visitas programadas