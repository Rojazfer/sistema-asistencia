#!/usr/bin/env python
"""Script de prueba para generar credenciales"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.credentials import CredentialGenerator

# Datos de prueba
test_student = {
    'full_name': 'JUAN PEREZ LOPEZ',
    'ci': '12345678',
    'student_code': '12345678JPL',
    'course': '6TO - A',
    'qr_payload': 'COLEGIO=NACIONAL AYACUCHO;CODIGO=12345678JPL;CI=12345678;NOMBRE=JUAN PEREZ LOPEZ;CURSO=6TO - A'
}

print("Iniciando generación de credencial de prueba...")

try:
    generator = CredentialGenerator()
    print("✓ CredentialGenerator creado")
    
    # Probar dibujo de credencial
    generator.draw_credential(2, 2, test_student)
    print("✓ draw_credential ejecutado")
    
    # Generar PDF completo
    pdf_buffer = generator.generate_pdf([test_student])
    print(f"✓ PDF generado: {len(pdf_buffer.getvalue())} bytes")
    
    # Guardar archivo de prueba
    with open('test_credential.pdf', 'wb') as f:
        f.write(pdf_buffer.getvalue())
    
    print("✅ ÉXITO: Credencial generada en test_credential.pdf")
    
except Exception as e:
    print(f"❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
