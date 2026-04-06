# 📊 ANÁLISIS DETALLADO: ESTRUCTURA DE CURSOS Y DUPLICADOS

## 🎯 RESUMEN EJECUTIVO

Tu sistema tiene **2 problemas principales**:
1. **89 registros de asistencia DUPLICADOS** (CRÍTICO) ← Causa del error 500
2. **Diseño confuso entre Shifts y Events** (IMPORTANTE) ← Causa duplicados

---

## 📈 ESTADO ACTUAL DE DATOS

```
Profesores: 4
Estudiantes: 172
Cursos: 9
Inscripciones: 171
Registros de asistencia: 270 (pero hay 89 duplicados)
```

### Distribución de Cursos por Profesor

| Profesor | Cursos |
|----------|--------|
| Fernando Rojas | 2 (5to-C, 6TO-C) |
| Isaac Vasquez Roque | 2 (5to-A, 6to-A) |
| Janett Martha Caviña Gomez | 3 (4to-A, 4to-B, 4to-C) |
| Verónica Alvarado | 2 (5to-B, 6to-B) |

---

## 🚨 PROBLEMA 1: ASISTENCIAS DUPLICADAS (CRÍTICO)

### Síntomas
```
⚠️ 89 asistencias duplicadas encontradas
Ejemplo: MARY LUZ MORENO QUISPE - 6TO - 2026-03-16
  • ID 1: PRESENT (Shift: None, Event: None)
  • ID 384: ABSENT (Shift: None, Event: None)
```

### Causa Raíz
El modelo `Attendance` define:
```python
class Meta:
    unique_together = ('student', 'course', 'shift', 'date')
```

Pero el código en `views.py:577` hace:
```python
Attendance.objects.update_or_create(
    student=student,
    date=event_date,
    course=course,  # ← FALTA incluir shift/event en lookup!
    defaults={
        'status': attendance_status,
        'shift': None,
        'event': event,
    }
)
```

**Resultado**: Cuando hay múltiples eventos el mismo día para el mismo estudiante/curso, 
crea nuevos registros en lugar de actualizar porque `shift=None` no está en el lookup.

### Impacto
Este error causa que cuando intentas registrar asistencia:
```
core.models.Attendance.MultipleObjectsReturned: 
get() returned more than one Attendance -- it returned 2!
```

---

## 🔀 PROBLEMA 2: DISEÑO CONFUSO (Shifts vs Events)

### El Conflicto

Tu modelo tiene **2 formas de registrar asistencia**:

#### Opción A: Por Turno (Shift)
```python
# Antiguo sistema de rotación (Mañana/Tarde)
ShiftConfig → 6:07:30-08:30 (Mañana)
           → 13:30-15:00 (Tarde)
```

#### Opción B: Por Evento (Event)  
```python
# Nuevo sistema flexible (Profesor crea eventos por clase)
AttendanceEvent → "PRIMER PERIODO - 6TO - C - 2026-04-02"
               → Horario personalizado
```

### El Problema
Tienes **registros mixtos**:
```
Estudiante: MARY LUZ MORENO QUISPE
Fecha: 2026-03-26

ID 245: Shift='MANANA_1ER_PERIODO', Event=None          ← Por turno
ID 298: Shift=None, Event=None                           ← ¿Qué es?
ID 318: Shift=None, Event=None                           ← ¿Qué es?
ID 338: Shift=None, Event=None                           ← ¿Qué es?
```

**Pregunta**: ¿Usan ambos sistemas a la vez o migraste de uno al otro?

---

## ✅ LO QUE ESTÁ BIEN

### 1. Cursos
✓ **No hay cursos duplicados**
- Constraint `unique_together = ('name', 'parallel', 'professor')` funciona
- Cada profesor tiene sus propios cursos
- 9 cursos bien organizados

### 2. Inscripciones
✓ **No hay estudiantes con múltiples inscripciones**
- 171 inscripciones para 172 estudiantes
- Estructura correcta: 1 estudiante → 1 curso

---

## 💡 RECOMENDACIONES

### Opción A: Limpiar y Consolidar (Rápido)
```bash
1. Eliminar todos los registros de Attendance duplicados
2. Dejar solo el más reciente por (estudiante, curso, fecha)
3. Decidir: ¿Usas Shifts O Events?
```

### Opción B: Rediseñar el Modelo (Mejor a Largo Plazo)

**Propuesta nueva**:
```python
class AttendanceRecord(models.Model):
    """Registro único de asistencia"""
    student = ForeignKey(StudentProfile)
    course = ForeignKey(Course)
    date = DateField()
    
    # SOLO UNA de estas:
    shift = ForeignKey(ShiftConfig, null=True)
    OR
    event = ForeignKey(AttendanceEvent, null=True)
    
    status = CharField(choices=PRESENT/LATE/ABSENT)
    
    class Meta:
        unique_together = ('student', 'course', 'date')  # ← Simple!
```

---

## 🔧 ACCIONES REQUERIDAS

### Paso 1: Decidir Sistema
¿Prefieres usar:
- **A) Sistema de Turnos** (Mañana/Tarde fijo): Más simple, menos flexible
- **B) Sistema de Eventos** (Eventos ad-hoc): Más flexible, más complejo
- **C) Ambos** (Híbrido): Más complejidad, máxima flexibilidad

### Paso 2: Limpiar Datos
Ejecutar script de limpieza de duplicados

### Paso 3: Arreglar Vistas (views.py)
Corregir lógica de `update_or_create` para incluir el campo correcto

### Paso 4: Testing
Garantizar que no se crean nuevos duplicados
