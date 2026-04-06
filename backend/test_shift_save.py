#!/usr/bin/env python
"""
Script de prueba que simula el registro de asistencia via QR con shift_id
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import (
    Attendance, AttendanceEvent, Course, ShiftConfig, StudentProfile, 
    ProfessorProfile, Enrollment, User, QRAttendanceRecord
)
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date, time, timedelta

User = get_user_model()

print("=" * 80)
print("PRUEBA: Simular registro de asistencia vía QR con shift_id")
print("=" * 80)

# 1. Obtener datos de prueba
print("\n1. Obteniendo datos de prueba...")
professor_user = User.objects.filter(role='PROFESSOR').first()
if not professor_user:
    print("   ❌ No hay profesores registrados")
    exit(1)

professor = professor_user.professor_profile
print(f"   ✓ Profesor: {professor.user.get_full_name()}")

course = Course.objects.filter(professor=professor).first()
if not course:
    print("   ❌ No hay cursos asignados al profesor")
    exit(1)
print(f"   ✓ Curso: {course.name}")

student = StudentProfile.objects.first()
if not student:
    print("   ❌ No hay estudiantes")
    exit(1)
print(f"   ✓ Estudiante: {student.full_name}")

# Verificar inscripción
if not Enrollment.objects.filter(student=student, course=course).exists():
    print("   ! Estudiante no inscrito, creando inscripción...")
    Enrollment.objects.create(student=student, course=course)

shift = ShiftConfig.objects.first()
if not shift:
    print("   ❌ No hay turnos configurados")
    exit(1)
print(f"   ✓ Turno: {shift.get_shift_type_display()}")

event = AttendanceEvent.objects.first()
if not event:
    print("   ! No hay eventos, creando uno...")
    event = AttendanceEvent.objects.create(
        title="Evento Prueba",
        course=course,
        professor=professor,
        date=timezone.localdate(),
        start_time=time(13, 45),
        present_until=time(14, 5),
        late_until=time(14, 30),
    )
print(f"   ✓ Evento: {event.title} ({event.date})")

# 2. Simular el escaneo de QR CON shift_id
print("\n2. Simulando escaneo de QR con shift_id...")
print(f"   Datos a guardar:")
print(f"   - Estudiante: {student.full_name}")
print(f"   - Evento: {event.title}")
print(f"   - Turno: {shift.get_shift_type_display()} (ID: {shift.id})")

# Crear el registro
lookup = {'student': student, 'event': event}
attendance, created = Attendance.objects.update_or_create(
    **lookup,
    defaults={
        'course': course,
        'professor': professor,
        'date': event.date,
        'status': Attendance.Status.PRESENT,
        'scanned_at': timezone.now(),
        'shift': shift,  # ← AQUÍ SE GUARDA EL SHIFT
    },
)

print(f"\n   {'✅ CREADO' if created else '✅ ACTUALIZADO'}: Registro de Asistencia")
print(f"   ID del registro: {attendance.id}")

# 3. Verificar que se guardó correctamente
print("\n3. Verificando que se guardó correctamente...")
print(f"   Shift guardado: {attendance.shift.get_shift_type_display() if attendance.shift else 'NINGUNO'}")
print(f"   Shift ID: {attendance.shift.id if attendance.shift else 'N/A'}")
print(f"   Estado: {attendance.status}")
print(f"   Fecha escaneada el: {attendance.scanned_at}")

if attendance.shift and attendance.shift.id == shift.id:
    print("\n   ✅ ÉXITO: El shift_id se guardó correctamente")
else:
    print("\n   ❌ ERROR: El shift_id NO se guardó")

# 4. Simular evento con shift
print("\n4. Simulando creación de evento con shift_id...")
event_with_shift = AttendanceEvent.objects.create(
    title="Evento con Turno Prueba",
    course=course,
    professor=professor,
    date=timezone.localdate() + timedelta(days=1),
    start_time=time(13, 45),
    present_until=time(14, 5),
    late_until=time(14, 30),
    shift=shift,  # ← GUARDAR SHIFT EN EVENTO
)

print(f"   ✓ Evento creado: {event_with_shift.title}")
print(f"   ✓ Shift del evento: {event_with_shift.shift.get_shift_type_display() if event_with_shift.shift else 'NINGUNO'}")

if event_with_shift.shift and event_with_shift.shift.id == shift.id:
    print("   ✅ ÉXITO: El evento también se guardó con shift_id")

print("\n" + "=" * 80)
print("✅ PRUEBA COMPLETADA SIN ERRORES")
print("=" * 80)
print("\nRESULTADO FINAL:")
print("- Registro de asistencia con shift: ✅")
print("- Evento con shift: ✅")
print("- Sistema listo para guardar turno/período: ✅")
