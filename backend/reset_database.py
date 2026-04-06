#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import (
    User, StudentProfile, ProfessorProfile, Course, 
    Enrollment, Attendance, AttendanceEvent, QRAttendanceRecord
)
from django.db import connection

print("=" * 60)
print("LIMPIEZA COMPLETA DE BASE DE DATOS PARA PRODUCCIÓN")
print("=" * 60)

# Contar registros antes de eliminar
att_count = Attendance.objects.count()
qr_count = QRAttendanceRecord.objects.count()
enroll_count = Enrollment.objects.count()
event_count = AttendanceEvent.objects.count()
student_count = StudentProfile.objects.count()

print(f"\n📊 Registros encontrados:")
print(f"   - Asistencias: {att_count}")
print(f"   - Registros QR: {qr_count}")
print(f"   - Inscripciones: {enroll_count}")
print(f"   - Eventos: {event_count}")
print(f"   - Estudiantes: {student_count}")

# Eliminar todos los registros de datos transaccionales
print(f"\n🗑️  Eliminando registros...")

Attendance.objects.all().delete()
print(f"   ✓ {att_count} asistencias eliminadas")

QRAttendanceRecord.objects.all().delete()
print(f"   ✓ {qr_count} registros QR eliminados")

Enrollment.objects.all().delete()
print(f"   ✓ {enroll_count} inscripciones eliminadas")

AttendanceEvent.objects.all().delete()
print(f"   ✓ {event_count} eventos eliminados")

StudentProfile.objects.all().delete()
print(f"   ✓ {student_count} estudiantes eliminados")

# Reiniciar secuencias de auto-increment (solo para SQLite)
print(f"\n🔄 Reiniciando contadores de ID...")

with connection.cursor() as cursor:
    # Para SQLite
    cursor.execute("DELETE FROM sqlite_sequence WHERE name='core_attendance'")
    cursor.execute("DELETE FROM sqlite_sequence WHERE name='core_qrattendancerecord'")
    cursor.execute("DELETE FROM sqlite_sequence WHERE name='core_enrollment'")
    cursor.execute("DELETE FROM sqlite_sequence WHERE name='core_attendanceevent'")
    cursor.execute("DELETE FROM sqlite_sequence WHERE name='core_studentprofile'")
    
print(f"   ✓ Contadores reiniciados a 0")

# Contar lo que quedó
prof_count = ProfessorProfile.objects.count()
user_count = User.objects.count()
course_count = Course.objects.count()

print(f"\n✅ Base de datos limpia y lista para producción")
print(f"\n📋 Elementos conservados:")
print(f"   - Usuarios: {user_count}")
print(f"   - Profesores: {prof_count}")
print(f"   - Cursos: {course_count}")
print(f"\n{'=' * 60}")
print("✨ Sistema listo para empezar desde cero")
print("=" * 60)
