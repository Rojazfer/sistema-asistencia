from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from django.http import HttpResponse
from rest_framework import generics, permissions, serializers, status
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Attendance, Course, Enrollment, ProfessorProfile, QRAttendanceRecord, ShiftConfig, StudentProfile, AttendanceEvent
from .credentials import CredentialGenerator
from .serializers import (
	AttendanceEventSerializer,
	AttendanceRegisterSerializer,
	AttendanceSerializer,
	CourseCreateSerializer,
	CourseOptionSerializer,
	DailyEventsReportSerializer,
	ProfessorEnrollmentStudentSerializer,
	ProfessorStudentRegisterSerializer,
	ProfessorCreateSerializer,
	ProfessorSerializer,
	resolve_attendance_status_for_current_time,
	resolve_attendance_status_for_shift,
	ShiftConfigSerializer,
	StudentRegisterSerializer,
	StudentSerializer,
)

User = get_user_model()


class LoginView(ObtainAuthToken):
	permission_classes = [permissions.AllowAny]

	def post(self, request, *args, **kwargs):
		serializer = self.serializer_class(data=request.data, context={'request': request})
		serializer.is_valid(raise_exception=True)
		user = serializer.validated_data['user']
		token, _created = Token.objects.get_or_create(user=user)
		return Response(
			{
				'token': token.key,
				'user': {
					'id': user.id,
					'username': user.username,
					'full_name': user.get_full_name() or user.username,
					'role': user.role,
					'is_staff': user.is_staff,
				},
			}
		)


class SchoolInfoView(APIView):
	permission_classes = [permissions.AllowAny]

	def get(self, request):
		from datetime import datetime, timezone as dt_timezone
		from zoneinfo import ZoneInfo
		bolivia_tz = ZoneInfo('America/La_Paz')
		# Obtener hora UTC actual y convertir a Bolivia
		now_utc = datetime.now(dt_timezone.utc)
		now_bolivia = now_utc.astimezone(bolivia_tz)
		
		return Response(
			{
				'school_name': settings.SCHOOL_NAME,
				'server_datetime_iso': now_bolivia.isoformat(),
				'server_time': now_bolivia.strftime('%H:%M:%S'),
				'server_date': now_bolivia.strftime('%Y-%m-%d'),
				'server_timezone': 'America/La_Paz',
			}
		)


class ProfessorCreateListView(generics.GenericAPIView):
	queryset = ProfessorProfile.objects.select_related('user').prefetch_related('courses').all()
	permission_classes = [permissions.IsAuthenticated]

	def get_serializer_class(self):
		if self.request.method == 'POST':
			return ProfessorCreateSerializer
		return ProfessorSerializer

	def get(self, request):
		if not request.user.is_staff and request.user.role != User.Role.ADMIN:
			return Response({'detail': 'Solo administradores pueden ver profesores.'}, status=403)

		professors = self.get_queryset()
		data = ProfessorSerializer(professors, many=True).data
		return Response(data)

	def post(self, request):
		if not request.user.is_staff and request.user.role != User.Role.ADMIN:
			return Response({'detail': 'Solo administradores pueden crear profesores.'}, status=403)

		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		profile = serializer.save()
		return Response(ProfessorSerializer(profile).data, status=status.HTTP_201_CREATED)


class ProfessorDetailView(APIView):
	permission_classes = [permissions.IsAuthenticated]

	def _get_profile(self, professor_id):
		return ProfessorProfile.objects.select_related('user').prefetch_related('courses').filter(id=professor_id).first()

	def _ensure_admin(self, request):
		return request.user.is_staff or request.user.role == User.Role.ADMIN

	def patch(self, request, professor_id):
		if not self._ensure_admin(request):
			return Response({'detail': 'Solo administradores pueden editar profesores.'}, status=403)

		profile = self._get_profile(professor_id)
		if profile is None:
			return Response({'detail': 'Profesor no encontrado.'}, status=404)

		user = profile.user
		employee_code = str(request.data.get('employee_code', profile.employee_code)).strip()
		if ProfessorProfile.objects.exclude(id=profile.id).filter(employee_code=employee_code).exists():
			return Response({'detail': 'Codigo de empleado ya existe.'}, status=400)

		user.first_name = str(request.data.get('first_name', user.first_name)).strip()
		user.last_name = str(request.data.get('last_name', user.last_name)).strip()
		user.email = str(request.data.get('email', user.email)).strip()

		new_password = str(request.data.get('password', '')).strip()
		if new_password:
			try:
				validate_password(new_password, user=user)
			except Exception as exc:  # noqa: BLE001
				return Response({'detail': str(exc)}, status=400)
			user.set_password(new_password)

		user.save()
		profile.employee_code = employee_code
		profile.save(update_fields=['employee_code'])

		return Response(ProfessorSerializer(profile).data, status=200)

	def delete(self, request, professor_id):
		if not self._ensure_admin(request):
			return Response({'detail': 'Solo administradores pueden eliminar profesores.'}, status=403)

		profile = self._get_profile(professor_id)
		if profile is None:
			return Response({'detail': 'Profesor no encontrado.'}, status=404)

		profile.user.delete()
		return Response(status=204)


