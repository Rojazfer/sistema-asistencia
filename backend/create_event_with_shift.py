#!/usr/bin/env python
import os
import django
from datetime import datetime, time
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import AttendanceEvent, ProfessorProfile, ShiftConfig

# Obtener profesor
professor = ProfessorProfile.objects.get(user__username='fernando')

# Obtener el shift TARDE_1ER_PERIODO
shift = ShiftConfig.objects.get(id=26)  # TARDE_1ER_PERIODO

# Crear evento para hoy con shift
today = timezone.now().date()
event = AttendanceEvent.objects.create(
    title="Asistencia TARDE 2026-03-26",
    course=professor.courses.first(),
    professor=professor,
    date=today,
    start_time=time(14, 0),      # 2:00 PM
    present_until=time(16, 0),   # 4:00 PM
    late_until=time(17, 0),      # 5:00 PM
    shift=shift                   # Asignar shift
)

print("✅ Evento creado exitosamente:")
print(f"  ID: {event.id}")
print(f"  Título: {event.title}")
print(f"  Fecha: {event.date}")
print(f"  Curso: {event.course}")
print(f"  Profesor: {event.professor}")
print(f"  Shift: {event.shift} (ID: {event.shift.id})")
print(f"  Horas: {event.start_time} - {event.late_until}")

print("\n💡 Instrucciones para la app móvil:")
print(f"  1. Selecciona el curso: 6TO - C")
print(f"  2. Evento activo: Deberías ver '{event.title}'")
print(f"  3. El shift ya está asignado: {event.shift.shift_type}")
print(f"  4. Escanea un QR de estudiante")
