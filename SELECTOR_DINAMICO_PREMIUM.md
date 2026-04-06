# 🎨 Sistema Dinámico Premium de Selección Turno/Período

## 📋 Descripción

El sistema de selección de turno/período ha sido completamente rediseñado con una interfaz **dinámico en cascada (2 niveles)** y estilos **premium** para una mejor experiencia de usuario.

---

## 🎯 Cómo Funciona

### **Nivel 1: Selección del Turno Base**
```
🕐 Turno:  [Selecciona turno ▼]
           ├─ 🌄 Mañana
           ├─ 🌆 Tarde
           └─ 📚 Períodos
```

**Lo que hace:**
- Agrupa todos los turnos disponibles por tipo
- Solo muestra opciones que tienen períodos disponibles
- Se activa solo cuando se selecciona un curso

### **Nivel 2: Selección del Período**
```
📍 Período: [Selecciona período ▼]
            ├─ (períodos de Mañana)
            ├─ (períodos de Tarde)
            └─ (períodos específicos)
```

**Lo que hace:**
- Filtra dinámicamente los períodos según el turno seleccionado
- Solo se activa después de seleccionar un turno
- Cambia de color y animación cuando se selecciona

---

## 🎨 Estilos Premium

### **Indicadores Visuales**

| Estado | Aspecto | Ícono |
|--------|--------|-------|
| **Desactivado** | Gris claro, opaco | ❌ |
| **Activo (Turno)** | Azul claro (#e8f4f8) | 🕐 |
| **Activo (Período)** | Verde claro (#e8f8f0) | 📍 |
| **Seleccionado** | Borde more colored (2px) | ✅ |

### **Animaciones**
- ✨ Transición suave de 0.25s
- 🎯 Efecto hover con sombra
- 💫 Focus ring visible para accesibilidad

---

## 📱 Ubicación del Selector

### **En la Barra Principal (Profesor)**
```
┌─────────────────────────────────────────────────────┐
│ Curso: [6to - C ▼]  🕐 Turno: [▼]  📍 Período: [▼] │
└─────────────────────────────────────────────────────┘
```
- Se muestra en la barra superior junto al selector de curso
- 2 columnas: Turno (50%) + Período (50%)

### **En el Panel QR/Scanner**
```
┌──────────────────────────────────────────┐
│ Curso: [6to - C ▼]                       │
│ 🕐 Turno: [▼]    📍 Período: [▼]        │
│ Evento activo: [test of asistencia ▼]   │
│ [Iniciar escaner] [Detener]              │
└──────────────────────────────────────────┘
```
- Se muestra debajo del selector de curso
- Diseño responsive que se adapta al ancho

---

## 🔄 Flujo de Datos

```
1. Usuario carga página
   ↓
2. Se cargan todos los turnos (shift-configs/)
   ↓
3. organizePeriodsByShiftType() agrupa los turnos
   ↓
   Categorías creadas:
   - morning (Mañana)
   - afternoon (Tarde)
   - period (Períodos específicos)
   ↓
4. Usuario selecciona Curso
   ↓
5. Los selectores se activan
   ↓
6. Usuario selecciona Turno
   ↓
7. Los períodos se filtran dinámicamente
   ↓
8. Usuario selecciona Período
   ↓
9. activeShiftId se actualiza
   ↓
10. Se envía shift_id con:
    - Registros de asistencia (QR)
    - Registros manuales
    - Creación de eventos
```

---

## 💾 Estados React

```javascript
const [activeShiftType, setActiveShiftType] = useState('')
// Almacena: 'morning' | 'afternoon' | 'period' | ''

const [activePeriodId, setActivePeriodId] = useState('')
// Almacena: ID del período seleccionado

const [activeShiftId, setActiveShiftId] = useState('')
// Almacena: ID del turno (mismo que activePeriodId para compatibilidad)

const [availablePeriodsByShift, setAvailablePeriodsByShift] = useState({})
// Almacena: {morning: [...], afternoon: [...], period: [...]}
```

---

## 🔧 Funciones Clave

### `organizePeriodsByShiftType(shiftsData)`
- **Propósito**: Agrupa los turnos por tipo
- **Entrada**: Array de ShiftConfig del backend
- **Salida**: Objeto con llaves: morning, afternoon, period
- **Lógica**: 
  - Detecta "MORNING" → morning
  - Detecta "AFTERNOON" → afternoon
  - Detecta "PERIODE" o "periodo" → period
  - Todo lo demás → period

### `handleShiftTypeChange(shiftType)`
- **Propósito**: Maneja cambio del turno base
- **Acciones**:
  1. `setActiveShiftType(shiftType)`
  2. Limpia `activePeriodId`
  3. Limpia `activeShiftId`

### `handlePeriodChange(periodId)`
- **Propósito**: Maneja cambio del período
- **Acciones**:
  1. `setActivePeriodId(String(periodId))`
  2. `setActiveShiftId(String(periodId))` (mantiene compatibilidad)

### `getPeriodsForCurrentShiftType()`
- **Propósito**: Retorna períodos basado en turno actual
- **Devuelve**: Array de períodos para mostrar en dropdown

---

## 🎁 Mejoras Incluidas

✅ **Dinámico**: Filtra períodos según turno seleccionado
✅ **Premium**: Estilos modernos con emojis y colores
✅ **Responsive**: Se adapta a diferentes tamaños de pantalla
✅ **Accesible**: Soporta navegación por teclado
✅ **Intuitivo**: Emojis ayudan a identificar cada selector
✅ **Eficiente**: Cambios en cascada sin recargar datos
✅ **Compatible**: Mantiene el envío de shift_id al backend

---

## 🧪 Validación

### Casos de Uso

1. **Caso**: Usuario selecciona curso sin turnos
   - **Resultado**: Ambos selectores deshabilitados ✓

2. **Caso**: Usuario selecciona turno
   - **Resultado**: Período se activa con opciones filtradas ✓

3. **Caso**: Usuario cambia de curso
   - **Resultado**: Turno y período se limpian ✓

4. **Caso**: Usuario escanea QR con período seleccionado
   - **Resultado**: shift_id se envía al backend ✓

---

## 📊 Datos de Ejemplo

### ShiftConfig en Base de Datos
```json
[
  {"id": 7, "shift_type": "MORNING", "shift_type_display": "Mañana"},
  {"id": 8, "shift_type": "AFTERNOON", "shift_type_display": "Tarde"},
  {"id": 12, "shift_type": "1er periodo", "shift_type_display": "1er periodo"},
  {"id": 13, "shift_type": "2do periodo", "shift_type_display": "2do periodo"},
  {"id": 14, "shift_type": "3er periodo", "shift_type_display": "3er periodo"}
]
```

### availablePeriodsByShift Procesado
```javascript
{
  morning: [
    {id: 7, shift_type: "MORNING", shift_type_display: "Mañana"}
  ],
  afternoon: [
    {id: 8, shift_type: "AFTERNOON", shift_type_display: "Tarde"}
  ],
  period: [
    {id: 12, shift_type: "1er periodo", shift_type_display: "1er periodo"},
    {id: 13, shift_type: "2do periodo", shift_type_display: "2do periodo"},
    {id: 14, shift_type: "3er periodo", shift_type_display: "3er periodo"}
  ]
}
```

---

## 🚀 Próximos Pasos

Sugerencias para futuras mejoras:
- Mostrar horarios debajo de cada opción (ej: "Turno Mañana - 08:00 a 13:00")
- Guardar preferencia de turno del usuario
- Mostrar icono de "período seleccionado" en la barra de estado
- Exportar reportes filtrados por turno/período