class ProfessorAssignCourseView(APIView):
	permission_classes = [permissions.IsAuthenticated]

	def post(self, request, professor_id):
		if not request.user.is_staff and request.user.role != User.Role.ADMIN:
			return Response({'detail': 'Solo administradores pueden asignar cursos.'}, status=403)

		profile = ProfessorProfile.objects.select_related('user').filter(id=professor_id).first()
		if profile is None:
			return Response({'detail': 'Profesor no encontrado.'}, status=404)

		course_name = str(request.data.get('course_name', '')).strip()
		course_parallel = str(request.data.get('course_parallel', '')).strip()
		if not course_name or not course_parallel:
			return Response({'detail': 'Debes enviar course_name y course_parallel.'}, status=400)

		course, _created = Course.objects.get_or_create(
			name=course_name,
			parallel=course_parallel,
			professor=profile,
		)
		return Response(CourseOptionSerializer(course).data, status=201)


class ProfessorCourseDetailView(APIView):
	permission_classes = [permissions.IsAuthenticated]

	def _ensure_admin(self, request):
		return request.user.is_staff or request.user.role == User.Role.ADMIN

	def _get_course(self, professor_id, course_id):
		return Course.objects.filter(id=course_id, professor_id=professor_id).first()

	def patch(self, request, professor_id, course_id):
		if not self._ensure_admin(request):
			return Response({'detail': 'Solo administradores pueden editar cursos.'}, status=403)

		course = self._get_course(professor_id, course_id)
		if course is None:
			return Response({'detail': 'Curso no encontrado para este profesor.'}, status=404)

		course_name = str(request.data.get('course_name', course.name)).strip()
		course_parallel = str(request.data.get('course_parallel', course.parallel)).strip()
		if not course_name or not course_parallel:
			return Response({'detail': 'Debes enviar course_name y course_parallel.'}, status=400)

		if Course.objects.exclude(id=course.id).filter(
			name__iexact=course_name,
			parallel__iexact=course_parallel,
			professor=course.professor,
		).exists():
			return Response({'detail': 'Ese curso ya esta asignado a este profesor.'}, status=400)

		course.name = course_name
		course.parallel = course_parallel
		course.save(update_fields=['name', 'parallel'])
		return Response(CourseOptionSerializer(course).data, status=200)

	def delete(self, request, professor_id, course_id):
		if not self._ensure_admin(request):
			return Response({'detail': 'Solo administradores pueden eliminar cursos.'}, status=403)

		course = self._get_course(professor_id, course_id)
		if course is None:
			return Response({'detail': 'Curso no encontrado para este profesor.'}, status=404)

		if Course.objects.filter(professor=course.professor).count() <= 1:
			return Response({'detail': 'El profesor debe conservar al menos un curso asignado.'}, status=400)

		if course.enrollments.exists() or course.attendances.exists():
			return Response(
				{'detail': 'No se puede eliminar el curso porque ya tiene estudiantes o asistencias registradas.'},
				status=400,
			)

		course.delete()
		return Response(status=204)


class AttendanceRegisterView(generics.GenericAPIView):
	serializer_class = AttendanceRegisterSerializer
	permission_classes = [permissions.IsAuthenticated]

	def post(self, request):
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		attendance = serializer.save()
		return Response(AttendanceSerializer(attendance).data, status=status.HTTP_201_CREATED)


