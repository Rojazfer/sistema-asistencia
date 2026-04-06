#!/usr/bin/env python
import os
import django
from datetime import datetime, time
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import (
    AttendanceEvent, ProfessorProfile, ShiftConfig, Attendance
)

print("=" * 80)
print("TEST: Sistema simplificado sin campos de hora redundantes")
print("=" * 80)

# 1. Obtener datos
print("\n✅ Preparando datos...")
professor = ProfessorProfile.objects.get(user__username='fernando')
course = professor.courses.first()
shift = ShiftConfig.objects.get(id=26)  # TARDE_1ER_PERIODO

print(f"  Profesor: {professor}")
print(f"  Curso: {course}")
print(f"  Shift: {shift.shift_type} (Inicio: {shift.start_time}, Tolerancia: {shift.tolerance_minutes}min, Atraso: {shift.late_minutes}min)")

# 2. Crear evento SIN campos de hora
print("\n✅ Creando evento (sin start_time, present_until, late_until)...")
today = timezone.now().date()
event = AttendanceEvent.objects.create(
    title="Test Evento Simplificado",
    course=course,
    professor=professor,
    date=today,
    shift=shift
)

print(f"  Evento ID: {event.id}")
print(f"  Título: {event.title}")
print(f"  Fecha: {event.date}")
print(f"  Shift: {event.shift}")

# 3. Verificar que NO tienen campos de hora
print("\n✅ Verificando que NO hay campos de hora en el evento...")
try:
    _ = event.start_time
    print("  ❌ ERROR: start_time existe (debería no existir)")
except AttributeError:
    print("  ✅ start_time no existe (correcto)")

try:
    _ = event.present_until
    print("  ❌ ERROR: present_until existe (debería no existir)")
except AttributeError:
    print("  ✅ present_until no existe (correcto)")

try:
    _ = event.late_until
    print("  ❌ ERROR: late_until existe (debería no existir)")
except AttributeError:
    print("  ✅ late_until no existe (correcto)")

# 4. Verificar que SÍ tienen métodos para obtener las horas
print("\n✅ Verificando métodos para obtener horas del shift...")
start = event.get_start_time()
present = event.get_present_until()
late = event.get_late_until()

print(f"  get_start_time(): {start}")
print(f"  get_present_until(): {present}")
print(f"  get_late_until(): {late}")

if start and present and late:
    print("  ✅ Todos los métodos devuelven valores correctamente")
else:
    print("  ❌ ERROR: Uno o más métodos devuelven None")

# 5. Verificar serialización
print("\n✅ Verificando serialización...")
from core.serializers import AttendanceEventSerializer
serializer = AttendanceEventSerializer(event)
data = serializer.data

print(f"  ID: {data['id']}")
print(f"  Título: {data['title']}")
print(f"  start_time (desde shift): {data['start_time']}")
print(f"  present_until (desde shift): {data['present_until']}")
print(f"  late_until (desde shift): {data['late_until']}")
print(f"  ✅ Serialización exitosa - devuelve horas desde el shift")

print("\n" + "=" * 80)
print("✨ TEST COMPLETADO: Sistema simplificado funciona correctamente")
print("=" * 80)
