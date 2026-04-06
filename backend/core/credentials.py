"""
Generador de credenciales estudiantiles en PDF
Formato: 8 credenciales por hoja oficio (21.6 x 35.6 cm)
Dimensiones por credencial: 10 cm alto x 5.4 cm ancho
"""

from io import BytesIO
import os
from pathlib import Path
import qrcode
from reportlab.lib.pagesizes import A4, portrait
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont


class CredentialGenerator:
    """Generador de credenciales estudiantiles en PDF"""
    
    # Dimensiones de hoja oficio en landscape
    PAGE_WIDTH = 21.6 * cm
    PAGE_HEIGHT = 35.6 * cm
    
    # Dimensiones de cada credencial
    CARD_WIDTH = 10.0 * cm
    CARD_HEIGHT = 5.4 * cm
    
    # Margen entre credenciales
    MARGIN_X = 0.8 * cm
    MARGIN_Y = 0.8 * cm
    
    # Colores guindo y blanco
    BURGUNDY_DARK = HexColor('#5E001F')  # Guindo oscuro
    BURGUNDY_MAIN = HexColor('#800020')   # Guindo principal
    BURGUNDY_LIGHT = HexColor('#A0334D')  # Guindo claro
    GOLD = HexColor('#D4AF37')            # Dorado para detalles premium
    WHITE = HexColor('#FFFFFF')
    GRAY_LIGHT = HexColor('#F5F5F5')
    SECURITY_PATTERN = HexColor('#E8D5D8')  # Para marca de agua
    
    def __init__(self):
        self.buffer = BytesIO()
        self.c = canvas.Canvas(self.buffer, pagesize=(self.PAGE_WIDTH, self.PAGE_HEIGHT))
        
    def generate_qr(self, data):
        """Genera código QR y retorna ImageReader"""
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=15,
            border=1,
        )
        qr.add_data(data)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        img_buffer = BytesIO()
        img.save(img_buffer, format='PNG')
        img_buffer.seek(0)
        
        return ImageReader(img_buffer)
    
    def draw_security_pattern(self, x, y):
        """Dibuja patrón de seguridad anti-copia (solo líneas guilloche)"""
        self.c.saveState()
        
        # Patrón de líneas guilloche (seguridad) muy tenue
        self.c.setStrokeColor(self.SECURITY_PATTERN)
        self.c.setLineWidth(0.2)
        for i in range(0, int(self.CARD_WIDTH), 4):
            self.c.line(x + i, y, x + i + 8, y + self.CARD_HEIGHT)
        
        self.c.restoreState()
    
    def draw_logo_watermark(self, x, y):
        """Dibuja logo grande y transparente como marca de agua de fondo"""
        try:
            # Buscar el logo
            current_dir = Path(__file__).resolve().parent.parent
            logo_path = current_dir / 'frontend' / 'public' / 'logo_colegio.jpg'
            
            if logo_path.exists():
                logo_img = ImageReader(str(logo_path))
                
                # Logo grande y centrado como marca de agua
                logo_size = 4.2 * cm  # Aumentado de 3.5 a 4.2 cm
                logo_x = x + (self.CARD_WIDTH - logo_size) / 2
                logo_y = y + (self.CARD_HEIGHT - logo_size) / 2
                
                # Guardar estado y aplicar transparencia
                self.c.saveState()
                self.c.setFillAlpha(0.12)  # 12% de opacidad (más sutil)
                
                # Dibujar logo
                self.c.drawImage(logo_img, logo_x, logo_y, 
                               width=logo_size, height=logo_size, 
                               preserveAspectRatio=True, mask='auto')
                
                self.c.restoreState()
        except Exception as e:
            print(f"Error cargando logo watermark: {e}")
    
    def draw_credential(self, x, y, student_data):
        """Dibuja una credencial individual con diseño premium"""
        
        # === FONDO BASE ===
        self.c.setFillColor(self.WHITE)
        self.c.rect(x, y, self.CARD_WIDTH, self.CARD_HEIGHT, fill=1, stroke=0)
        
        # === LOGO COMO MARCA DE AGUA (TRANSPARENTE Y GRANDE) ===
        self.draw_logo_watermark(x, y)
        
        # === BANDA SUPERIOR GUINDO ===
        self.c.setFillColor(self.BURGUNDY_MAIN)
        band_height = 1.2 * cm
        self.c.rect(x, y + self.CARD_HEIGHT - band_height, self.CARD_WIDTH, band_height, fill=1, stroke=0)
        
        # Borde dorado superior
        self.c.setStrokeColor(self.GOLD)
        self.c.setLineWidth(2)
        self.c.line(x, y + self.CARD_HEIGHT - band_height, 
                   x + self.CARD_WIDTH, y + self.CARD_HEIGHT - band_height)
        
        # === ENCABEZADO ===
        self.c.setFillColor(self.WHITE)
        self.c.setFont('Helvetica-Bold', 8)
        self.c.drawCentredString(
            x + self.CARD_WIDTH / 2,
            y + self.CARD_HEIGHT - 0.45*cm,
            'COLEGIO'
        )
        self.c.setFont('Helvetica-Bold', 11)
        self.c.drawCentredString(
            x + self.CARD_WIDTH / 2,
            y + self.CARD_HEIGHT - 0.9*cm,
            'NACIONAL AYACUCHO'
        )
        
        # === INFORMACIÓN DEL ESTUDIANTE ===
        # Posición inicial más abajo para dar espacio
        info_start_y = y + self.CARD_HEIGHT - band_height - 0.5*cm
        
        # Nombre del estudiante (destacado)
        self.c.setFillColor(self.BURGUNDY_DARK)
        self.c.setFont('Helvetica-Bold', 10)
        name = student_data.get('full_name', 'SIN NOMBRE').upper()
        if len(name) > 28:
            name = name[:25] + '...'
        self.c.drawCentredString(x + self.CARD_WIDTH / 2, info_start_y, name)
        
        # Línea decorativa
        self.c.setStrokeColor(self.BURGUNDY_LIGHT)
        self.c.setLineWidth(0.5)
        line_margin = 1*cm
        self.c.line(x + line_margin, info_start_y - 0.25*cm, 
                   x + self.CARD_WIDTH - line_margin, info_start_y - 0.25*cm)
        
        # CI y Código (lado izquierdo) - ESPACIADO MEJORADO
        left_x = x + 0.4*cm
        text_y = info_start_y - 0.65*cm  # Primera línea
        
        self.c.setFillColor(HexColor('#333333'))
        self.c.setFont('Helvetica', 7)
        self.c.drawString(left_x, text_y, 'C.I.:')
        self.c.setFont('Helvetica-Bold', 8)
        self.c.drawString(left_x + 0.7*cm, text_y, str(student_data.get('ci', 'N/A')))
        
        # Código - Segunda línea con más espacio
        text_y -= 0.7*cm  # 6mm de espacio entre líneas (aumentado)
        self.c.setFont('Helvetica', 7)
        self.c.drawString(left_x, text_y, 'Código:')
        self.c.setFont('Helvetica-Bold', 7)
        code = str(student_data.get('student_code', 'N/A'))
        if len(code) > 14:
            code = code[:12] + '...'
        self.c.drawString(left_x + 0.9*cm, text_y, code)  # Más espacio horizontal
        
        # Curso - Tercera línea con más espacio
        text_y -= 0.6*cm  # 6mm de espacio entre líneas (aumentado)
        self.c.setFont('Helvetica', 7)
        self.c.drawString(left_x, text_y, 'Curso:')
        self.c.setFont('Helvetica-Bold', 8)
        course = str(student_data.get('course', 'N/A'))
        self.c.drawString(left_x + 0.9*cm, text_y, course)  # Más espacio horizontal
        
        # === CÓDIGO QR ===
        qr_data = student_data.get('qr_payload', '')
        if qr_data:
            qr_img = self.generate_qr(qr_data)
            qr_size = 2.5 * cm
            qr_x = x + self.CARD_WIDTH - qr_size - 0.25*cm
            qr_y = y + 0.2*cm
            
            # Marco dorado para QR
            self.c.setStrokeColor(self.GOLD)
            self.c.setLineWidth(1.5)
            self.c.rect(qr_x - 0.08*cm, qr_y - 0.08*cm, 
                       qr_size + 0.16*cm, qr_size + 0.16*cm, 
                       fill=0, stroke=1)
            
            self.c.drawImage(qr_img, qr_x, qr_y, width=qr_size, height=qr_size)
        
        # === NÚMERO DE SERIE (seguridad) - Lado izquierdo inferior ===
        self.c.setFillColor(self.BURGUNDY_LIGHT)
        self.c.setFont('Helvetica', 5)
        serial = f"Serie: {student_data.get('ci', '000000')[-6:]}"
        self.c.drawString(x + 0.3*cm, y + 0.3*cm, serial)
        
        # === BORDE EXTERIOR PREMIUM ===
        # Borde guindo oscuro
        self.c.setStrokeColor(self.BURGUNDY_DARK)
        self.c.setLineWidth(2)
        self.c.rect(x, y, self.CARD_WIDTH, self.CARD_HEIGHT, fill=0, stroke=1)
        
        # Borde dorado interior
        self.c.setStrokeColor(self.GOLD)
        self.c.setLineWidth(0.8)
        margin = 0.1*cm
        self.c.rect(x + margin, y + margin, 
                   self.CARD_WIDTH - 2*margin, self.CARD_HEIGHT - 2*margin, 
                   fill=0, stroke=1)
    
    def generate_credentials_page(self, students):
        """
        Genera una página con hasta 8 credenciales
        Layout: 2 columnas x 4 filas
        """
        # Calcular posiciones iniciales (centradas en la página)
        start_x = (self.PAGE_WIDTH - (2 * self.CARD_WIDTH + self.MARGIN_X)) / 2
        start_y = self.PAGE_HEIGHT - self.CARD_HEIGHT - 1*cm
        
        for idx, student in enumerate(students[:8]):  # Máximo 8 por página
            col = idx % 2  # Columna (0 o 1)
            row = idx // 2  # Fila (0, 1, 2, 3)
            
            x = start_x + col * (self.CARD_WIDTH + self.MARGIN_X)
            y = start_y - row * (self.CARD_HEIGHT + self.MARGIN_Y)
            
            self.draw_credential(x, y, student)
    
    def generate_pdf(self, students_list):
        """
        Genera PDF completo con todas las credenciales
        Agrupa estudiantes en páginas de 8 credenciales cada una
        """
        # Procesar estudiantes en grupos de 8
        for i in range(0, len(students_list), 8):
            page_students = students_list[i:i+8]
            self.generate_credentials_page(page_students)
            
            # Nueva página si hay más estudiantes
            if i + 8 < len(students_list):
                self.c.showPage()
        
        # Finalizar PDF
        self.c.save()
        self.buffer.seek(0)
        return self.buffer
