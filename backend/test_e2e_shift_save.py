#!/usr/bin/env python
"""
Test end-to-end para verificar que el sistema guarda shift_id correctamente
cuando un profesor escanea un QR con un período seleccionado.
"""
import os
import django
import json
from datetime import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from rest_framework.test import APIClient
from core.models import StudentProfile, Course, Professor, Enrollment, AttendanceEvent, Attendance, ShiftConfig

# Crear cliente API
client = APIClient()

print("=" * 70)
print("TEST END-TO-END: QR Scanning with Period Selection")
print("=" * 70)

# 1. Obtener datos de ejemplo (Profesor, Cursos, Estudiantes, Turnos)
print("\n1️⃣  Preparando datos...")

professors = Professor.objects.all()[:1]
if not professors:
    print("❌ No hay profesores en la base de datos")
    exit(1)

professor = professors[0]
print(f"   ✅ Profesor: {professor.user.first_name} {professor.user.last_name}")

courses = professor.courses.all()[:1]
if not courses:
    print("❌ El profesor no tiene cursos asignados")
    exit(1)

course = courses[0]
print(f"   ✅ Curso: {course.name}")

students = course.students.all()[:1]
if not students:
    print("❌ El curso no tiene estudiantes")
    exit(1)

student = students[0]
print(f"   ✅ Estudiante: {student.full_name} (CI: {student.ci})")

shifts = ShiftConfig.objects.filter(shift_type__icontains='MANANA')[:1]
if not shifts:
    print("❌ No hay turnos MANANA en la base de datos")
    exit(1)

shift = shifts[0]
print(f"   ✅ Turno: {shift.shift_type} (ID: {shift.id})")

# 2. Autenticar como profesor
print("\n2️⃣  Autenticando como profesor...")
client.force_authenticate(user=professor.user)
print(f"   ✅ Autenticado: {professor.user.username}")

# 3. Simular escaneo de QR con shift_id
print("\n3️⃣  Simulando escaneo de QR con shift_id...")
qr_code = f"{student.ci}:{course.name}"
payload = {
    "qr_code": qr_code,
    "shift_id": shift.id
}
print(f"   Payload: {json.dumps(payload, indent=4)}")

response = client.post('/api/attendance/scan/', payload, format='json')
print(f"   Status Code: {response.status_code}")

if response.status_code == 200:
    response_data = response.json()
    print(f"   ✅ Respuesta: {response_data}")
else:
    print(f"   ❌ Error: {response.text}")
    print(f"   Response: {response.json()}")

# 4. Verificar en la base de datos que se guardó el shift_id
print("\n4️⃣  Verificando registro en la base de datos...")
attendance = Attendance.objects.filter(
    student=student,
    event__course=course
).order_by('-date').first()

if attendance:
    print(f"   ✅ Registro encontrado:")
    print(f"      ID: {attendance.id}")
    print(f"      Estudiante: {attendance.student.full_name}")
    print(f"      Curso: {attendance.event.course.name}")
    print(f"      Estado: {attendance.status}")
    print(f"      Shift: {attendance.shift.shift_type if attendance.shift else 'NO ASIGNADO'}")
    print(f"      Shift ID: {attendance.shift.id if attendance.shift else 'None'}")
    
    if attendance.shift and attendance.shift.id == shift.id:
        print(f"\n✨ ¡ÉXITO! El shift_id se guardó correctamente.")
    else:
        print(f"\n❌ ERROR: El shift_id esperado es {shift.id}, pero se guardó {attendance.shift.id if attendance.shift else 'None'}")
else:
    print(f"   ❌ No se encontró registro de asistencia")

print("\n" + "=" * 70)
