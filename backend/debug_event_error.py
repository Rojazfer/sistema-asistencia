#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import AttendanceEvent, Enrollment, StudentProfile, Course

# Buscar el evento "Evento con Turno Prueba"
events = AttendanceEvent.objects.filter(title__icontains='prueba')
print("📋 Eventos con 'Prueba':")
for e in events:
    print(f"  ID: {e.id}, Título: {e.title}, Curso: {e.course.name} ({e.course.parallel})")

# Buscar el estudiante
student = StudentProfile.objects.get(ci='14354565')
print(f"\n👤 Estudiante: {student.full_name} (CI: {student.ci})")

# Ver en qué cursos está inscrito
enrollments = Enrollment.objects.filter(student=student)
print(f"  Inscrito en {enrollments.count()} cursos:")
for e in enrollments:
    print(f"    - {e.course.name} ({e.course.parallel})")

# Ver todos los cursos disponibles
print("\n📚 Todos los cursos:")
for c in Course.objects.all():
    print(f"  - {c.name} ({c.parallel})")

# Ver el evento activo actualmente
print("\n📌 Últimos eventos creados:")
for e in AttendanceEvent.objects.all().order_by('-id')[:5]:
    print(f"  ID: {e.id}, {e.title}, Curso: {e.course.name} ({e.course.parallel})")
