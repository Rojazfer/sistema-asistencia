#!/usr/bin/env python
"""
Script para crear/actualizar la estructura de turnos y periodos en la base de datos
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import ShiftConfig
from datetime import time

print("=" * 80)
print("Creando estructura de turnos y períodos")
print("=" * 80)

# Definir turnos y períodos
shifts_data = [
    # MAÑANA
    {
        'shift_type': 'MANANA_INGRESO',
        'display_name': '🌅 Mañana (Ingreso)',
        'start_time': time(7, 30),
        'tolerance_minutes': 15,
        'late_minutes': 30,
    },
    {
        'shift_type': 'MANANA_1ER_PERIODO',
        'display_name': '📗 1er Período Mañana (7:30-9:00)',
        'start_time': time(7, 30),
        'tolerance_minutes': 5,
        'late_minutes': 15,
    },
    {
        'shift_type': 'MANANA_2DO_PERIODO',
        'display_name': '📘 2do Período Mañana (9:20-11:00)',
        'start_time': time(9, 20),
        'tolerance_minutes': 5,
        'late_minutes': 15,
    },
    {
        'shift_type': 'MANANA_3ER_PERIODO',
        'display_name': '📙 3er Período Mañana (11:10-12:00)',
        'start_time': time(11, 10),
        'tolerance_minutes': 5,
        'late_minutes': 15,
    },
    # TARDE
    {
        'shift_type': 'TARDE_INGRESO',
        'display_name': '🌆 Tarde (Ingreso)',
        'start_time': time(14, 0),
        'tolerance_minutes': 15,
        'late_minutes': 30,
    },
    {
        'shift_type': 'TARDE_1ER_PERIODO',
        'display_name': '📗 1er Período Tarde (14:00-15:20)',
        'start_time': time(14, 0),
        'tolerance_minutes': 5,
        'late_minutes': 15,
    },
    {
        'shift_type': 'TARDE_2DO_PERIODO',
        'display_name': '📘 2do Período Tarde (15:30-16:40)',
        'start_time': time(15, 30),
        'tolerance_minutes': 5,
        'late_minutes': 15,
    },
    {
        'shift_type': 'TARDE_3ER_PERIODO',
        'display_name': '📙 3er Período Tarde (17:00-18:20)',
        'start_time': time(17, 0),
        'tolerance_minutes': 5,
        'late_minutes': 15,
    },
]

# Crear o actualizar cada turno
created_count = 0
updated_count = 0

for shift_data in shifts_data:
    shift_type = shift_data['shift_type']
    display_name = shift_data['display_name']
    
    shift, created = ShiftConfig.objects.update_or_create(
        shift_type=shift_type,
        defaults={
            'start_time': shift_data['start_time'],
            'tolerance_minutes': shift_data['tolerance_minutes'],
            'late_minutes': shift_data['late_minutes'],
            'is_active': True,
        }
    )
    
    if created:
        created_count += 1
        action = "✅ CREADO"
    else:
        updated_count += 1
        action = "🔄 ACTUALIZADO"
    
    print(f"{action}: {display_name}")
    print(f"           Hora inicio: {shift_data['start_time'].strftime('%H:%M')}")
    print(f"           Tolerancia: {shift_data['tolerance_minutes']} min | Tarde después: {shift_data['late_minutes']} min")
    print()

print("=" * 80)
print(f"✅ Proceso completado")
print(f"   - Creados: {created_count}")
print(f"   - Actualizados: {updated_count}")
print(f"   - Total: {created_count + updated_count}")
print("=" * 80)

# Mostrar resumen
print("\n📋 Resumen de Turnos Disponibles:\n")

morning_shifts = ShiftConfig.objects.filter(shift_type__startswith='MANANA')
afternoon_shifts = ShiftConfig.objects.filter(shift_type__startswith='TARDE')

print("🌅 TURNOS DE MAÑANA:")
for shift in morning_shifts:
    print(f"   - {shift.shift_type}: {shift.start_time.strftime('%H:%M')}")

print("\n🌆 TURNOS DE TARDE:")
for shift in afternoon_shifts:
    print(f"   - {shift.shift_type}: {shift.start_time.strftime('%H:%M')}")

print("\n✨ Los turnos y períodos están listos para usar en el selector dinámico")
