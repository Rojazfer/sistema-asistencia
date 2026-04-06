#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import User, Attendance, ProfessorProfile

# Contar todos los registros de asistencia
att_count = Attendance.objects.all().count()

# Eliminar TODOS los registros de asistencia
Attendance.objects.all().delete()

# Contar profesores que quedaron en el sistema
prof_count = ProfessorProfile.objects.all().count()
user_prof_count = User.objects.filter(role='PROFESSOR').count()

print(f'✓ Eliminados {att_count} registros de asistencia')
print(f'✓ Profesores conservados en el sistema: {prof_count}')
print(f'✓ Usuarios profesor conservados: {user_prof_count}')
print(f'✓ Base de datos limpia - solo quedan los profesores sin registros de asistencia')
