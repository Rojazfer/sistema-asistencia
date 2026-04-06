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
		
		# Obtener todos los eventos del profesor para ese día
		events = AttendanceEvent.objects.filter(
			professor=professor,
			date=report_date
		).select_related('course').order_by('start_time')
		
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
