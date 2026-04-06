#!/usr/bin/env python
"""
Script de prueba para verificar que el shift_id se está guardando correctamente
en los registros de asistencia y eventos.
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Attendance, AttendanceEvent, Course, ShiftConfig, StudentProfile, User, ProfessorProfile, Enrollment
from django.contrib.auth import get_user_model
from datetime import date, time, timedelta
from django.utils import timezone

User = get_user_model()

print("=" * 80)
print("TEST: Verificar que shift_id se guarda en Attendance y AttendanceEvent")
print("=" * 80)

# 1. Verificar que los ShiftConfig existan
print("\n1. Verificando ShiftConfig...")
shifts = ShiftConfig.objects.all()
print(f"   Turnos disponibles: {shifts.count()}")
for shift in shifts:
    print(f"   - {shift.get_shift_type_display()} (ID: {shift.id})")

if not shifts.exists():
    print("   ⚠️  No hay turnos configurados")
    exit(1)

# 2. Verificar que hay registros de Attendance con shift
print("\n2. Verificando registros de Attendance con shift...")
attendance_with_shift = Attendance.objects.filter(shift__isnull=False)
print(f"   Total de registros con shift: {attendance_with_shift.count()}")
for att in attendance_with_shift[:5]:
    print(f"   - Estudiante: {att.student.full_name}, Shift: {att.shift.get_shift_type_display()}, Fecha: {att.date}")

# 3. Verificar que hay eventos con shift
print("\n3. Verificando eventos con shift...")
events_with_shift = AttendanceEvent.objects.filter(shift__isnull=False)
print(f"   Total de eventos con shift: {events_with_shift.count()}")
for event in events_with_shift[:5]:
    print(f"   - Evento: {event.title}, Shift: {event.shift.get_shift_type_display()}, Fecha: {event.date}")

# 4. Contar registros sin shift para comparar
print("\n4. Estadísticas de registros...")
attendance_no_shift = Attendance.objects.filter(shift__isnull=True)
print(f"   Registros de Attendance SIN shift: {attendance_no_shift.count()}")
print(f"   Registros de Attendance CON shift: {attendance_with_shift.count()}")

events_no_shift = AttendanceEvent.objects.filter(shift__isnull=True)
print(f"   Eventos SIN shift: {events_no_shift.count()}")
print(f"   Eventos CON shift: {events_with_shift.count()}")

# 5. Ejemplo específico: si hay registros de hoy
print("\n5. Registros de hoy...")
today = timezone.localdate()
today_attendance = Attendance.objects.filter(date=today)
print(f"   Total registros de hoy: {today_attendance.count()}")
today_with_shift = today_attendance.filter(shift__isnull=False)
print(f"   De hoy CON shift: {today_with_shift.count()}")
if today_with_shift.exists():
    for att in today_with_shift[:3]:
        print(f"   - {att.student.full_name}: {att.shift.get_shift_type_display()} - {att.status}")

print("\n" + "=" * 80)
print("✅ TEST COMPLETADO")
print("=" * 80)
print("\nRESUMEN:")
print(f"- Turnos configurados: {shifts.count()}")
print(f"- Registros con shift: {attendance_with_shift.count()}")
print(f"- Eventos con shift: {events_with_shift.count()}")

if attendance_with_shift.count() > 0:
    print("\n✅ El sistema ESTÁ guardando correctamente el shift_id")
else:
    print("\n⚠️  No se han encontrado registros con shift. Prueba escanear nuevamente.")
