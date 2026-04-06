# 📊 REPORTE DIARIO DE EVENTOS - GUÍA DE USO

## Endpoint

```
GET /api/professor/daily-report/
```

## Autenticación
Requiere un token de profesor válido en el header:
```
Authorization: Token <tu_token_aqui>
```

## Parámetros

### Opcional: `date` (formato: YYYY-MM-DD)
```
GET /api/professor/daily-report/?date=2026-04-02
```

Si no se especifica, usa la fecha actual.

---

## Ejemplo de Respuesta

```json
{
  "date": "2026-04-02",
  "total_events": 3,
  "professor_name": "Fernando Rojas",
  
  "total_enrolled_all_events": 25,
  "total_present_all_events": 22,
  "total_late_all_events": 2,
  "total_absent_all_events": 1,
  "total_scanned_all_events": 24,
  
  "attendance_percentage": 96.0,
  
  "events": [
    {
      "event_id": 18,
      "title": "PRIMER PERIODO - 6TO - C - 2026-04-02",
      "course_name": "6TO",
      "course_parallel": "C",
      "date": "2026-04-02",
      "start_time": "07:30:00",
      "present_until": "08:00:00",
      "late_until": "08:30:00",
      "is_active": true,
      
      "total_enrolled": 25,
      "present_count": 22,
      "late_count": 2,
      "absent_count": 1,
      "scanned_count": 24,
      
      "attendance_records": [
        {
          "student_id": 1,
          "student_name": "AGUILAR GUTIERREZ MIGUEL ANGEL",
          "student_code": "14354555AGM",
          "ci": "14354555",
          "status": "PRESENT",
          "scanned_at": "2026-04-02T07:45:30.123456Z"
        },
        {
          "student_id": 2,
          "student_name": "ALMENDRAS QUINTEROS SHIRLEY",
          "student_code": "14354556ASQ",
          "ci": "14354556",
          "status": "NO_REGISTRADO",
          "scanned_at": null
        }
        // ... más estudiantes
      ]
    },
    {
      "event_id": 19,
      "title": "SEGUNDO PERIODO - 6TO - C - 2026-04-02",
      // ... similar estructura
    }
    // ... más eventos
  ]
}
```

---

## Significado de Campos

### Raíz
- `date`: Fecha del reporte (YYYY-MM-DD)
- `total_events`: Número de eventos ese día
- `professor_name`: Nombre del profesor
- `attendance_percentage`: % de asistencia promedio del día

### Estadísticas Totales (para todos los eventos)
- `total_enrolled_all_events`: Estudiantes inscritos (únicos)
- `total_present_all_events`: Total de presentes en todos eventos
- `total_late_all_events`: Total de tardíos
- `total_absent_all_events`: Total de ausentes
- `total_scanned_all_events`: Total de estudiantes escaneados

### Por Evento
- `event_id`: ID del evento
- `title`: Título del evento
- `course_name`: Nombre del curso (ej: 6TO)
- `course_parallel`: Paralelo (ej: C)
- `total_enrolled`: Estudiantes inscritos en el curso
- `present_count`: Presentes en este evento
- `late_count`: Tardíos
- `absent_count`: Ausentes
- `scanned_count`: Escaneados

### Estado de Asistencia
- `PRESENT`: Presente
- `LATE`: Tarde
- `ABSENT`: Ausente
- `NO_REGISTRADO`: No se registró asistencia (no escaneó)

---

## Ejemplos cURL

### Reporte de hoy
```bash
curl -H "Authorization: Token abc123xyz" \
  http://localhost:8000/api/professor/daily-report/
```

### Reporte de una fecha específica
```bash
curl -H "Authorization: Token abc123xyz" \
  http://localhost:8000/api/professor/daily-report/?date=2026-03-15
```

---

## Uso desde Frontend

```javascript
const date = '2026-04-02'; // Opcional
const response = await fetch(`/api/professor/daily-report/?date=${date}`, {
  headers: {
    'Authorization': `Token ${authToken}`
  }
});

const report = await response.json();

console.log(`📊 Reporte para ${report.professor_name}`);
console.log(`📅 Fecha: ${report.date}`);
console.log(`📈 Eventos: ${report.total_events}`);
console.log(`✅ Asistencia: ${report.attendance_percentage}%`);
console.log(`👥 Estudiantes: ${report.total_enrolled_all_events}`);

// Iterar por eventos
report.events.forEach(event => {
  console.log(`\n🎓 ${event.title}`);
  console.log(`   Presentes: ${event.present_count}/${event.total_enrolled}`);
  
  // Listar estudiantes
  event.attendance_records.forEach(record => {
    console.log(`   - ${record.student_name}: ${record.status}`);
  });
});
```

---

## Casos de Uso

1. **Dashboard Diario**: Mostrar resumen de asistencia del día
2. **PDF Report**: Generar reporte PDF de todos los eventos
3. **Excel Export**: Exportar datos a Excel por evento
4. **Mobile View**: Ver reporte en app móvil
5. **Analytics**: Crear gráficos de tendencias de asistencia