class MyAttendanceListView(generics.ListAPIView):
	serializer_class = AttendanceSerializer
	permission_classes = [permissions.IsAuthenticated]

	def get_queryset(self):
		user = self.request.user
		if user.role != 'PROFESSOR':
			return Attendance.objects.none()

		professor = user.professor_profile
		return Attendance.objects.filter(professor=professor).select_related('student__user', 'course', 'shift', 'event', 'professor__user').order_by('-date', '-registered_at')


class MyAttendanceDetailView(APIView):
	permission_classes = [permissions.IsAuthenticated]

	def _get_attendance(self, request, attendance_id):
		if request.user.role != User.Role.PROFESSOR:
			return None
		return Attendance.objects.filter(id=attendance_id, professor__user=request.user).first()

	def patch(self, request, attendance_id):
		attendance = self._get_attendance(request, attendance_id)
		if attendance is None:
			return Response({'detail': 'Registro de asistencia no encontrado.'}, status=404)

		new_status = str(request.data.get('status', '')).upper().strip()
		valid_statuses = {Attendance.Status.PRESENT, Attendance.Status.LATE, Attendance.Status.ABSENT}
		if new_status not in valid_statuses:
			return Response({'detail': 'Estado invalido.'}, status=400)

		attendance.status = new_status
		attendance.save(update_fields=['status'])
		return Response(AttendanceSerializer(attendance).data, status=200)

	def delete(self, request, attendance_id):
		attendance = self._get_attendance(request, attendance_id)
		if attendance is None:
			return Response({'detail': 'Registro de asistencia no encontrado.'}, status=404)

		attendance.delete()
		return Response(status=204)


class StudentRegisterListView(generics.GenericAPIView):
	queryset = StudentProfile.objects.select_related('user').all().order_by('-id')
	permission_classes = [permissions.AllowAny]

	def get_serializer_class(self):
		if self.request.method == 'POST':
			return StudentRegisterSerializer
		return StudentSerializer

	def get(self, request):
		students = self.get_queryset()
		return Response(StudentSerializer(students, many=True).data)

	def post(self, request):
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		student = serializer.save()
		return Response(StudentSerializer(student).data, status=status.HTTP_201_CREATED)


class StudentDetailView(APIView):
	permission_classes = [permissions.IsAuthenticated]

	def _is_admin(self, request):
		return request.user.is_staff or request.user.role == User.Role.ADMIN

	def _is_professor(self, request):
		return request.user.role == User.Role.PROFESSOR

	def _get_student(self, student_id):
		return StudentProfile.objects.select_related('user').filter(id=student_id).first()

	def patch(self, request, student_id):
		# Permitir tanto a administradores como profesores editar estudiantes
		if not (self._is_admin(request) or self._is_professor(request)):
			return Response({'detail': 'No tienes permisos para editar estudiantes.'}, status=403)

		student = self._get_student(student_id)
		if student is None:
			return Response({'detail': 'Estudiante no encontrado.'}, status=404)

		ci = str(request.data.get('ci', student.ci or '')).strip()
		full_name = str(request.data.get('full_name', student.full_name or '')).strip()
		course_name = str(request.data.get('course_name', student.course_name or '')).strip()

		if not ci or not full_name or not course_name:
			return Response({'detail': 'Debes enviar ci, full_name y course_name.'}, status=400)

		if StudentProfile.objects.exclude(id=student.id).filter(ci=ci).exists():
			return Response({'detail': 'El CI ya esta registrado.'}, status=400)

		student.ci = ci
		student.full_name = full_name
		student.course_name = course_name
		student.save(update_fields=['ci', 'full_name', 'course_name'])
		return Response(StudentSerializer(student).data, status=200)

	def delete(self, request, student_id):
		if not self._is_admin(request):
			return Response({'detail': 'Solo administradores pueden eliminar estudiantes.'}, status=403)

		student = self._get_student(student_id)
		if student is None:
			return Response({'detail': 'Estudiante no encontrado.'}, status=404)

		student.user.delete()
		return Response(status=204)


