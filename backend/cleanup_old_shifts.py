#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import ShiftConfig

# Eliminar los turnos antiguos
old_ids = [7, 8, 12, 13, 14, 15, 16, 17]
deleted_count, _ = ShiftConfig.objects.filter(id__in=old_ids).delete()
print(f"✅ Eliminados {deleted_count} turnos antiguos")

# Verificar que quedan solo los 8 nuevos
remaining = ShiftConfig.objects.all().order_by('start_time', 'shift_type')
print(f"\n📋 Turnos restantes ({remaining.count()}):")
for shift in remaining:
    print(f"  ID:{shift.id:2d} | {shift.shift_type:25s} | Inicio: {shift.start_time}")
