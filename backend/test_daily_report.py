#!/usr/bin/env python
"""
Script de testing para el endpoint de reporte diario de eventos.
Simula una solicitud a /api/professor/daily-report/
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import ProfessorProfile, AttendanceEvent, Attendance
from core.views import ProfessorDailyEventsReportView
from django.test import RequestFactory
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIRequestFactory
from rest_framework.test import force_authenticate

User = get_user_model()

print('=' * 70)
print('TESTING: Reporte Diario de Eventos')
print('=' * 70)

# Crear request factory
factory = APIRequestFactory()

# Obtener un profesor
professor = ProfessorProfile.objects.first()
if not professor:
    print('❌ No hay profesores en la base de datos')
    exit(1)

print(f'\n✓ Profesor: {professor}')

# Crear request como si fuera del profesor
request = factory.get('/api/professor/daily-report/')
force_authenticate(request, user=professor.user)

# Crear instancia de la vista y hacer la solicitud
view = ProfessorDailyEventsReportView.as_view()
response = view(request)

print(f'✓ Status Code: {response.status_code}')

if response.status_code == 200:
    data = response.data
    print(f'\n📊 REPORTE DIARIO')
    print('-' * 70)
    print(f'Fecha: {data["date"]}')
    print(f'Profesor: {data["professor_name"]}')
    print(f'Total de eventos: {data["total_events"]}')
    print(f'\n📈 ESTADÍSTICAS TOTALES')
    print(f'  Estudiantes inscritos: {data["total_enrolled_all_events"]}')
    print(f'  ✅ Presentes: {data["total_present_all_events"]}')
    print(f'  ⏰ Tardíos: {data["total_late_all_events"]}')
    print(f'  ❌ Ausentes: {data["total_absent_all_events"]}')
    print(f'  📱 Escaneados: {data["total_scanned_all_events"]}')
    print(f'  📊 Asistencia: {data["attendance_percentage"]}%')
    
    # Detalles por evento
    if data["events"]:
        print(f'\n🎓 EVENTOS ({len(data["events"])})')
        print('-' * 70)
        for event in data["events"]:
            print(f'\n  📚 {event["title"]}')
            print(f'     Horario: {event["start_time"]} - Presente hasta: {event["present_until"]}')
            print(f'     Inscritos: {event["total_enrolled"]}')
            print(f'     ✅ Presentes: {event["present_count"]}')
            print(f'     ⏰ Tardíos: {event["late_count"]}')
            print(f'     ❌ Ausentes: {event["absent_count"]}')
            print(f'     📱 Escaneados: {event["scanned_count"]}')
            
            # Mostrar primeros 5 estudiantes
            print(f'\n     Primeros 5 estudiantes:')
            for record in event["attendance_records"][:5]:
                status_icon = {
                    'PRESENT': '✅',
                    'LATE': '⏰',
                    'ABSENT': '❌',
                    'NO_REGISTRADO': '❓'
                }.get(record['status'], '?')
                print(f'       {status_icon} {record["student_name"]}: {record["status"]}')
            
            if len(event["attendance_records"]) > 5:
                print(f'       ... y {len(event["attendance_records"]) - 5} más')
    else:
        print('\n📭 No hay eventos para este día')
    
    print('\n' + '=' * 70)
    print('✅ TESTING COMPLETADO EXITOSAMENTE')
    print('=' * 70)
    
else:
    print(f'❌ Error: {response.data}')
