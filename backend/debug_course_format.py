#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Course, Enrollment, StudentProfile

# Ver el curso 6TO - C en detalle
courses = Course.objects.filter(name__icontains='6to', parallel='C')
print("🔍 Cursos con '6to' y 'C':")
for c in courses:
    print(f"  ID: {c.id}")
    print(f"    name: '{c.name}'")
    print(f"    parallel: '{c.parallel}'")
    print(f"    label/str: '{str(c)}'")
    print(f"    profesor: {c.professor}")
    
    # Verificar enrollments
    enrollments = Enrollment.objects.filter(course=c)
    print(f"    Estudiantes: {enrollments.count()}")
    for e in enrollments[:3]:
        print(f"      - {e.student.full_name} (CI: {e.student.ci})")
    print()

# Buscar directamente por el evento problemático
from core.models import AttendanceEvent
event = AttendanceEvent.objects.get(id=11)
print(f"📌 Evento ID 11: {event.title}")
print(f"  Curso ID: {event.course.id}")
print(f"  Curso name: '{event.course.name}'")
print(f"  Curso parallel: '{event.course.parallel}'")
print(f"  Curso str: '{str(event.course)}'")
