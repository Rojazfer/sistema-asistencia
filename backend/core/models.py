from datetime import datetime, timedelta
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models import Q


class User(AbstractUser):
	class Role(models.TextChoices):
		ADMIN = 'ADMIN', 'Administrador'
		PROFESSOR = 'PROFESSOR', 'Profesor'
		STUDENT = 'STUDENT', 'Estudiante'

	role = models.CharField(max_length=20, choices=Role.choices, default=Role.STUDENT)

	def __str__(self):
		return f'{self.username} ({self.role})'


class ShiftConfig(models.Model):
	"""Configuración de turnos del colegio (Mañana/Tarde)"""
	
	class ShiftType(models.TextChoices):
		MORNING = 'MORNING', 'Mañana'
		AFTERNOON = 'AFTERNOON', 'Tarde'
	
	shift_type = models.CharField(
		max_length=20,
		choices=ShiftType.choices,
		unique=True,
		verbose_name='Turno'
	)
	start_time = models.TimeField(
		verbose_name='Hora de inicio',
		help_text='Hora en que inicia el turno'
	)
	tolerance_minutes = models.IntegerField(
		default=10,
		verbose_name='Tolerancia para presente (minutos)',
		help_text='Minutos después del inicio para marcar como PRESENTE'
	)
	late_minutes = models.IntegerField(
		default=20,
		verbose_name='Tolerancia para tarde (minutos)',
		help_text='Minutos después del inicio para marcar como TARDE (después de esto se marca AUSENTE)'
	)
	is_active = models.BooleanField(
		default=True,
		verbose_name='Activo',
		help_text='Si está activo, los profesores pueden usar este turno'
	)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)
	
	class Meta:
		verbose_name = 'Configuración de Turno'
		verbose_name_plural = 'Configuración de Turnos'
		ordering = ['shift_type']
	
	def __str__(self):
		return f"{self.get_shift_type_display()} - {self.start_time.strftime('%H:%M')}"
	
	def get_present_until(self):
		"""Calcula la hora límite para marcar presente"""
		dt = datetime.combine(datetime.today(), self.start_time)
		dt_present = dt + timedelta(minutes=self.tolerance_minutes)
		return dt_present.time()
	
	def get_late_until(self):
		"""Calcula la hora límite para marcar tarde"""
		dt = datetime.combine(datetime.today(), self.start_time)
		dt_late = dt + timedelta(minutes=self.late_minutes)
		return dt_late.time()
	
	def get_time_window_display(self):
		"""Retorna el rango de tiempo en formato legible"""
		return f"{self.start_time.strftime('%H:%M')} - {self.get_late_until().strftime('%H:%M')}"


class ProfessorProfile(models.Model):
	user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='professor_profile')
	employee_code = models.CharField(max_length=30, unique=True)

	def __str__(self):
		return f'Prof. {self.user.get_full_name() or self.user.username}'


class StudentProfile(models.Model):
	user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
	student_code = models.CharField(max_length=30, unique=True)
	ci = models.CharField(max_length=20, unique=True, null=True, blank=True)
	full_name = models.CharField(max_length=200, default='')
	course_name = models.CharField(max_length=120, default='')

	def __str__(self):
		return f'{self.full_name} ({self.student_code})'


class Course(models.Model):
	name = models.CharField(max_length=120)
	parallel = models.CharField(max_length=20)
	professor = models.ForeignKey(ProfessorProfile, on_delete=models.CASCADE, related_name='courses')

	class Meta:
		unique_together = ('name', 'parallel', 'professor')

	def __str__(self):
		return f'{self.name} - {self.parallel}'


class Enrollment(models.Model):
	student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='enrollments')
	course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')

	class Meta:
		unique_together = ('student', 'course')
		constraints = [
			models.UniqueConstraint(fields=['student'], name='uq_student_single_course'),
		]


class Attendance(models.Model):
	class Status(models.TextChoices):
		PRESENT = 'PRESENT', 'Presente'
		LATE = 'LATE', 'Tarde'
		ABSENT = 'ABSENT', 'Ausente'

	student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='attendances')
	course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='attendances')
	professor = models.ForeignKey(ProfessorProfile, on_delete=models.CASCADE, related_name='attendances')
	shift = models.ForeignKey('ShiftConfig', on_delete=models.SET_NULL, null=True, blank=True, related_name='attendances', verbose_name='Turno/Periodo')
	event = models.ForeignKey('AttendanceEvent', on_delete=models.SET_NULL, null=True, blank=True, related_name='attendances', verbose_name='Evento')
	date = models.DateField()
	status = models.CharField(max_length=10, choices=Status.choices, default=Status.PRESENT)
	registered_at = models.DateTimeField(auto_now_add=True)
	scanned_at = models.DateTimeField(null=True, blank=True)

	class Meta:
		unique_together = ('student', 'course', 'shift', 'date')

	def __str__(self):
		return f'{self.student} - {self.course} - {self.shift} - {self.date} ({self.status})'


class QRAttendanceRecord(models.Model):
	student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='qr_attendances')
	course = models.ForeignKey(Course, on_delete=models.SET_NULL, null=True, blank=True, related_name='qr_attendances')
	shift = models.ForeignKey('ShiftConfig', on_delete=models.SET_NULL, null=True, blank=True, related_name='qr_attendance_records')
	date = models.DateField()
	scanned_at = models.DateTimeField(auto_now_add=True)
	ci = models.CharField(max_length=20)
	student_name = models.CharField(max_length=200)
	course_name = models.CharField(max_length=120)
	raw_payload = models.TextField()

	class Meta:
		constraints = [
			models.UniqueConstraint(fields=['student', 'course', 'shift', 'date'], name='uq_qr_student_course_shift_date'),
		]

	def __str__(self):
		return f'{self.student_name} - {self.date}'


class AttendanceEvent(models.Model):
	"""Evento de asistencia creado por un profesor para un curso"""
	course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='attendance_events')
	professor = models.ForeignKey(ProfessorProfile, on_delete=models.CASCADE, related_name='attendance_events')
	title = models.CharField(max_length=255, default='')
	date = models.DateField(null=True, blank=True)
	start_time = models.TimeField(null=True, blank=True)
	present_until = models.TimeField(null=True, blank=True, help_text='Hora límite para marcar como presente')
	late_until = models.TimeField(null=True, blank=True, help_text='Hora límite para marcar como tarde')
	is_active = models.BooleanField(default=True, help_text='Si el evento está activo para registrar asistencia')
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ['-date', '-created_at']

	def __str__(self):
		return f'{self.title} - {self.course} - {self.date}'