class MyCoursesView(generics.ListAPIView):
	serializer_class = CourseOptionSerializer
	permission_classes = [permissions.IsAuthenticated]

	def get_queryset(self):
		user = self.request.user
		if user.role == User.Role.PROFESSOR:
			return Course.objects.filter(professor__user=user).select_related('professor__user').order_by('name', 'parallel')
		if user.role == User.Role.ADMIN or user.is_staff:
			return Course.objects.all().select_related('professor__user').order_by('name', 'parallel')
		return Course.objects.none()

	def post(self, request):
		if request.user.role != User.Role.PROFESSOR and request.user.role != User.Role.ADMIN and not request.user.is_staff:
			return Response({'detail': 'No autorizado para crear cursos.'}, status=403)

		serializer = CourseCreateSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)

		if request.user.role == User.Role.PROFESSOR:
			professor = request.user.professor_profile
		else:
			professor_id = request.data.get('professor_id')
			if not professor_id:
				return Response({'detail': 'Debes seleccionar un profesor para el curso.'}, status=400)
			professor = ProfessorProfile.objects.filter(id=professor_id).first()
			if professor is None:
				return Response({'detail': 'Profesor no encontrado.'}, status=404)

		course, _created = Course.objects.get_or_create(
			name=serializer.validated_data['name'].strip(),
			parallel=serializer.validated_data['parallel'].strip(),
			professor=professor,
		)
		return Response(CourseOptionSerializer(course).data, status=status.HTTP_201_CREATED)



class AttendanceActivityView(generics.ListAPIView):
	serializer_class = AttendanceSerializer
	permission_classes = [permissions.IsAuthenticated]

	def get_queryset(self):
		user = self.request.user
		queryset = Attendance.objects.select_related('student__user', 'course', 'shift', 'professor__user')

		if user.role == User.Role.PROFESSOR:
			queryset = queryset.filter(professor__user=user)
		elif user.role != User.Role.ADMIN and not user.is_staff:
			return Attendance.objects.none()

		course_id = self.request.query_params.get('course_id')
		date = self.request.query_params.get('date')

		if course_id:
			queryset = queryset.filter(course_id=course_id)
		if date:
			queryset = queryset.filter(date=date)

		return queryset.order_by('-registered_at')


class ProfessorStudentRegisterView(generics.GenericAPIView):
	serializer_class = ProfessorStudentRegisterSerializer
	permission_classes = [permissions.IsAuthenticated]

	def post(self, request):
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		payload = serializer.save()
		student = payload['student']
		course = payload['course']
		return Response(
			{
				'created_student': payload['created_student'],
				'student': {
					'id': student.id,
					'ci': student.ci,
					'full_name': student.full_name,
					'student_code': student.student_code,
				},
				'course': {
					'id': course.id,
					'label': f'{course.name} - {course.parallel}',
				},
				'qr_payload': payload['qr_payload'],
			}
		)


class ProfessorStudentsListView(generics.ListAPIView):
	serializer_class = ProfessorEnrollmentStudentSerializer
	permission_classes = [permissions.IsAuthenticated]

	def get_queryset(self):
		user = self.request.user
		if user.role != User.Role.PROFESSOR:
			return Enrollment.objects.none()

		queryset = Enrollment.objects.filter(course__professor__user=user).select_related('student', 'course')
		course_id = self.request.query_params.get('course_id')
		if course_id:
			queryset = queryset.filter(course_id=course_id)
		return queryset.order_by('-id')


class ProfessorStudentEnrollmentDetailView(APIView):
	permission_classes = [permissions.IsAuthenticated]

	def delete(self, request, enrollment_id):
		if request.user.role != User.Role.PROFESSOR:
			return Response({'detail': 'Solo un profesor puede quitar estudiantes de su curso.'}, status=403)

		enrollment = Enrollment.objects.filter(id=enrollment_id).select_related('course__professor__user').first()
		if enrollment is None:
			return Response({'detail': 'Registro de curso-estudiante no encontrado.'}, status=404)

		if enrollment.course.professor.user_id != request.user.id:
			return Response({'detail': 'No autorizado para modificar este curso.'}, status=403)

		enrollment.delete()
		return Response(status=status.HTTP_204_NO_CONTENT)


