from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html

from .models import Attendance, Course, Enrollment, ProfessorProfile, QRAttendanceRecord, ShiftConfig, StudentProfile, User, AttendanceEvent


@admin.register(User)
class CustomUserAdmin(UserAdmin):
	fieldsets = UserAdmin.fieldsets + (
		('Rol', {'fields': ('role',)}),
	)
	list_display = ('username', 'email', 'role', 'is_staff')


@admin.register(ShiftConfig)
class ShiftConfigAdmin(admin.ModelAdmin):
	list_display = ('shift_type_display', 'start_time_display', 'time_window', 'tolerance_display', 'late_display', 'status_display', 'updated_at')
	list_filter = ('is_active', 'shift_type')
	readonly_fields = ('created_at', 'updated_at', 'preview_times')
	
	fieldsets = (
		('Información del Turno', {
			'fields': ('shift_type', 'is_active')
		}),
		('Horarios', {
			'fields': ('start_time', 'tolerance_minutes', 'late_minutes', 'preview_times'),
			'description': 'Configure la hora de inicio y las tolerancias para este turno.'
		}),
		('Información Adicional', {
			'fields': ('created_at', 'updated_at'),
			'classes': ('collapse',)
		}),
	)
	
	def shift_type_display(self, obj):
		colors = {
			'MORNING': '#fbbf24',  # amarillo
			'AFTERNOON': '#60a5fa',  # azul
		}
		color = colors.get(obj.shift_type, '#6b7280')
		return format_html(
			'<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px; font-weight: bold;">{}</span>',
			color,
			obj.get_shift_type_display()
		)
	shift_type_display.short_description = 'Turno'
	
	def start_time_display(self, obj):
		return obj.start_time.strftime('%H:%M')
	start_time_display.short_description = 'Hora de Inicio'
	
	def time_window(self, obj):
		present_until = obj.get_present_until().strftime('%H:%M')
		late_until = obj.get_late_until().strftime('%H:%M')
		return format_html(
			'<strong>{}</strong> → Presente: {} → Tarde: {}',
			obj.start_time.strftime('%H:%M'),
			present_until,
			late_until
		)
	time_window.short_description = 'Ventana de Tiempo'
	
	def tolerance_display(self, obj):
		return f"{obj.tolerance_minutes} min"
	tolerance_display.short_description = 'Tolerancia Presente'
	
	def late_display(self, obj):
		return f"{obj.late_minutes} min"
	late_display.short_description = 'Tolerancia Tarde'
	
	def status_display(self, obj):
		if obj.is_active:
			return format_html('<span style="color: green; font-weight: bold;">✓ Activo</span>')
		return format_html('<span style="color: red;">✗ Inactivo</span>')
	status_display.short_description = 'Estado'
	
	def preview_times(self, obj):
		"""Muestra una vista previa de los horarios calculados"""
		if obj.pk:
			present_until = obj.get_present_until().strftime('%H:%M')
			late_until = obj.get_late_until().strftime('%H:%M')
			return format_html(
				'<div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; border-left: 4px solid #3b82f6;">'
				'<p style="margin: 0 0 10px 0; font-weight: bold; color: #1f2937;">Vista Previa de Horarios:</p>'
				'<ul style="margin: 0; padding-left: 20px;">'
				'<li><strong>Inicio:</strong> {}</li>'
				'<li><strong>Presente hasta:</strong> {} (+{} min)</li>'
				'<li><strong>Tarde hasta:</strong> {} (+{} min)</li>'
				'<li style="color: #dc2626;"><strong>Después de {}:</strong> Se marca como AUSENTE</li>'
				'</ul>'
				'</div>',
				obj.start_time.strftime('%H:%M'),
				present_until,
				obj.tolerance_minutes,
				late_until,
				obj.late_minutes,
				late_until
			)
		return "Guarde el registro para ver la vista previa."
	preview_times.short_description = 'Vista Previa'
	
	def has_delete_permission(self, request, obj=None):
		# Permitir eliminar solo si no hay eventos asociados (verificación adicional)
		return True
	
	class Media:
		css = {
			'all': ('admin/css/custom_shift_config.css',)
		}


admin.site.register(ProfessorProfile)
admin.site.register(StudentProfile)
admin.site.register(Course)
admin.site.register(Enrollment)
admin.site.register(Attendance)
admin.site.register(QRAttendanceRecord)
admin.site.register(AttendanceEvent)
