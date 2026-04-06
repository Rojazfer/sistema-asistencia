import uuid
from datetime import time

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from rest_framework import serializers

from .models import Attendance, Course, Enrollment, ProfessorProfile, ShiftConfig, StudentProfile, AttendanceEvent

User = get_user_model()


class ShiftConfigSerializer(serializers.ModelSerializer):
	"""Serializer para configuraciones de turnos"""
	shift_type_display = serializers.CharField(source='get_shift_type_display', read_only=True)
	present_until = serializers.SerializerMethodField()
	late_until = serializers.SerializerMethodField()
	time_window_display = serializers.CharField(source='get_time_window_display', read_only=True)
	
	class Meta:
		model = ShiftConfig
		fields = [
			'id',
			'shift_type',
			'shift_type_display',
			'start_time',
			'tolerance_minutes',
			'late_minutes',
			'present_until',
			'late_until',
			'time_window_display',
			'is_active',
		]
	
	def get_present_until(self, obj):
		return obj.get_present_until().strftime('%H:%M:%S')
	
	def get_late_until(self, obj):
		return obj.get_late_until().strftime('%H:%M:%S')


def resolve_attendance_status_for_current_time():
    now = timezone.localtime()

    current_time = now.time()
    start_time = time(13, 45)
    present_limit = time(14, 5)
    late_limit = time(14, 30)

    if current_time < start_time:
        raise serializers.ValidationError('La asistencia se habilita a las 13:45.')
    if current_time <= present_limit:
        return Attendance.Status.PRESENT
    if current_time <= late_limit:
        return Attendance.Status.LATE

    raise serializers.ValidationError('El horario de asistencia finalizo a las 14:30.')


def resolve_attendance_status_for_shift(shift):
    """Resuelve el estado de asistencia basado en el cambio de turno (ShiftConfig) y hora actual"""
    now = timezone.localtime()
    current_time = now.time()
    
    if not shift:
        raise serializers.ValidationError('No hay un turno válido asignado.')
    
    start_time = shift.start_time
    present_until = shift.get_present_until()
    late_until = shift.get_late_until()
    
    if current_time < start_time:
        raise serializers.ValidationError('El turno aun no inicia.')
    if current_time <= present_until:
        return Attendance.Status.PRESENT
    if current_time <= late_until:
        return Attendance.Status.LATE
    raise serializers.ValidationError('El turno de asistencia ya cerro.')


def _sanitize_carnet(carnet):
    return ''.join(ch for ch in str(carnet).upper() if ch.isalnum())


def _name_initials(full_name):
    parts = [chunk for chunk in str(full_name).strip().split() if chunk]
    initials = ''.join(part[0].upper() for part in parts if part[0].isalnum())
    return initials or 'X'


def _build_student_code(carnet, full_name, exclude_student_id=None):
    base_carnet = _sanitize_carnet(carnet)
    initials = _name_initials(full_name)
    base_code = f'{base_carnet}{initials}'[:30] or 'ESTX'

    candidate = base_code
    suffix = 1
    exists_qs = StudentProfile.objects.filter(student_code=candidate)
    if exclude_student_id is not None:
        exists_qs = exists_qs.exclude(id=exclude_student_id)

    while exists_qs.exists():
        suffix_str = str(suffix)
        candidate = f'{base_code[:30 - len(suffix_str)]}{suffix_str}'
        suffix += 1
        exists_qs = StudentProfile.objects.filter(student_code=candidate)
        if exclude_student_id is not None:
            exists_qs = exists_qs.exclude(id=exclude_student_id)
    return candidate


