"""
Management command para generar registros ABSENT para todos los estudiantes
inscritos que no tienen un registro de asistencia para un evento específico.
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from core.models import Attendance, AttendanceEvent, Enrollment


class Command(BaseCommand):
    help = 'Genera registros ABSENT para estudiantes sin asistencia en un evento'

    def add_arguments(self, parser):
        parser.add_argument(
            '--event-id',
            type=int,
            help='ID del evento para generar ABSENT records'
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Generar para todos los eventos activos'
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options['all']:
            events = AttendanceEvent.objects.filter(is_active=True)
        elif options['event_id']:
            events = AttendanceEvent.objects.filter(id=options['event_id'])
        else:
            self.stdout.write(self.style.ERROR('Debes usar --event-id o --all'))
            return

        total_created = 0
        for event in events:
            # Obtener estudiantes inscritos en el curso del evento
            enrollments = Enrollment.objects.filter(course=event.course)
            
            for enrollment in enrollments:
                student = enrollment.student
                professor = event.professor
                
                # Verificar si ya existe un registro para este estudiante-evento-fecha
                attendance_exists = Attendance.objects.filter(
                    student=student,
                    course=event.course,
                    professor=professor,
                    date=event.date,
                    event=event
                ).exists()
                
                # Si no existe, crear un registro ABSENT
                if not attendance_exists:
                    Attendance.objects.create(
                        student=student,
                        course=event.course,
                        professor=professor,
                        event=event,
                        date=event.date,
                        status=Attendance.Status.ABSENT
                    )
                    total_created += 1

        self.stdout.write(
            self.style.SUCCESS(f'✓ Se crearon {total_created} registros ABSENT')
        )
