"""
Django signals para la app core.
Genera registros ABSENT automáticamente cuando se crea un AttendanceEvent.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction
from .models import AttendanceEvent, Attendance, Enrollment


@receiver(post_save, sender=AttendanceEvent)
def generate_absent_attendance_records(sender, instance, created, **kwargs):
    """
    Cuando se crea un nuevo AttendanceEvent, genera registros ABSENT para todos
    los estudiantes inscritos en el curso que aún no tienen registro.
    """
    if not created:
        return

    event = instance
    
    try:
        with transaction.atomic():
            # Obtener todos los estudiantes inscritos en este curso
            enrollments = Enrollment.objects.filter(course=event.course)
            
            created_count = 0
            for enrollment in enrollments:
                student = enrollment.student
                
                # Verificar si ya existe un registro
                attendance_exists = Attendance.objects.filter(
                    student=student,
                    course=event.course,
                    professor=event.professor,
                    date=event.date,
                    event=event
                ).exists()
                
                # Crear registro ABSENT si no existe
                if not attendance_exists:
                    Attendance.objects.create(
                        student=student,
                        course=event.course,
                        professor=event.professor,
                        event=event,
                        date=event.date,
                        status=Attendance.Status.ABSENT
                    )
                    created_count += 1
            
            if created_count > 0:
                print(f"✓ Creados {created_count} registros ABSENT para evento: {event}")
    except Exception as e:
        print(f"✗ Error al generar registros ABSENT: {str(e)}")


def ready():
    """
    Esta función se llama cuando la app está lista.
    La importamos en apps.py para inicializar los signals.
    """
    pass