class ProfessorCreateSerializer(serializers.Serializer):
    class CourseInputSerializer(serializers.Serializer):
        name = serializers.CharField(max_length=120)
        parallel = serializers.CharField(max_length=20)

    username = serializers.CharField(max_length=150)
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    email = serializers.EmailField(required=False, allow_blank=True)
    employee_code = serializers.CharField(max_length=30)
    course_name = serializers.CharField(max_length=120, required=False, allow_blank=True)
    course_parallel = serializers.CharField(max_length=20, required=False, allow_blank=True)
    courses = CourseInputSerializer(many=True, required=False)
    password = serializers.CharField(write_only=True)

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        employee_code = validated_data.pop('employee_code')
        legacy_course_name = validated_data.pop('course_name', '').strip()
        legacy_course_parallel = validated_data.pop('course_parallel', '').strip()
        courses_payload = validated_data.pop('courses', None)
        password = validated_data.pop('password')

        normalized_courses = []
        if courses_payload:
            for item in courses_payload:
                name = str(item.get('name', '')).strip()
                parallel = str(item.get('parallel', '')).strip()
                if name and parallel:
                    normalized_courses.append((name, parallel))

        if not normalized_courses and legacy_course_name and legacy_course_parallel:
            normalized_courses.append((legacy_course_name, legacy_course_parallel))

        if not normalized_courses:
            raise serializers.ValidationError('Debes asignar al menos un curso al profesor.')

        unique_courses = []
        seen = set()
        for name, parallel in normalized_courses:
            key = (name.lower(), parallel.lower())
            if key in seen:
                continue
            seen.add(key)
            unique_courses.append((name, parallel))

        user = User.objects.create_user(
            **validated_data,
            role=User.Role.PROFESSOR,
        )
        user.set_password(password)
        user.save()

        profile = ProfessorProfile.objects.create(user=user, employee_code=employee_code)
        for course_name, course_parallel in unique_courses:
            Course.objects.get_or_create(
                name=course_name,
                parallel=course_parallel,
                professor=profile,
            )
        return profile


class ProfessorSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    assigned_course = serializers.SerializerMethodField()
    assigned_courses = serializers.SerializerMethodField()

    class Meta:
        model = ProfessorProfile
        fields = ('id', 'employee_code', 'full_name', 'user', 'assigned_course', 'assigned_courses')

    def get_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_assigned_course(self, obj):
        course = obj.courses.first()
        if not course:
            return None
        return {
            'name': course.name,
            'parallel': course.parallel,
            'label': f'{course.name} - {course.parallel}',
        }

    def get_assigned_courses(self, obj):
        courses = obj.courses.all().order_by('name', 'parallel')
        return [
            {
                'id': course.id,
                'name': course.name,
                'parallel': course.parallel,
                'label': f'{course.name} - {course.parallel}',
            }
            for course in courses
        ]


class AttendanceRegisterSerializer(serializers.Serializer):
    student_code = serializers.CharField(max_length=30)
    course_id = serializers.IntegerField(required=False)
    shift_id = serializers.IntegerField(required=False, allow_null=True)
    date = serializers.DateField(required=False)

    def validate(self, attrs):
        if not attrs.get('course_id'):
            raise serializers.ValidationError('Debes enviar course_id.')
        return attrs

    def create(self, validated_data):
        request = self.context['request']
        user = request.user

        if user.role != User.Role.PROFESSOR:
            raise serializers.ValidationError('Solo un profesor puede registrar asistencia.')

        try:
            professor = user.professor_profile
        except ProfessorProfile.DoesNotExist as exc:
            raise serializers.ValidationError('El usuario no tiene perfil de profesor.') from exc

        try:
            student = StudentProfile.objects.get(student_code=validated_data['student_code'])
        except StudentProfile.DoesNotExist as exc:
            raise serializers.ValidationError('Codigo de estudiante no encontrado.') from exc

        try:
            course = Course.objects.get(id=validated_data['course_id'], professor=professor)
        except Course.DoesNotExist as exc:
            raise serializers.ValidationError('Curso no encontrado para este profesor.') from exc
        
        attendance_date = validated_data.get('date') or timezone.localdate()
        if attendance_date != timezone.localdate():
            raise serializers.ValidationError('Solo puedes registrar asistencia para la fecha actual.')
        
        status_by_schedule = resolve_attendance_status_for_current_time()

        if not Enrollment.objects.filter(student=student, course=course).exists():
            raise serializers.ValidationError('El estudiante no esta inscrito en este curso.')

        shift = None
        if validated_data.get('shift_id'):
            try:
                shift = ShiftConfig.objects.get(id=validated_data['shift_id'])
            except ShiftConfig.DoesNotExist:
                shift = None
        
        # Incluir shift y event en lookup para evitar duplicados
        lookup = {'student': student, 'course': course, 'date': attendance_date, 'shift': shift, 'event': None}
        attendance, _created = Attendance.objects.update_or_create(
            **lookup,
            defaults={
                'professor': professor,
                'status': status_by_schedule,
            },
        )
        return attendance


