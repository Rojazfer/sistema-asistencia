# Guia paso a paso para levantar servidores (Windows PowerShell)

## Objetivo
Levantar:
- Backend Django en http://127.0.0.1:8000
- Frontend Vite en http://localhost:5173

---

## Paso 1: Abrir proyecto
1. Abre VS Code en la carpeta del proyecto.
2. Ten listas 2 terminales PowerShell:
   - Terminal A: backend
   - Terminal B: frontend

---

## Paso 2: Levantar backend (Terminal A)
Ejecuta estos comandos en orden:

```powershell
cd C:\Users\FERCHO\Documents\asistencia\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install django djangorestframework django-cors-headers qrcode pillow reportlab
python manage.py migrate
python manage.py runserver
```

Si todo va bien, veras algo parecido a:
- Starting development server at http://127.0.0.1:8000/

### Si falla la activacion del entorno virtual
Ejecuta esto una sola vez en esa terminal y vuelve a activar:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

---

## Paso 3: Levantar frontend (Terminal B)
Ejecuta estos comandos en orden:

```powershell
cd C:\Users\FERCHO\Documents\asistencia\backend\frontend
npm install
npm run dev
```

Si todo va bien, Vite mostrara la URL local (normalmente):
- http://localhost:5173

---

## Paso 4: Probar en navegador
- Frontend: http://localhost:5173
- Backend: http://127.0.0.1:8000

---

## Paso 5: Como apagar servidores
- En cada terminal presiona: Ctrl + C

---

## Uso diario (cuando ya instalaste todo)
### Backend
```powershell
cd C:\Users\FERCHO\Documents\asistencia\backend
.\.venv\Scripts\Activate.ps1
python manage.py runserver
```

### Frontend
```powershell
cd C:\Users\FERCHO\Documents\asistencia\backend\frontend
npm run dev
```