class AttendanceScanView(APIView):
	permission_classes = [permissions.IsAuthenticated]

	def _parse_payload(self, payload):
		parts = [chunk for chunk in payload.split(';') if chunk.strip()]
		parsed = {}
		for part in parts:
			if '=' not in part:
				continue
			key, value = part.split('=', 1)
			parsed[key.strip().upper()] = value.strip()
		return parsed

	def _normalize_course_value(self, raw_value):
		return ' '.join(str(raw_value or '').strip().lower().split())

	def post(self, request):
		payload = str(request.data.get('qr_payload', '')).strip()
		event_id = request.data.get('event_id')
		
		if not payload:
			return Response({'detail': 'Falta qr_payload.'}, status=400)
		if not event_id:
			return Response({'detail': 'Debes seleccionar un evento para registrar asistencia.'}, status=400)

		# Obtener el evento
		try:
			event = AttendanceEvent.objects.get(id=event_id)
		except AttendanceEvent.DoesNotExist:
			return Response({'detail': 'Evento no encontrado.'}, status=404)

		# Obtener el curso desde el evento
		course = event.course
		
		# Verificar que el profesor actual es el dueño del evento
		if request.user.role == User.Role.PROFESSOR and event.professor.user_id != request.user.id:
			return Response({'detail': 'No tienes permiso para registrar asistencia en este evento.'}, status=403)

		# Parsear el QR
		parsed = self._parse_payload(payload)
		required_fields = ('CI', 'CURSO')
		missing = [field for field in required_fields if not parsed.get(field)]
		if missing:
			return Response({'detail': f'QR invalido. Faltan campos: {", ".join(missing)}'}, status=400)

		# Obtener el estudiante
		try:
			student = StudentProfile.objects.get(ci=parsed['CI'])
		except StudentProfile.DoesNotExist:
			return Response({'detail': 'No se encontro estudiante para este QR.'}, status=404)
		except StudentProfile.MultipleObjectsReturned:
			return Response({'detail': 'Se encontraron multiples estudiantes con el mismo CI.'}, status=400)

		# Verificar inscripción en el curso
		if not Enrollment.objects.filter(student=student, course=course).exists():
			return Response({'detail': 'El estudiante no esta inscrito en el curso.'}, status=400)

		# Validar que el QR corresponde al curso
		course_values = {
			self._normalize_course_value(course.name),
			self._normalize_course_value(f'{course.name} - {course.parallel}'),
			self._normalize_course_value(f'{course.name}-{course.parallel}'),
		}
		if self._normalize_course_value(parsed['CURSO']) not in course_values:
			return Response({'detail': 'El QR no corresponde al curso seleccionado.'}, status=400)

		# Resolver el estado basado en la hora actual y los tiempos del evento
		current_time = timezone.localtime().time()
		event_date = event.date
		
		# Determinar el estado de asistencia
		if event.present_until and current_time <= event.present_until:
			attendance_status = Attendance.Status.PRESENT
		elif event.late_until and current_time <= event.late_until:
			attendance_status = Attendance.Status.LATE
		else:
			attendance_status = Attendance.Status.ABSENT

		# Actualizar o crear QRAttendanceRecord (sin shift)
		record_lookup = {'student': student, 'date': event_date, 'course': course}
		record, created = QRAttendanceRecord.objects.update_or_create(
			**record_lookup,
			defaults={
				'ci': student.ci or '',
				'student_name': student.full_name,
				'course_name': f'{course.name} - {course.parallel}',
				'raw_payload': payload,
				'shift': None,  # Asignamos None para la migración
			},
		)

		# Actualizar o crear Attendance (con event en lookup para evitar duplicados)
		attendance_lookup = {'student': student, 'date': event_date, 'course': course, 'event': event}
		attendance_obj, _ = Attendance.objects.update_or_create(
			**attendance_lookup,
			defaults={
				'professor': course.professor,
				'status': attendance_status,
				'scanned_at': timezone.now(),
				'shift': None,  # Sin turno para sistema basado en eventos
			},
		)

		response_status = 'registered' if created else 'already_marked'
		return Response(
			{
				'status': response_status,
				'event': {
					'id': event.id,
					'title': event.title,
					'date': str(event.date),
				},
				'course': {
					'id': course.id,
					'name': course.name,
					'parallel': course.parallel,
					'label': f'{course.name} - {course.parallel}',
				},
				'student': {
					'id': student.id,
					'full_name': student.full_name,
					'ci': student.ci,
					'course_name': student.course_name,
				},
				'attendance_status': attendance_status,
				'scanned_at': str(timezone.now()),
			},
			status=status.HTTP_200_OK,
		)

