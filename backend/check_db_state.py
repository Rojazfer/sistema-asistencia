#!/usr/bin/env python
"""
Test end-to-end simple con más debug
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import StudentProfile, Course, ProfessorProfile, ShiftConfig

print("🔍 Checking database state...")

# 1. Verificar profesores
professors = ProfessorProfile.objects.all()
print(f"Profesores: {professors.count()}")
for p in professors[:2]:
    print(f"  - {p.user.username}: {p.user.first_name} {p.user.last_name}")

# 2. Verificar cursos
courses = Course.objects.all()
print(f"\nCursos: {courses.count()}")
for c in courses[:2]:
    print(f"  - {c.name} - {c.parallel}")

# 3. Verificar estudiantes
students = StudentProfile.objects.all()
print(f"\nEstudiantes: {students.count()}")
for s in students[:2]:
    print(f"  - {s.full_name} (CI: {s.ci})")

# 4. Verificar turnos
shifts = ShiftConfig.objects.all()
print(f"\nTurnos: {shifts.count()}")
for s in shifts:
    print(f"  - ID:{s.id} {s.shift_type:30s} @ {s.start_time}")

print("\n✅ Database check complete")
