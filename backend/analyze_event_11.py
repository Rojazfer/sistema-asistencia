#!/usr/bin/env python
import os
import django
from datetime import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import AttendanceEvent, Attendance, QRAttendanceRecord

print("📋 Analizando el evento problemático (ID: 11)...")
event = AttendanceEvent.objects.get(id=11)

print(f"\nDetalles del Evento:")
print(f"  ID: {event.id}")
print(f"  Título: {event.title}")
print(f"  Curso: {event.course} (ID: {event.course.id})")
print(f"  Profesor: {event.professor}")
print(f"  Fecha: {event.date}")
print(f"  Hora inicio: {event.start_time}")
print(f"  Presente hasta: {event.present_until}")
print(f"  Retraso hasta: {event.late_until}")
print(f"  Shift: {event.shift}")
print(f"  Creado: {event.created_at}")

# Ver registros de asistencia asociados
print(f"\n📝 Registros de asistencia para este evento:")
attendance_records = Attendance.objects.filter(event=event)
print(f"  Total: {attendance_records.count()}")
for a in attendance_records[:5]:
    print(f"    - {a.student.full_name}: {a.status} (Shift: {a.shift})")

# Ver QR records
print(f"\n📱 Registros de QR escaneados:")
qr_records = QRAttendanceRecord.objects.filter(event=event)
print(f"  Total: {qr_records.count()}")
for q in qr_records[:5]:
    print(f"    - {q.student.full_name}: {q.status} @ {q.scanned_at}")