class GenerateCredentialsView(APIView):
	"""Vista para generar credenciales en PDF"""
	permission_classes = [permissions.IsAuthenticated]
	
	def post(self, request):
		"""
		Genera PDF con credenciales de estudiantes
		Body: { "course_id": int } o { "student_ids": [int, int, ...] }
		"""
		user = request.user
		
		# Solo admin o profesor pueden generar credenciales
		if user.role not in [User.Role.ADMIN, User.Role.PROFESSOR]:
			return Response({'detail': 'No tienes permiso para generar credenciales.'}, status=403)
		
		# Obtener estudiantes según filtro
		course_id = request.data.get('course_id')
		student_ids = request.data.get('student_ids', [])
		
		if course_id:
			# Credenciales por curso
			enrollments = Enrollment.objects.filter(course_id=course_id).select_related('student', 'course')
			students_data = []
			for enrollment in enrollments:
				student = enrollment.student
				course = enrollment.course
				students_data.append({
					'full_name': student.full_name,
					'ci': student.ci,
					'student_code': student.student_code,
					'course': f'{course.name} - {course.parallel}',
					'qr_payload': (
						f'CI={student.ci};'
						f'NOMBRE={student.full_name};'
						f'CURSO={course.name} - {course.parallel}'
					)
				})
		elif student_ids:
			# Credenciales de estudiantes específicos
			students = StudentProfile.objects.filter(id__in=student_ids)
			students_data = []
			for student in students:
				# Buscar su curso (primera inscripción)
				enrollment = Enrollment.objects.filter(student=student).select_related('course').first()
				course_label = f'{enrollment.course.name} - {enrollment.course.parallel}' if enrollment else 'Sin curso'
				
				students_data.append({
					'full_name': student.full_name,
					'ci': student.ci,
					'student_code': student.student_code,
					'course': course_label,
					'qr_payload': (
						f'CI={student.ci};'
						f'NOMBRE={student.full_name};'
						f'CURSO={course_label}'
					)
				})
		else:
			return Response({'detail': 'Debes proporcionar course_id o student_ids.'}, status=400)
		
		if not students_data:
			return Response({'detail': 'No se encontraron estudiantes para generar credenciales.'}, status=404)
		
		# Generar PDF
		generator = CredentialGenerator()
		pdf_buffer = generator.generate_pdf(students_data)
		
		# Preparar respuesta
		response = HttpResponse(pdf_buffer, content_type='application/pdf')
		response['Content-Disposition'] = 'attachment; filename="credenciales.pdf"'
		
		return response


class ShiftConfigListCreateView(generics.GenericAPIView):
	"""Vista para listar y crear configuraciones de turnos"""
	serializer_class = ShiftConfigSerializer
	permission_classes = [permissions.IsAuthenticated]
	
	def get(self, request):
		# Cualquiera puede ver los turnos
		shifts = ShiftConfig.objects.all().order_by('shift_type')
		serializer = self.get_serializer(shifts, many=True)
		return Response(serializer.data)
	
	def post(self, request):
		# Solo admin puede crear turnos
		if not (request.user.is_staff or request.user.role == User.Role.ADMIN):
			return Response({'detail': 'Solo administradores pueden crear horarios.'}, status=403)
		
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		shift = serializer.save()
		return Response(ShiftConfigSerializer(shift).data, status=201)


class ShiftConfigDetailView(APIView):
	"""Vista para actualizar y eliminar configuraciones de turnos"""
	permission_classes = [permissions.IsAuthenticated]
	
	def _get_shift(self, shift_id):
		try:
			return ShiftConfig.objects.get(id=shift_id)
		except ShiftConfig.DoesNotExist:
			return None
	
	def _ensure_admin(self, request):
		return request.user.is_staff or request.user.role == User.Role.ADMIN
	
	def put(self, request, shift_id):
		if not self._ensure_admin(request):
			return Response({'detail': 'Solo administradores pueden editar horarios.'}, status=403)
		
		shift = self._get_shift(shift_id)
		if not shift:
			return Response({'detail': 'Horario no encontrado.'}, status=404)
		
		serializer = ShiftConfigSerializer(shift, data=request.data, partial=True)
		serializer.is_valid(raise_exception=True)
		serializer.save()
		return Response(serializer.data)
	
	def delete(self, request, shift_id):
		if not self._ensure_admin(request):
			return Response({'detail': 'Solo administradores pueden eliminar horarios.'}, status=403)
		
		shift = self._get_shift(shift_id)
		if not shift:
			return Response({'detail': 'Horario no encontrado.'}, status=404)
		
		# Verificar si hay eventos usando este turno (opcional, por seguridad)
		shift.delete()
		return Response(status=204)


