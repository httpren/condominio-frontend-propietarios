#!/usr/bin/env python
import os
import sys
import django

# Configurar Django
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'condominio.settings')
django.setup()

from core.models import Comunicado, Propietario, PushSubscription
from django.contrib.auth import get_user_model
from core.utils.push import broadcast_push
import logging

# Configurar logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def test_comunicado_with_debug():
    print('🔍 Diagnosticando creación de comunicado con debug...')
    
    try:
        # Obtener propietario
        propietario_id = 9
        propietario = Propietario.objects.filter(id=propietario_id).first()
        
        if not propietario:
            print(f"❌ Propietario con ID {propietario_id} no encontrado")
            return False
        
        print(f"✅ Propietario encontrado: {propietario.user.username}")
        
        # Verificar suscripciones activas
        subs = PushSubscription.objects.filter(activo=True)
        print(f"📱 Suscripciones activas totales: {subs.count()}")
        
        subs_propietario = PushSubscription.objects.filter(propietario=propietario, activo=True)
        print(f"📱 Suscripciones del propietario {propietario_id}: {subs_propietario.count()}")
        
        for sub in subs_propietario:
            print(f"   - Endpoint: {sub.endpoint[:50]}...")
            print(f"   - Activo: {sub.activo}")
            print(f"   - Creado: {sub.created_at}")
        
        # Crear comunicado
        print("\n📝 Creando comunicado...")
        comunicado = Comunicado.objects.create(
            titulo='🔍 Comunicado de Debug',
            mensaje='Este comunicado es para debuggear el envío de notificaciones push.',
            tipo='general',
            propietario=propietario,
            es_masivo=True
        )
        
        print(f'✅ Comunicado creado: ID {comunicado.id}')
        print(f'   Título: {comunicado.titulo}')
        print(f'   Es masivo: {comunicado.es_masivo}')
        
        # Simular el envío de notificación como lo hace el backend
        print("\n📤 Simulando envío de notificación...")
        
        payload = {
            'title': comunicado.titulo[:80],
            'body': comunicado.mensaje[:120],
            'icon': '/static/icons/icon-192x192.png',
            'badge': '/static/icons/badge-72x72.png',
            'data': {
                'type': 'comunicado',
                'id': comunicado.id,
                'tipo': comunicado.tipo,
                'es_masivo': comunicado.es_masivo,
                'timestamp': comunicado.fecha_envio.isoformat(),
                'url': f'/comunicados/{comunicado.id}'
            },
            'actions': [
                {
                    'action': 'view',
                    'title': 'Ver Comunicado'
                },
                {
                    'action': 'dismiss',
                    'title': 'Cerrar'
                }
            ],
            'requireInteraction': True,
            'tag': f'comunicado-{comunicado.id}'
        }
        
        print(f"📋 Payload generado:")
        for key, value in payload.items():
            print(f"   {key}: {value}")
        
        # Obtener suscripciones para envío
        if comunicado.es_masivo:
            subs_to_send = PushSubscription.objects.filter(activo=True).select_related('propietario')
            print(f"\n📱 Enviando a suscripciones masivas: {subs_to_send.count()}")
        else:
            subs_to_send = PushSubscription.objects.filter(propietario=comunicado.propietario, activo=True)
            print(f"\n📱 Enviando a suscripciones del propietario: {subs_to_send.count()}")
        
        # Enviar notificación
        try:
            sent_count = broadcast_push(subs_to_send, payload)
            print(f"✅ Notificaciones enviadas: {sent_count}")
        except Exception as e:
            print(f"❌ Error enviando notificación: {e}")
            import traceback
            traceback.print_exc()
            return False
        
        return True
        
    except Exception as e:
        print(f'❌ Error: {e}')
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = test_comunicado_with_debug()
    if success:
        print('\n🎉 ¡Diagnóstico completado!')
    else:
        print('\n💥 Diagnóstico fallido')