class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    student_code = serializers.SerializerMethodField()
    ci = serializers.SerializerMethodField()
    course_name = serializers.SerializerMethodField()
    professor_name = serializers.SerializerMethodField()

    shift = ShiftConfigSerializer(read_only=True)
    event = serializers.SerializerMethodField()

    class Meta:
        model = Attendance
        fields = (
            'id',
            'student_code',
            'ci',
            'student_name',
            'course_name',
            'professor_name',
            'date',
            'status',
            'registered_at',
            'scanned_at',
            'shift',
            'event',
        )

    def get_student_name(self, obj):
        return obj.student.full_name or obj.student.user.get_full_name() or obj.student.user.username

    def get_student_code(self, obj):
        return obj.student.student_code

    def get_ci(self, obj):
        return obj.student.ci

    def get_course_name(self, obj):
        return str(obj.course)

    def get_professor_name(self, obj):
        return obj.professor.user.get_full_name() or obj.professor.user.username

    def get_event(self, obj):
        if obj.event:
            return {
                'id': obj.event.id,
                'title': obj.event.title,
                'date': obj.event.date,
                'start_time': str(obj.event.start_time) if obj.event.start_time else None,
                'present_until': str(obj.event.present_until) if obj.event.present_until else None,
                'late_until': str(obj.event.late_until) if obj.event.late_until else None,
            }
        return None



class StudentRegisterSerializer(serializers.Serializer):
    ci = serializers.CharField(max_length=20)
    full_name = serializers.CharField(max_length=200)
    course_name = serializers.CharField(max_length=120)

    def create(self, validated_data):
        ci = validated_data['ci'].strip()
        full_name = validated_data['full_name'].strip()
        course_name = validated_data['course_name'].strip()

        if StudentProfile.objects.filter(ci=ci).exists():
            raise serializers.ValidationError('El CI ya esta registrado.')

        username = f'est_{ci}'
        if User.objects.filter(username=username).exists():
            username = f'{username}_{uuid.uuid4().hex[:6]}'

        user = User.objects.create_user(
            username=username,
            role=User.Role.STUDENT,
        )

        student_code = _build_student_code(ci, full_name)

        profile = StudentProfile.objects.create(
            user=user,
            student_code=student_code,
            ci=ci,
            full_name=full_name,
            course_name=course_name,
        )
        return profile


class StudentSerializer(serializers.ModelSerializer):
    qr_payload = serializers.SerializerMethodField()

    class Meta:
        model = StudentProfile
        fields = ('id', 'student_code', 'ci', 'full_name', 'course_name', 'qr_payload')

    def get_qr_payload(self, obj):
        return (
            f'CI={obj.ci};'
            f'NOMBRE={obj.full_name};'
            f'CURSO={obj.course_name}'
        )


class CourseOptionSerializer(serializers.ModelSerializer):
    label = serializers.SerializerMethodField()
    professor_id = serializers.SerializerMethodField()
    professor_name = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = ('id', 'name', 'parallel', 'label', 'professor_id', 'professor_name')

    def get_label(self, obj):
        return f'{obj.name} - {obj.parallel}'

    def get_professor_id(self, obj):
        return obj.professor_id

    def get_professor_name(self, obj):
        if obj.professor_id is None:
            return ''
        return obj.professor.user.get_full_name() or obj.professor.user.username


class CourseCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=120)
    parallel = serializers.CharField(max_length=20)


class ProfessorStudentRegisterSerializer(serializers.Serializer):
    ci = serializers.CharField(max_length=20)
    full_name = serializers.CharField(max_length=200)
    course_id = serializers.IntegerField()

    def create(self, validated_data):
        request = self.context['request']
        user = request.user

        if user.role != User.Role.PROFESSOR:
            raise serializers.ValidationError('Solo un profesor puede registrar estudiantes en su curso.')

        try:
            professor = user.professor_profile
        except ProfessorProfile.DoesNotExist as exc:
            raise serializers.ValidationError('No existe perfil de profesor para este usuario.') from exc

        try:
            course = Course.objects.get(id=validated_data['course_id'], professor=professor)
        except Course.DoesNotExist as exc:
            raise serializers.ValidationError('El curso seleccionado no pertenece al profesor.') from exc

        ci = validated_data['ci'].strip()
        full_name = validated_data['full_name'].strip()
        course_label = f'{course.name} - {course.parallel}'

        student = StudentProfile.objects.filter(ci=ci).first()
        created_student = False

        if student is None:
            username = f'est_{ci}'
            if User.objects.filter(username=username).exists():
                username = f'{username}_{uuid.uuid4().hex[:6]}'

            student_user = User.objects.create_user(
                username=username,
                role=User.Role.STUDENT,
            )

            student_code = _build_student_code(ci, full_name)

            student = StudentProfile.objects.create(
                user=student_user,
                student_code=student_code,
                ci=ci,
                full_name=full_name,
                course_name=course_label,
            )
            created_student = True
        else:
            enrollment = Enrollment.objects.select_related('course').filter(student=student).first()
            if enrollment and enrollment.course_id != course.id:
                raise serializers.ValidationError(
                    f'El estudiante ya pertenece al curso {enrollment.course.name} - {enrollment.course.parallel}.'
                )

            if full_name:
                student.full_name = full_name
            student.course_name = course_label
            student.student_code = _build_student_code(
                student.ci,
                student.full_name,
                exclude_student_id=student.id,
            )
            student.save(update_fields=['full_name', 'course_name', 'student_code'])

        Enrollment.objects.get_or_create(student=student, course=course)

        return {
            'created_student': created_student,
            'student': student,
            'course': course,
            'qr_payload': (
                f'CI={student.ci};'
                f'NOMBRE={student.full_name};'
                f'CURSO={course_label}'
            ),
        }