class ProfessorAttendanceEventsView(APIView):
	"""Crear y listar eventos de asistencia para un profesor"""
	permission_classes = [permissions.IsAuthenticated]
	
	def _get_professor(self, request):
		if request.user.role != User.Role.PROFESSOR:
			return None
		return request.user.professor_profile
	
	def get(self, request):
		"""Listar eventos de asistencia del profesor"""
		professor = self._get_professor(request)
		if not professor:
			return Response({'detail': 'Solo profesores pueden acceder a sus eventos.'}, status=403)
		
		events = AttendanceEvent.objects.filter(professor=professor).select_related('course', 'professor').order_by('-date', '-created_at')
		serializer = AttendanceEventSerializer(events, many=True)
		return Response(serializer.data)
	
	def post(self, request):
		"""Crear un nuevo evento de asistencia"""
		professor = self._get_professor(request)
		if not professor:
			return Response({'detail': 'Solo profesores pueden crear eventos.'}, status=403)
		
		course_id = request.data.get('course_id')
		if not course_id:
			return Response({'detail': 'Debes especificar un course_id.'}, status=400)
		
		# Verificar que el profesor es dueño del curso
		try:
			course = Course.objects.get(id=course_id, professor=professor)
		except Course.DoesNotExist:
			return Response({'detail': 'Curso no encontrado o no pertenece a ti.'}, status=404)
		
		# Crear el evento
		event_data = {
			'course': course,
			'professor': professor,
			'title': request.data.get('title', ''),
			'date': request.data.get('date'),
			'start_time': request.data.get('start_time'),
			'present_until': request.data.get('present_until'),
			'late_until': request.data.get('late_until'),
		}
		
		# Validaciones básicas
		for field in ['title', 'date', 'start_time', 'present_until', 'late_until']:
			if not event_data.get(field):
				return Response({'detail': f'El campo {field} es requerido.'}, status=400)
		
		event = AttendanceEvent.objects.create(**event_data)
		serializer = AttendanceEventSerializer(event)
		return Response(serializer.data, status=201)


class ProfessorAttendanceEventDetailView(APIView):
	"""Detalle, actualización y eliminación de evento de asistencia"""
	permission_classes = [permissions.IsAuthenticated]
	
	def _get_professor(self, request):
		if request.user.role != User.Role.PROFESSOR:
			return None
		return request.user.professor_profile
	
	def _get_event(self, event_id, professor):
		try:
			return AttendanceEvent.objects.get(id=event_id, professor=professor)
		except AttendanceEvent.DoesNotExist:
			return None
	
	def patch(self, request, event_id):
		"""Actualizar evento (activar/desactivar)"""
		professor = self._get_professor(request)
		if not professor:
			return Response({'detail': 'Solo profesores pueden actualizar eventos.'}, status=403)
		
		event = self._get_event(event_id, professor)
		if not event:
			return Response({'detail': 'Evento no encontrado.'}, status=404)
		
		# Permitir actualizar is_active y otros campos
		serializer = AttendanceEventSerializer(event, data=request.data, partial=True)
		serializer.is_valid(raise_exception=True)
		serializer.save()
		return Response(serializer.data, status=200)
	
	def delete(self, request, event_id):
		"""Eliminar evento"""
		professor = self._get_professor(request)
		if not professor:
			return Response({'detail': 'Solo profesores pueden eliminar eventos.'}, status=403)
		
		event = self._get_event(event_id, professor)
		if not event:
			return Response({'detail': 'Evento no encontrado.'}, status=404)
		
		event.delete()
		return Response({'detail': 'Evento eliminado correctamente.'}, status=204)


