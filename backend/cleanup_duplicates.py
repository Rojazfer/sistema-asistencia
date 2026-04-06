#!/usr/bin/env python
"""
Script para limpiar 89 registros de Attendance duplicados.
Mantiene el registro más reciente y elimina los duplicados.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Attendance
from django.db.models import Count

print('=' * 70)
print('LIMPIEZA DE ASISTENCIAS DUPLICADAS')
print('=' * 70)

# Buscar grupos de registros duplicados
duplicates = Attendance.objects.values('student', 'date', 'course').annotate(
    count=Count('id')
).filter(count__gt=1).order_by('-count')

print(f'\nEncontrados {duplicates.count()} grupos de duplicados')
print('-' * 70)

total_deleted = 0
affected_groups = 0

for dup in duplicates:
    student_id = dup['student']
    date = dup['date']
    course_id = dup['course']
    count = dup['count']
    
    # Obtener todos los registros de este grupo
    attendances = Attendance.objects.filter(
        student_id=student_id,
        date=date,
        course_id=course_id
    ).order_by('-scanned_at', '-registered_at', '-id')
    
    # Información del registro a mantener
    keep_record = attendances.first()
    delete_records = list(attendances[1:])
    
    affected_groups += 1
    deleted_count = len(delete_records)
    total_deleted += deleted_count
    
    # Obtener información para reporte
    from core.models import StudentProfile, Course
    try:
        student = StudentProfile.objects.get(id=student_id)
        course = Course.objects.get(id=course_id)
        student_name = student.full_name
        course_name = f"{course.name} - {course.parallel}"
    except:
        student_name = f"ID {student_id}"
        course_name = f"ID {course_id}"
    
    print(f'\n📅 {student_name} | {course_name} | {date}')
    print(f'   Mantener: ID {keep_record.id} - {keep_record.status} (scanned: {keep_record.scanned_at})')
    
    for rec in delete_records:
        print(f'   ❌ Eliminar: ID {rec.id} - {rec.status} (scanned: {rec.scanned_at})')
    
    # Eliminar los duplicados (excepto el más reciente)
    for record in delete_records:
        record.delete()

print('\n' + '=' * 70)
print('RESUMEN')
print('=' * 70)
print(f'Grupos de duplicados procesados: {affected_groups}')
print(f'Registros eliminados: {total_deleted}')
print(f'Registros de asistencia mantenidos: {Attendance.objects.count()}')

# Verificar que no hay más duplicados
remaining_dups = Attendance.objects.values('student', 'date', 'course').annotate(
    count=Count('id')
).filter(count__gt=1)

if remaining_dups.exists():
    print(f'\n⚠️  ¡ATENCIÓN! Aún hay {remaining_dups.count()} grupos de duplicados')
else:
    print('\n✅ ¡Éxito! No hay más asistencias duplicadas')

print('=' * 70)
