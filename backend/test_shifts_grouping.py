#!/usr/bin/env python
import json
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import ShiftConfig

# Obtener los 8 turnos
shifts = ShiftConfig.objects.all().order_by('shift_type')
print("📋 Turnos en formato JSON (como los devuelve la API):")
print(json.dumps([
    {
        'id': s.id,
        'shift_type': s.shift_type,
        'shift_type_display': str(s.shift_type),  # Usar el shift_type directamente
        'start_time': str(s.start_time),
        'tolerance_minutes': s.tolerance_minutes,
        'late_minutes': s.late_minutes
    }
    for s in shifts
], indent=2, ensure_ascii=False))

# Simular lo que haría organizePeriodsByShiftType
print("\n\n📊 Agrupamiento por tipo (Frontend):")
morning = []
afternoon = []

for shift in shifts:
    shift_type_upper = str(shift.shift_type).upper()
    if 'MANANA' in shift_type_upper:
        morning.append(shift.shift_type)
    elif 'TARDE' in shift_type_upper:
        afternoon.append(shift.shift_type)

print(f"\n🌄 Mañana ({len(morning)} turnos):")
for s in morning:
    print(f"   - {s}")

print(f"\n🌆 Tarde ({len(afternoon)} turnos):")
for s in afternoon:
    print(f"   - {s}")
