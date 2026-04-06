# 📚 Sistema de Gestión de Horarios de Asistencia

## 🎯 Descripción

Sistema para gestionar turnos (Mañana/Tarde) del colegio y facilitar el registro de asistencia por QR sin necesidad de crear eventos manualmente.

---

## ✅ ¿Qué se implementó?

### 1. **Modelo de Base de Datos: `ShiftConfig`**
- Almacena configuraciones de turnos (Mañana/Tarde)
- Campos:
  - `shift_type`: MORNING o AFTERNOON
  - `start_time`: Hora de inicio del turno
  - `tolerance_minutes`: Minutos para marcar PRESENTE
  - `late_minutes`: Minutos para marcar TARDE
  - `is_active`: Si el turno está disponible

### 2. **Panel de Administración Django**
- Interfaz visual para crear/editar horarios
- Vista previa de horarios calculados
- Indicadores de estado con colores

### 3. **API REST**
- Endpoint: `GET /api/shift-configs/`
- Retorna turnos activos disponibles
- Incluye horarios calculados automáticamente

### 4. **Comando de Inicialización**
- `python manage.py init_shifts`: Crea turnos por defecto
- `python manage.py init_shifts --reset`: Recrea todos los turnos

---

## 🚀 Uso del Sistema

### Para el Administrador:

#### 1. **Acceder al Panel de Admin**
```
http://localhost:8000/admin/
```

#### 2. **Configurar Horarios**
1. Ir a: **Configuración de Turnos**
2. Verás los turnos creados (Mañana/Tarde)
3. Clic en un turno para editarlo

#### 3. **Editar un Turno**
```
Turno: Mañana
Hora de inicio: 08:00
Tolerancia para presente: 10 minutos
Tolerancia para tarde: 20 minutos
Activo: ✓

Vista Previa:
├─ Inicio: 08:00
├─ Presente hasta: 08:10 (+10 min)
├─ Tarde hasta: 08:20 (+20 min)
└─ Después de 08:20: Se marca AUSENTE
```

### Para el Profesor (Flujo Propuesto):

#### **Flujo Actual (Manual):**
```
1. Admin crea evento manualmente
2. Profesor selecciona evento
3. Escanea QRs
```

#### **Flujo Nuevo (Automático):**
```
1. Profesor selecciona:
   - Curso: "Matemáticas - A"
   - Turno: "Mañana" o "Tarde"

2. Sistema automáticamente:
   ✓ Busca configuración del turno seleccionado
   ✓ Detecta fecha actual
   ✓ Crea evento si no existe hoy
   ✓ Usa horarios del turno configurado

3. Profesor escanea QRs
   ✓ Sistema registra automáticamente
   ✓ Calcula PRESENTE/TARDE/AUSENTE según hora
```

---

## 📋 Endpoints API

### **Obtener Turnos Disponibles**
```http
GET /api/shift-configs/
```

**Respuesta:**
```json
[
  {
    "id": 1,
    "shift_type": "MORNING",
    "shift_type_display": "Mañana",
    "start_time": "08:00:00",
    "tolerance_minutes": 10,
    "late_minutes": 20,
    "present_until": "08:10:00",
    "late_until": "08:20:00",
    "time_window_display": "08:00 - 08:20",
    "is_active": true
  },
  {
    "id": 2,
    "shift_type": "AFTERNOON",
    "shift_type_display": "Tarde",
    "start_time": "14:00:00",
    "tolerance_minutes": 15,
    "late_minutes": 25,
    "present_until": "14:15:00",
    "late_until": "14:25:00",
    "time_window_display": "14:00 - 14:25",
    "is_active": true
  }
]
```

---

## 🔧 Comandos Útiles

### Inicializar turnos por defecto:
```bash
python manage.py init_shifts
```

### Recrear todos los turnos (elimina existentes):
```bash
python manage.py init_shifts --reset
```

### Ver migraciones aplicadas:
```bash
python manage.py showmigrations core
```

### Aplicar migraciones:
```bash
python manage.py migrate
```

---

## 📊 Configuraciones por Defecto

| Turno | Hora Inicio | Presente hasta | Tarde hasta |
|-------|-------------|----------------|-------------|
| **Mañana** | 08:00 | 08:10 (+10min) | 08:20 (+20min) |
| **Tarde** | 14:00 | 14:15 (+15min) | 14:25 (+25min) |

*Estos valores pueden modificarse desde el admin*

---

## 🎨 Próximos Pasos

Para implementar el sistema completo de auto-creación de eventos, necesitas:

1. **En el frontend:**
   - Agregar dropdown para seleccionar turno
   - Modificar el flujo de escaneo para enviar `shift_type`

2. **En el backend:**
   - Crear vista `quick_scan` que:
     - Reciba: `course_id`, `shift_type`, `qr_payload`
     - Busque configuración del turno
     - Cree evento automáticamente si no existe
     - Registre asistencia

3. **Vista de ejemplo:**
```python
def quick_scan(request):
    course = get_object_or_404(Course, id=request.data['course_id'])
    shift_type = request.data['shift_type']  # 'MORNING' o 'AFTERNOON'
    
    # Obtener configuración del turno
    shift_config = ShiftConfig.objects.get(shift_type=shift_type, is_active=True)
    
    # Buscar o crear evento para hoy
    today = timezone.localdate()
    event, created = AttendanceEvent.objects.get_or_create(
        course=course,
        date=today,
        defaults={
            'title': f'Clase {today} - {shift_config.get_shift_type_display()}',
            'start_time': shift_config.start_time,
            'present_until': shift_config.get_present_until(),
            'late_until': shift_config.get_late_until(),
            'professor': course.professor
        }
    )
    
    # Registrar asistencia...
```

---

## 📁 Archivos Modificados

- ✅ `backend/core/models.py` - Modelo ShiftConfig
- ✅ `backend/core/admin.py` - Admin con interfaz visual
- ✅ `backend/core/serializers.py` - ShiftConfigSerializer
- ✅ `backend/core/views.py` - ShiftConfigListView
- ✅ `backend/core/urls.py` - Ruta /api/shift-configs/
- ✅ `backend/core/migrations/0009_shiftconfig.py` - Migración aplicada
- ✅ `backend/core/management/commands/init_shifts.py` - Comando de inicialización

---

## 🎓 Uso en el Admin

1. Accede a: http://localhost:8000/admin/
2. Navega a: **Configuración de Turnos**
3. Verás la lista de turnos:

```
┌────────────────────────────────────────────────────────────────┐
│ Turno    │ Hora  │ Ventana de Tiempo        │ Tolerancia │ ... │
├────────────────────────────────────────────────────────────────┤
│ Mañana   │ 08:00 │ 08:00 → Presente: 08:10 → Tarde: 08:20     │
│ Tarde    │ 14:00 │ 14:00 → Presente: 14:15 → Tarde: 14:25     │
└────────────────────────────────────────────────────────────────┘
```

4. Clic en cualquier turno para editarlo
5. Los cambios se aplican inmediatamente

---

## 💡 Ventajas del Sistema

✅ **Cero configuración diaria** - Profesor solo selecciona turno  
✅ **Centralizado** - Admin cambia horarios una vez, afecta a todos  
✅ **Automático** - Eventos se crean solos según turno  
✅ **Flexible** - Diferentes tolerancias para mañana/tarde  
✅ **Escalable** - Fácil agregar más turnos si es necesario  

---

¿Necesitas ayuda para implementar algo más? 🚀
