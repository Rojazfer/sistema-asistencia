#!/usr/bin/env python
"""
Test end-to-end: QR Scanning with Period Selection
Simula todo el flujo de un profesor escaneando un código QR con un período seleccionado
"""
import os
import sys
import django
from datetime import datetime
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

try:
    from django.contrib.auth.models import User
    from rest_framework.test import APIClient
    from core.models import StudentProfile, Course, ProfessorProfile, Enrollment, AttendanceEvent, Attendance, ShiftConfig

    print("=" * 80)
    print("TEST END-TO-END: QR Scanning with Period Selection")
    print("=" * 80)

    # 1. Preparar datos
    print("\n1️⃣  Preparando datos...")
    professor = ProfessorProfile.objects.all().first()
    if not professor:
        print("❌ No hay profesores")
        exit(1)
    print(f"   ✅ Profesor: {professor.user.first_name} {professor.user.last_name}")

    course = professor.courses.all().first()
    if not course:
        print("❌ El profesor no tiene cursos")
        exit(1)
    print(f"   ✅ Curso: {course}")

    enrollments = Enrollment.objects.filter(course=course)
    if not enrollments:
        print("❌ El curso no tiene estudiantes enrollados")
        exit(1)

    enrollment = enrollments.first()
    student = enrollment.student
    print(f"   ✅ Estudiante: {student.full_name} (CI: {student.ci})")

    shift = ShiftConfig.objects.filter(shift_type__icontains='MANANA').first()
    if not shift:
        print("❌ No hay turnos MANANA")
        exit(1)
    print(f"   ✅ Turno: {shift.shift_type} (ID: {shift.id})")

    # 2. Autenticar como profesor
    print("\n2️⃣  Autenticando...")
    client = APIClient()
    client.force_authenticate(user=professor.user)
    print(f"   ✅ Autenticado como: {professor.user.username}")

    # 3. Obtener o crear un evento
    print("\n3️⃣  Obteniendo evento...")
    from datetime import time
    
    # Siempre crear un evento nuevo para garantizar que esté activo
    # Eliminar eventos anteriores si existen
    AttendanceEvent.objects.filter(
        course=course,
        professor=professor,
        date=datetime.now().date(),
        title__startswith="Asistencia"
    ).delete()
    
    event = AttendanceEvent.objects.create(
        title=f"Asistencia TEST {datetime.now().strftime('%H%M%S')}",
        course=course,
        professor=professor,
        date=datetime.now().date(),
        start_time=time(6, 0),
        present_until=time(23, 59),
        late_until=time(23, 59)
    )

    print(f"   ✅ Evento: {event.title} (ID: {event.id})")

    # 4. Simular escaneo de QR
    print("\n4️⃣  Escaneando QR con shift_id...")
    qr_payload = f"CI={student.ci}; CURSO={course.name}"
    payload = {
        "qr_payload": qr_payload,
        "event_id": event.id,
        "course_id": course.id,
        "shift_id": shift.id
    }
    print(f"   QR Payload: {qr_payload}")
    print(f"   Event ID: {event.id}")
    print(f"   Shift ID: {shift.id}")

    response = client.post('/api/attendance/scan/', payload, format='json')
    print(f"   Status: {response.status_code}")

    if response.status_code != 200:
        print(f"   ❌ Error: {response.json()}")
        exit(1)

    response_data = response.json()
    print(f"   ✅ Response: {response_data}")

    # 5. Verificar en la base de datos
    print("\n5️⃣  Verificando registro en la base de datos...")
    attendances = Attendance.objects.filter(
        student=student,
        event=event
    ).order_by('-id')

    if not attendances:
        print("❌ No se encontró registro de asistencia")
        exit(1)

    attendance = attendances.first()
    print(f"   ✅ Registro encontrado (ID: {attendance.id})")
    print(f"      Estudiante: {attendance.student.full_name}")
    print(f"      Curso: {attendance.event.course}")
    print(f"      Estado: {attendance.status}")
    print(f"      Fecha: {attendance.date}")
    print(f"      Shift: {attendance.shift.shift_type if attendance.shift else 'NO ASIGNADO'}")

    # 6. Verificar que el shift_id es correcto
    print("\n6️⃣  Verificando shift_id...")
    if attendance.shift and attendance.shift.id == shift.id:
        print(f"   ✨ ¡ÉXITO! ")
        print(f"      Expected shift_id: {shift.id}")
        print(f"      Actual shift_id:   {attendance.shift.id}")
        print(f"      ✅ Coinciden perfectamente")
    else:
        expected = shift.id
        actual = attendance.shift.id if attendance.shift else None
        print(f"   ❌ FALLO")
        print(f"      Expected: {expected}")
        print(f"      Actual: {actual}")
        exit(1)

    print("\n" + "=" * 80)
    print("✨ TEST COMPLETADO: El sistema guarda shift_id correctamente")
    print("=" * 80)

except Exception as e:
    import traceback
    print(f"❌ Error: {e}")
    traceback.print_exc()
    sys.exit(1)
