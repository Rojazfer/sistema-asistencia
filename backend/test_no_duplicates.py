#!/usr/bin/env python
"""
Script para testing: Verifica que NO se crean duplicados
al intentar registrar asistencia múltiples veces.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Attendance, StudentProfile, Course, ProfessorProfile, AttendanceEvent
from django.utils import timezone
from datetime import date, time

print('=' * 70)
print('TESTING: Verificación de NO duplicados')
print('=' * 70)

# Obtener datos de prueba
try:
    professor = ProfessorProfile.objects.first()
    course = Course.objects.filter(professor=professor).first()
    student = course.enrollments.first().student
    
    if not (professor and course and student):
        print('❌ Error: No hay datos de prueba (profesor/curso/estudiante)')
        exit(1)
    
    print(f'✓ Datos de prueba encontrados')
    print(f'  Profesor: {professor}')
    print(f'  Curso: {course}')
    print(f'  Estudiante: {student}')
    print()
    
except Exception as e:
    print(f'❌ Error al obtener datos: {e}')
    exit(1)

# Crear un evento de prueba
try:
    event = AttendanceEvent.objects.create(
        course=course,
        professor=professor,
        title='Test Event',
        date=timezone.localdate(),
        start_time=time(7, 30),
        present_until=time(8, 0),
        late_until=time(8, 30),
        is_active=True
    )
    print(f'✓ Evento de prueba creado: ID={event.id}')
    print()
except Exception as e:
    print(f'❌ Error al crear evento: {e}')
    exit(1)

# Test: Intentar crear el mismo registro 3 veces
print('-' * 70)
print('TEST 1: Crear mismo registro 3 veces (debe continuar siendo 1)')
print('-' * 70)

test_date = timezone.localdate()
initial_count = Attendance.objects.filter(
    student=student, 
    course=course, 
    date=test_date,
    event=event
).count()

print(f'Registros iniciales: {initial_count}')

for i in range(3):
    try:
        att, created = Attendance.objects.update_or_create(
            student=student,
            course=course,
            date=test_date,
            event=event,
            defaults={
                'professor': professor,
                'status': 'PRESENT',
                'scanned_at': timezone.now(),
                'shift': None,
            }
        )
        print(f'  Intento {i+1}: {"✓ Creado" if created else "✓ Actualizado"} (ID={att.id})')
    except Exception as e:
        print(f'  ❌ Intento {i+1} falló: {e}')

final_count = Attendance.objects.filter(
    student=student, 
    course=course, 
    date=test_date,
    event=event
).count()

print(f'Registros finales: {final_count}')
if final_count == 1:
    print('✅ ÉXITO: Sin duplicados creados')
else:
    print(f'❌ FALLO: Se crearon {final_count} registros (debería ser 1)')

# Test 2: Diferentes eventos el mismo día
print()
print('-' * 70)
print('TEST 2: Múltiples eventos el mismo día (cada uno = 1 registro)')
print('-' * 70)

try:
    event2 = AttendanceEvent.objects.create(
        course=course,
        professor=professor,
        title='Test Event 2',
        date=timezone.localdate(),
        start_time=time(10, 0),
        present_until=time(10, 30),
        late_until=time(11, 0),
        is_active=True
    )
    print(f'✓ Segundo evento creado: ID={event2.id}')
except Exception as e:
    print(f'❌ Error: {e}')
    exit(1)

try:
    att1, _ = Attendance.objects.update_or_create(
        student=student,
        course=course,
        date=test_date,
        event=event,
        defaults={
            'professor': professor,
            'status': 'PRESENT',
            'scanned_at': timezone.now(),
            'shift': None,
        }
    )
    print(f'✓ Registro para evento 1: ID={att1.id}')
    
    att2, _ = Attendance.objects.update_or_create(
        student=student,
        course=course,
        date=test_date,
        event=event2,
        defaults={
            'professor': professor,
            'status': 'LATE',
            'scanned_at': timezone.now(),
            'shift': None,
        }
    )
    print(f'✓ Registro para evento 2: ID={att2.id}')
    
    same_date_count = Attendance.objects.filter(
        student=student,
        course=course,
        date=test_date
    ).count()
    
    print(f'Total de registros para {student} el {test_date}: {same_date_count}')
    
    if att1.id != att2.id and same_date_count == 2:
        print('✅ ÉXITO: Cada evento tiene su propio registro')
    else:
        print(f'❌ FALLO: IDs iguales o conteo incorrecto')
        
except Exception as e:
    print(f'❌ Error: {e}')

# Limpiar datos de prueba
print()
print('-' * 70)
print('LIMPIEZA')
print('-' * 70)
event.delete()
event2.delete()
Attendance.objects.filter(student=student, course=course, date=test_date).delete()
print('✓ Datos de prueba eliminados')

print()
print('=' * 70)
print('TESTING COMPLETADO')
print('=' * 70)