class ProfessorDailyEventsReportView(APIView):
	"""Reporte de todos los eventos de un día con estadísticas de asistencia"""
	permission_classes = [permissions.IsAuthenticated]
	
	def _get_professor(self, request):
		if request.user.role != User.Role.PROFESSOR:
			return None
		return request.user.professor_profile
	
	def get(self, request):
		"""Obtener reporte de eventos del día"""
		professor = self._get_professor(request)
		if not professor:
			return Response({'detail': 'Solo profesores pueden acceder a este reporte.'}, status=403)
		
		# Parámetro de fecha (por defecto: hoy)
		date_str = request.query_params.get('date')
		if date_str:
			try:
				from datetime import datetime
				report_date = datetime.strptime(date_str, '%Y-%m-%d').date()
			except ValueError:
				return Response({'detail': 'Formato de fecha inválido. Usa: YYYY-MM-DD'}, status=400)
		else:
			report_date = timezone.localdate()
		
		# Parámetro de curso (opcional)
		course_id = request.query_params.get('course_id')
		
		# Obtener todos los eventos del profesor para ese día
		events = AttendanceEvent.objects.filter(
			professor=professor,
			date=report_date
		).select_related('course').order_by('start_time')
		
		# Filtrar por curso si se especifica
		if course_id:
			events = events.filter(course_id=course_id)
		
		if not events.exists():
			return Response({
				'date': report_date,
				'total_events': 0,
				'professor_name': professor.user.get_full_name() or professor.user.username,
				'message': 'No hay eventos para este día.',
				'events': []
			})
		
		# Procesar cada evento
		events_data = []
		total_enrolled_all = set()
		total_present_all = 0
		total_late_all = 0
		total_absent_all = 0
		total_scanned_all = 0
		
		for event in events:
			course = event.course
			
			# Obtener estudiantes inscritos en el curso
			enrolled_students = Enrollment.objects.filter(course=course).select_related('student')
			total_enrolled = enrolled_students.count()
			
			# Agregar al set para contar únicos
			for enrollment in enrolled_students:
				total_enrolled_all.add(enrollment.student_id)
			
			# Obtener asistencias registradas para este evento
			attendances = Attendance.objects.filter(
				event=event,
				date=report_date
			).select_related('student')
			
			# Contar por estado
			present_count = attendances.filter(status='PRESENT').count()
			late_count = attendances.filter(status='LATE').count()
			absent_count = attendances.filter(status='ABSENT').count()
			scanned_count = attendances.filter(scanned_at__isnull=False).count()
			
			total_present_all += present_count
			total_late_all += late_count
			total_absent_all += absent_count
			total_scanned_all += scanned_count
			
			# Preparar details de asistencia
			attendance_records = []
			for enrollment in enrolled_students:
				student = enrollment.student
				attendance = attendances.filter(student=student).first()
				
				attendance_records.append({
					'student_id': student.id,
					'student_name': student.full_name,
					'student_code': student.student_code,
					'ci': student.ci or '',
					'status': attendance.status if attendance else 'NO_REGISTRADO',
					'scanned_at': attendance.scanned_at if attendance else None,
				})
			
			# Ordenar por nombre
			attendance_records.sort(key=lambda x: x['student_name'])
			
			events_data.append({
				'event_id': event.id,
				'title': event.title,
				'course_name': course.name,
				'course_parallel': course.parallel,
				'date': event.date,
				'start_time': event.start_time,
				'present_until': event.present_until,
				'late_until': event.late_until,
				'is_active': event.is_active,
				'total_enrolled': total_enrolled,
				'present_count': present_count,
				'late_count': late_count,
				'absent_count': absent_count,
				'scanned_count': scanned_count,
				'attendance_records': attendance_records,
			})
		
		# Calcular porcentaje de asistencia
		total_enrolled_all_count = len(total_enrolled_all)
		if total_enrolled_all_count > 0:
			attendance_percentage = ((total_present_all + total_late_all) / (total_enrolled_all_count * len(events))) * 100
		else:
			attendance_percentage = 0.0
		
		response_data = {
			'date': report_date,
			'total_events': len(events_data),
			'professor_name': professor.user.get_full_name() or professor.user.username,
			'total_enrolled_all_events': total_enrolled_all_count,
			'total_present_all_events': total_present_all,
			'total_late_all_events': total_late_all,
			'total_absent_all_events': total_absent_all,
			'total_scanned_all_events': total_scanned_all,
			'attendance_percentage': round(attendance_percentage, 2),
			'events': events_data,
		}
		
		return Response(response_data)