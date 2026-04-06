#!/usr/bin/env python
import os
import django
from datetime import datetime, timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import AttendanceEvent, ProfessorProfile

# Ver la fecha/hora actual del servidor
now = timezone.now()
print(f"⏰ Hora actual del servidor: {now}")
print(f"   Zona horaria: {now.tzname()}")

# Obtener el profesor
professor = ProfessorProfile.objects.get(user__username='fernando')

# Ver eventos de hoy
today = now.date()
today_events = AttendanceEvent.objects.filter(
    professor=professor,
    date=today
).order_by('start_time')

print(f"\n📋 Eventos de hoy ({today}) para Fernando Rojas:")
for e in today_events:
    status = "✅ ACTIVO" if now.time() < e.late_until else "❌ CERRADO"
    print(f"  ID: {e.id:2d} | {e.title:30s} | {e.start_time} - {e.late_until} | {status} | Shift: {e.shift if e.shift else 'None'}")

# Ver eventos de mañana
tomorrow = today + timedelta(days=1)
tomorrow_events = AttendanceEvent.objects.filter(
    professor=professor,
    date=tomorrow
).order_by('start_time')

print(f"\n📋 Eventos de mañana ({tomorrow}) para Fernando Rojas:")
for e in tomorrow_events:
    print(f"  ID: {e.id:2d} | {e.title:30s} | {e.start_time} - {e.late_until} | Shift: {e.shift if e.shift else 'None'}")

print(f"\n💡 Recomendación:")
print(f"  Si necesitas escanear QR hoy, crea un evento con horas que cubran 18:00 (6 PM)")
