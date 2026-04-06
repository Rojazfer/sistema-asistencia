from django.db import migrations, models


def dedupe_student_enrollments(apps, schema_editor):
	Enrollment = apps.get_model('core', 'Enrollment')

	for student_id in Enrollment.objects.values_list('student_id', flat=True).distinct():
		enrollments = list(Enrollment.objects.filter(student_id=student_id).order_by('-id'))
		if len(enrollments) <= 1:
			continue

		for extra in enrollments[1:]:
			extra.delete()


class Migration(migrations.Migration):

	dependencies = [
		('core', '0005_attendanceevent_alter_attendance_unique_together_and_more'),
	]

	operations = [
		migrations.RunPython(dedupe_student_enrollments, migrations.RunPython.noop),
		migrations.AddConstraint(
			model_name='enrollment',
			constraint=models.UniqueConstraint(fields=('student',), name='uq_student_single_course'),
		),
	]