class ProfessorEnrollmentStudentSerializer(serializers.ModelSerializer):
    student_id = serializers.IntegerField(source='student.id')
    ci = serializers.CharField(source='student.ci')
    full_name = serializers.CharField(source='student.full_name')
    student_code = serializers.CharField(source='student.student_code')
    course_id = serializers.IntegerField(source='course.id')
    course_label = serializers.SerializerMethodField()
    qr_payload = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = (
            'id',
            'student_id',
            'ci',
            'full_name',
            'student_code',
            'course_id',
            'course_label',
            'qr_payload',
        )

    def get_course_label(self, obj):
        return f'{obj.course.name} - {obj.course.parallel}'

    def get_qr_payload(self, obj):
        course_label = self.get_course_label(obj)
        return (
            f'CI={obj.student.ci};'
            f'NOMBRE={obj.student.full_name};'
            f'CURSO={course_label}'
        )


class AttendanceEventSerializer(serializers.ModelSerializer):
	"""Serializer para eventos de asistencia"""
	course_id = serializers.IntegerField(source='course.id', read_only=True)
	professor_id = serializers.IntegerField(source='professor.id', read_only=True)
	
	class Meta:
		model = AttendanceEvent
		fields = [
			'id',
			'course_id',
			'professor_id',
			'title',
			'date',
			'start_time',
			'present_until',
			'late_until',
			'is_active',
			'created_at',
			'updated_at',
		]
		read_only_fields = ['id', 'created_at', 'updated_at']


class DailyEventAttendanceSerializer(serializers.Serializer):
	"""Serializer para asistencia de un evento específico"""
	student_id = serializers.IntegerField()
	student_name = serializers.CharField()
	student_code = serializers.CharField()
	ci = serializers.CharField()
	status = serializers.CharField()
	scanned_at = serializers.DateTimeField(allow_null=True)


class DailyEventReportSerializer(serializers.Serializer):
	"""Serializer para reporte de un evento del día"""
	event_id = serializers.IntegerField()
	title = serializers.CharField()
	course_name = serializers.CharField()
	course_parallel = serializers.CharField()
	date = serializers.DateField()
	start_time = serializers.TimeField()
	present_until = serializers.TimeField()
	late_until = serializers.TimeField()
	is_active = serializers.BooleanField()
	
	# Estadísticas
	total_enrolled = serializers.IntegerField()
	present_count = serializers.IntegerField()
	late_count = serializers.IntegerField()
	absent_count = serializers.IntegerField()
	scanned_count = serializers.IntegerField()
	
	# Detalles
	attendance_records = DailyEventAttendanceSerializer(many=True)


class DailyEventsReportSerializer(serializers.Serializer):
	"""Serializer para reporte completo de todos los eventos del día"""
	date = serializers.DateField()
	total_events = serializers.IntegerField()
	professor_name = serializers.CharField()
	
	# Estadísticas agregadas del día
	total_enrolled_all_events = serializers.IntegerField()
	total_present_all_events = serializers.IntegerField()
	total_late_all_events = serializers.IntegerField()
	total_absent_all_events = serializers.IntegerField()
	total_scanned_all_events = serializers.IntegerField()
	
	# % Asistencia promedio
	attendance_percentage = serializers.FloatField()
	
	# Eventos del día
	events = DailyEventReportSerializer(many=True)
