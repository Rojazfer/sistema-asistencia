"""
Comando para inicializar las configuraciones de turnos del colegio.
Uso: python manage.py init_shifts
"""
from datetime import time
from django.core.management.base import BaseCommand
from core.models import ShiftConfig


class Command(BaseCommand):
	help = 'Inicializa las configuraciones de turnos (Mañana y Tarde) con valores por defecto'

	def add_arguments(self, parser):
		parser.add_argument(
			'--reset',
			action='store_true',
			help='Elimina y recrea todas las configuraciones de turno',
		)

	def handle(self, *args, **options):
		if options['reset']:
			self.stdout.write(self.style.WARNING('Eliminando configuraciones existentes...'))
			ShiftConfig.objects.all().delete()

		# Configuración Turno Mañana
		# Ingreso: 7:30, 1er periodo: 7:30-9:00, 2do: 9:20-11:00, 3ro: 11:10-12:00
		morning, created = ShiftConfig.objects.get_or_create(
			shift_type=ShiftConfig.ShiftType.MORNING,
			defaults={
				'start_time': time(7, 30),  # 07:30 - Hora de ingreso
				'tolerance_minutes': 10,     # Hasta 07:40 para marcar presente
				'late_minutes': 30,          # Hasta 08:00 para marcar tarde
				'is_active': True,
			}
		)
		if created:
			self.stdout.write(self.style.SUCCESS(f'✓ Creado turno Mañana: {morning}'))
		else:
			self.stdout.write(self.style.WARNING(f'⚠ Turno Mañana ya existe: {morning}'))

		# Configuración Turno Tarde
		# Ingreso: 14:00, 1er periodo: 14:00-15:20, 2do: 15:30-16:40, 3ro: 17:00-18:20
		afternoon, created = ShiftConfig.objects.get_or_create(
			shift_type=ShiftConfig.ShiftType.AFTERNOON,
			defaults={
				'start_time': time(14, 0),  # 14:00 - Hora de ingreso
				'tolerance_minutes': 10,     # Hasta 14:10 para marcar presente
				'late_minutes': 30,          # Hasta 14:30 para marcar tarde
				'is_active': True,
			}
		)
		if created:
			self.stdout.write(self.style.SUCCESS(f'✓ Creado turno Tarde: {afternoon}'))
		else:
			self.stdout.write(self.style.WARNING(f'⚠ Turno Tarde ya existe: {afternoon}'))

		self.stdout.write(self.style.SUCCESS('\n✅ Proceso completado'))
		self.stdout.write(self.style.SUCCESS('\nHorarios del colegio:'))
		self.stdout.write(self.style.SUCCESS('  MAÑANA: Ingreso 7:30, Periodos: 7:30-9:00, 9:20-11:00, 11:10-12:00'))
		self.stdout.write(self.style.SUCCESS('  TARDE: Ingreso 14:00, Periodos: 14:00-15:20, 15:30-16:40, 17:00-18:20'))
		self.stdout.write(self.style.SUCCESS('\nPuedes modificar estos horarios desde el panel de administración:'))
		self.stdout.write(self.style.SUCCESS('  Admin → Configuración de Turnos'))
