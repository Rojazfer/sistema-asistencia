#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Course, ProfessorProfile, StudentProfile, Enrollment, Attendance
from django.db.models import Count
from collections import defaultdict

print('=' * 70)
print('AUDITORÍA DE ESTRUCTURA DE CURSOS Y DUPLICADOS')
print('=' * 70)

# 1. Resumen de Cursos
print('\n1. RESUMEN DE CURSOS EN LA BD')
print('-' * 70)
cursos = Course.objects.all().select_related('professor__user').order_by('professor', 'name', 'parallel')
print(f'Total de cursos: {cursos.count()}\n')

cursos_por_profesor = defaultdict(list)
for curso in cursos:
    profesor = curso.professor.user.get_full_name() or curso.professor.user.username
    cursos_por_profesor[profesor].append(curso)

for prof, cursos_list in sorted(cursos_por_profesor.items()):
    print(f'📚 PROFESOR: {prof}')
    for curso in cursos_list:
        print(f'   [{curso.id}] {curso.name} - {curso.parallel}')
    print()

# 2. Inscripciones por estudiante
print('\n2. ESTUDIANTES CON MÚLTIPLES INSCRIPCIONES (PROBLEMA)')
print('-' * 70)
duplicados = Enrollment.objects.values('student').annotate(count=Count('id')).filter(count__gt=1)
if duplicados.exists():
    print(f'⚠️  Encontrados {duplicados.count()} estudiantes con múltiples inscripciones:\n')
    for dup in duplicados:
        student = StudentProfile.objects.get(id=dup['student'])
        enrollments = student.enrollments.all()
        print(f'   👤 {student.full_name}')
        for enr in enrollments:
            print(f'      • {enr.course.name} - {enr.course.parallel} (Prof: {enr.course.professor.user.username})')
        print()
else:
    print('✓ No hay estudiantes con múltiples inscripciones')

# 3. Registros de asistencia duplicados
print('\n3. REGISTROS DE ASISTENCIA DUPLICADOS (PROBLEMA)')
print('-' * 70)
attendance_dups = Attendance.objects.values('student', 'date', 'course').annotate(count=Count('id')).filter(count__gt=1)
if attendance_dups.exists():
    print(f'⚠️  Encontrados {attendance_dups.count()} asistencias duplicadas:\n')
    for dup in attendance_dups[:10]:
        student = StudentProfile.objects.get(id=dup['student'])
        course = Course.objects.get(id=dup['course'])
        attendances = Attendance.objects.filter(student_id=dup['student'], date=dup['date'], course_id=dup['course'])
        print(f'   📅 {student.full_name} - {course.name} - {dup["date"]}')
        for att in attendances:
            print(f'      • {att.status} (Shift: {att.shift}, Event: {att.event}, ID: {att.id})')
        print()
else:
    print('✓ No hay asistencias duplicadas')

# 4. Cursos con múltiples profesores (PROBLEMA GRAVE)
print('\n4. CURSOS CON MISMO NOMBRE Y PARALELO PERO DIFERENTES PROFESORES (PROBLEMA GRAVE)')
print('-' * 70)
cursos_dup = Course.objects.values('name', 'parallel').annotate(count=Count('id')).filter(count__gt=1)
if cursos_dup.exists():
    print(f'🚨 Encontrados {cursos_dup.count()} nombres/paralelos duplicados:\n')
    for dup in cursos_dup:
        cursos = Course.objects.filter(name=dup['name'], parallel=dup['parallel'])
        print(f'   📚 {dup["name"]} - {dup["parallel"]} ({dup["count"]} profesores)')
        for curso in cursos:
            enrol_count = curso.enrollments.count()
            print(f'      • Prof: {curso.professor.user.get_full_name()} (ID: {curso.id}, Inscripciones: {enrol_count})')
        print()
else:
    print('✓ No hay cursos duplicados (buen estado)')

# 5. Estadísticas generales
print('\n5. ESTADÍSTICAS GENERALES')
print('-' * 70)
print(f'Profesores: {ProfessorProfile.objects.count()}')
print(f'Estudiantes: {StudentProfile.objects.count()}')
print(f'Cursos únicos: {Course.objects.count()}')
print(f'Inscripciones: {Enrollment.objects.count()}')
print(f'Registros de asistencia: {Attendance.objects.count()}')
