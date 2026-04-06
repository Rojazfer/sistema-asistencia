import { useEffect, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import {
  BookOpen,
  BookPlus,
  Camera,
  CalendarClock,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ClipboardCheck,
  Clock3,
  Eye,
  FileDown,
  GraduationCap,
  LayoutDashboard,
  LogIn,
  LogOut,
  ScanLine,
  QrCode,
  Search,
  Settings,
  Shield,
  StopCircle,
  SquarePen,
  Trash2,
  UserCircle2,
  UserCog,
  UserMinus,
  Users,
  X,
} from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { QRCodeCanvas } from 'qrcode.react'
import { useLocation, useNavigate } from 'react-router-dom'
import './App.css'

const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '')

function App() {




  const [schoolName, setSchoolName] = useState('NACIONAL AYACUCHO')
  const [message, setMessage] = useState('')
  const [activeMenu, setActiveMenu] = useState('Dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [students, setStudents] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [professors, setProfessors] = useState([])
  const [loadingProfessors, setLoadingProfessors] = useState(false)
  const [editingProfessor, setEditingProfessor] = useState(null)
  const [editProfessorForm, setEditProfessorForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    employee_code: '',
    password: '',
  })
  const [assigningProfessor, setAssigningProfessor] = useState(null)
  const [assignCourseForm, setAssignCourseForm] = useState({ course_name: '', course_parallel: '' })
  const [assignCourseEditingId, setAssignCourseEditingId] = useState(null)
  const [assignCourseEditForm, setAssignCourseEditForm] = useState({ course_name: '', course_parallel: '' })
  const [assignCourseSearchInput, setAssignCourseSearchInput] = useState('')
  const [assignCourseSearchTerm, setAssignCourseSearchTerm] = useState('')
  const [assignCourseSortBy, setAssignCourseSortBy] = useState('name-asc')
  const [assignCoursePage, setAssignCoursePage] = useState(1)
  const [pendingDeleteAssignedCourse, setPendingDeleteAssignedCourse] = useState(null)
  const [pendingDeleteAdminCourse, setPendingDeleteAdminCourse] = useState(null)
  const [pendingDeleteProfessor, setPendingDeleteProfessor] = useState(null)
  // Estado para el modal de eliminación de turnos/periodos
  const [modalDeleteShift, setModalDeleteShift] = useState({ open: false, shift: null })
  const [viewingProfessorCourses, setViewingProfessorCourses] = useState(null)
  const [authToken, setAuthToken] = useState(localStorage.getItem('authToken') || '')
  const [authUser, setAuthUser] = useState(() => {
    const raw = localStorage.getItem('authUser')
    return raw ? JSON.parse(raw) : null
  })
  const [authMessage, setAuthMessage] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [activeAuthFeature, setActiveAuthFeature] = useState('seguro')
  const [isAuthPanelExpanded, setIsAuthPanelExpanded] = useState(true)
  const [authCardFx, setAuthCardFx] = useState({ rotateX: 0, rotateY: 0, glowX: 74, glowY: 20 })
  const [currentTime, setCurrentTime] = useState(() => new Date())
  const [serverClockInfo, setServerClockInfo] = useState({
    time: '',
    date: '',
    timezone: '',
  })
  const [serverClockOffsetMs, setServerClockOffsetMs] = useState(0)
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [professorForm, setProfessorForm] = useState({
    username: '',
    first_name: '',
    last_name: '',
    password: '',
  })
  const [newProfessorCourses, setNewProfessorCourses] = useState([{ name: '', parallel: '' }])
  const [isScannerRunning, setIsScannerRunning] = useState(false)
  const [scanMessage, setScanMessage] = useState('Escaner listo para iniciar.')
  const [scanSeverity, setScanSeverity] = useState('info')
  const [scanLogs, setScanLogs] = useState([])
  // Filtros basados en eventos: Curso, Evento, Fecha, Búsqueda, Estado
  const [attendanceCourseFilter, setAttendanceCourseFilter] = useState('ALL')
  const [attendanceEventFilter, setAttendanceEventFilter] = useState('ALL')
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState('ALL')
  const [attendanceDateFilter, setAttendanceDateFilter] = useState('')
  const [attendanceSearchTerm, setAttendanceSearchTerm] = useState('')
  const [attendanceMessage, setAttendanceMessage] = useState('')
  const [reportMessage, setReportMessage] = useState('')
  const [adminActivity, setAdminActivity] = useState([])
  const [loadingAdminActivity, setLoadingAdminActivity] = useState(false)
  const [adminCourseFilter, setAdminCourseFilter] = useState('')
  const [adminDateFilter, setAdminDateFilter] = useState('')
  const [myCourses, setMyCourses] = useState([])
  const [activeCourseId, setActiveCourseId] = useState('')
  const [activeShiftId, setActiveShiftId] = useState('')
  const [activeShiftType, setActiveShiftType] = useState('')
  const [activePeriodId, setActivePeriodId] = useState('')
  const [availablePeriodsByShift, setAvailablePeriodsByShift] = useState({})
  const [loadingMyCourses, setLoadingMyCourses] = useState(false)
  const [myEvents, setMyEvents] = useState([])
  const [activeEventId, setActiveEventId] = useState('')
  const [newCourseForm, setNewCourseForm] = useState({ name: '', parallel: '' })
  const [eventForm, setEventForm] = useState({ title: '', date: '', start_time: '', present_until: '', late_until: '' })
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState(null)
  const [hoveredEventId, setHoveredEventId] = useState(null)
  const [adminCourseForm, setAdminCourseForm] = useState({ name: '', parallel: '', professor_id: '' })
  const [editingAdminCourse, setEditingAdminCourse] = useState(null)
  const [adminCourseEditForm, setAdminCourseEditForm] = useState({ name: '', parallel: '', professor_id: '' })
  const [adminCourseMessage, setAdminCourseMessage] = useState('')
  const [profStudentForm, setProfStudentForm] = useState({ ci: '', full_name: '' })
  const [profStudentMessage, setProfStudentMessage] = useState('')
  const [profStudentCard, setProfStudentCard] = useState(null)
  const [pendingCourseSwitch, setPendingCourseSwitch] = useState(null)
  const [profCourseStudents, setProfCourseStudents] = useState([])
  const [loadingProfCourseStudents, setLoadingProfCourseStudents] = useState(false)
  const [totalStudents, setTotalStudents] = useState(0)
  const [pendingRemovalStudent, setPendingRemovalStudent] = useState(null)
  const [isRemovingStudent, setIsRemovingStudent] = useState(false)
  const [generatingCredentials, setGeneratingCredentials] = useState(false)
  const [showCredentialsModal, setShowCredentialsModal] = useState(false)
  const [form, setForm] = useState({
    ci: '',
    full_name: '',
    course_name: '',
  })
  const [registeredStudent, setRegisteredStudent] = useState(null)
  const [expandedDays, setExpandedDays] = useState({})
  // Eliminado acordeón de eventos, no se usa más
  const [viewingStudent, setViewingStudent] = useState(null)
  const [editingStudent, setEditingStudent] = useState(null)
  const [editStudentForm, setEditStudentForm] = useState({
    ci: '',
    full_name: '',
    course_name: '',
  })
  const [pendingDeleteStudent, setPendingDeleteStudent] = useState(null)
  const [showStudentSavedModal, setShowStudentSavedModal] = useState(false)
  const [shifts, setShifts] = useState([])
  const [loadingShifts, setLoadingShifts] = useState(false)
  const [editingShift, setEditingShift] = useState(null)
  const [shiftForm, setShiftForm] = useState({
    shift_type: '',
    start_time: '08:00',
    tolerance_minutes: 10,
    late_minutes: 20,
    is_active: true,
  })
  const [shiftMessage, setShiftMessage] = useState('')
  
  // Estado para reporte diario de eventos
  const [dailyReport, setDailyReport] = useState(null)
  const [loadingDailyReport, setLoadingDailyReport] = useState(false)
  const [dailyReportDate, setDailyReportDate] = useState('')
  const [dailyReportMessage, setDailyReportMessage] = useState('')
  const [expandedEvents, setExpandedEvents] = useState({})
  const [reportCourseFilter, setReportCourseFilter] = useState('ALL')
  
  const scannerRef = useRef(null)
  const lastScannedRef = useRef('')
  const professorCiInputRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  const menus = [
    { label: 'Dashboard', icon: LayoutDashboard },
    { label: 'Estudiantes', icon: Users },
    { label: 'Profesores', icon: UserCog },
    { label: 'Cursos', icon: BookOpen },
    { label: 'Horarios', icon: Clock3 },
    { label: 'Asistencia', icon: ClipboardCheck },
    { label: 'Reportes', icon: GraduationCap },
    { label: 'QR y Escaner', icon: QrCode },
    { label: 'Configuracion', icon: Settings },
  ]

  const professorMenus = [
    { label: 'Dashboard', icon: LayoutDashboard },
    { label: 'Estudiantes', icon: Users },
    { label: 'Cursos', icon: BookOpen },
    { label: 'Eventos', icon: CalendarClock },
    { label: 'QR y Escaner', icon: QrCode },
    { label: 'Asistencia', icon: ClipboardCheck },
    { label: 'Reportes', icon: FileDown },
  ]

  const menuToRoute = {
    Dashboard: '/dashboard',
    Estudiantes: '/estudiantes',
    Profesores: '/profesores',
    Cursos: '/cursos',
    Horarios: '/horarios',
    Eventos: '/eventos',
    Asistencia: '/asistencia',
    Reportes: '/reportes',
    'QR y Escaner': '/qr-escaner',
    Configuracion: '/configuracion',
  }

  const routeToMenu = {
    '/dashboard': 'Dashboard',
    '/estudiantes': 'Estudiantes',
    '/profesores': 'Profesores',
    '/cursos': 'Cursos',
    '/horarios': 'Horarios',
    '/eventos': 'Eventos',
    '/asistencia': 'Asistencia',
    '/reportes': 'Reportes',
    '/qr-escaner': 'QR y Escaner',
    '/configuracion': 'Configuracion',
  }

  const authFeatureItems = [
    {
      key: 'seguro',
      title: 'Seguro',
      description: 'Acceso con sesiones protegidas y control de permisos por rol.',
      icon: Shield,
    },
    {
      key: 'escaneo',
      title: 'Escaneo',
      description: 'Lectura QR rapida para registrar asistencia en segundos.',
      icon: QrCode,
    },
    {
      key: 'control',
      title: 'Control',
      description: 'Seguimiento de asistencia por curso, fecha y estado de puntualidad.',
      icon: ClipboardCheck,
    },
    {
      key: 'eventos',
      title: 'Eventos',
      description: 'Programacion de eventos academicos con ventanas de registro.',
      icon: CalendarClock,
    },
  ]

  const activeAuthFeatureData = authFeatureItems.find((item) => item.key === activeAuthFeature) || authFeatureItems[0]

  const handleAuthCardMove = (event) => {
    if (window.matchMedia('(pointer: coarse)').matches) {
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width
    const py = (event.clientY - rect.top) / rect.height
    const rotateX = (0.5 - py) * 7
    const rotateY = (px - 0.5) * 9

    setAuthCardFx({
      rotateX,
      rotateY,
      glowX: Math.round(px * 100),
      glowY: Math.round(py * 100),
    })
  }

  const resetAuthCardFx = () => {
    setAuthCardFx({ rotateX: 0, rotateY: 0, glowX: 74, glowY: 20 })
  }

  const getScanStatusMeta = (status) => {
    if (status === 'PRESENT') {
      return { label: 'Presente', className: 'is-registered' }
    }
    if (status === 'LATE') {
      return { label: 'Tarde', className: 'is-already' }
    }
    if (status === 'ABSENT') {
      return { label: 'Ausente', className: 'is-neutral' }
    }
    if (status === 'registered') {
      return { label: 'Registrado', className: 'is-registered' }
    }
    if (status === 'already_marked') {
      return { label: 'Ya registrado', className: 'is-already' }
    }
    return { label: status || 'Sin estado', className: 'is-neutral' }
  }

  const pickFirstString = (...values) => {
    for (const value of values) {
      if (typeof value === 'string' && value.trim()) {
        return value.trim()
      }
    }
    return ''
  }

  const normalizeStudentIdentity = (item) => {
    // Tomar datos directamente del backend sin intercambio
    const ciValue = pickFirstString(item?.ci, item?.student_ci, item?.student?.ci, item?.CI)
    const nameValue = pickFirstString(item?.full_name, item?.student_name, item?.name, item?.student?.full_name, item?.NOMBRE)
    const codeValue = pickFirstString(item?.student_code, item?.code, item?.codigo, item?.student?.student_code, item?.CODIGO)

    return {
      ...item,
      ci: ciValue,
      full_name: nameValue,
      student_code: codeValue,
    }
  }

  const normalizeAttendanceIdentity = (item) => {
    // Tomar datos directamente del backend sin intercambio
    const ciValue = pickFirstString(item?.ci, item?.student_ci, item?.student?.ci, item?.CI)
    const nameValue = pickFirstString(item?.student_name, item?.full_name, item?.name, item?.student?.full_name, item?.NOMBRE)

    return {
      ...item,
      ci: ciValue,
      student_name: nameValue,
    }
  }

  const getAttendanceEventKey = (logItem) => {
    // Si hay evento con ID, usarlo; si no, usar curso-fecha
    if (logItem.event && logItem.event.id) {
      return `event-${logItem.event.id}`
    }
    return `${logItem.course || 'unknown'}-${logItem.date || 'unknown'}`
  }

  const loadStudents = async () => {
    setLoadingStudents(true)
    try {
      const res = await fetch(`${API_BASE}/students/`)
      const data = await res.json()
      if (Array.isArray(data)) {
        const normalized = data.map((student) => normalizeStudentIdentity(student))
        console.log('Students loaded:', normalized.length)
        setStudents(normalized)
      }
    } catch {
      setStudents([])
    } finally {
      setLoadingStudents(false)
    }
  }

  const authFetch = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    }
    if (authToken) {
      headers.Authorization = `Token ${authToken}`
    }

    const res = await fetch(url, { ...options, headers })
    const contentType = res.headers.get('content-type') || ''
    let data = null

    if (res.status !== 204 && contentType.includes('application/json')) {
      data = await res.json()
    } else if (res.status !== 204) {
      const rawText = await res.text()
      data = rawText ? { detail: rawText } : {}
    }

    if (!res.ok) {
      throw new Error((data && (data.detail || JSON.stringify(data))) || `Error ${res.status}`)
    }
    return data
  }

  const loadProfessors = async () => {
    const canViewProfessors = Boolean(authUser?.is_staff || authUser?.role === 'ADMIN')
    if (!authToken || !canViewProfessors) {
      setProfessors([])
      return
    }

    setLoadingProfessors(true)
    try {
      const data = await authFetch(`${API_BASE}/professors/`, { method: 'GET' })
      if (Array.isArray(data)) {
        setProfessors(data)
      }
    } catch (error) {
      setAuthMessage(error.message)
    } finally {
      setLoadingProfessors(false)
    }
  }

  const loadMyCourses = async () => {
    if (!authToken) {
      return
    }
    setLoadingMyCourses(true)
    try {
      const data = await authFetch(`${API_BASE}/professor/my-courses/`, { method: 'GET' })
      if (Array.isArray(data)) {
        setMyCourses(data)
        const savedCourseId = localStorage.getItem(getCourseStorageKey()) || ''
        const hasSavedCourse = data.some((course) => String(course.id) === String(savedCourseId))
        const hasActiveCourse = data.some((course) => String(course.id) === String(activeCourseId))
        if (data.length === 0) {
          setActiveCourseId('')
        } else if (hasSavedCourse && !hasActiveCourse) {
          setActiveCourseId(String(savedCourseId))
        } else if (!hasActiveCourse) {
          setActiveCourseId(String(data[0].id))
        }
      }
    } catch (error) {
      setScanSeverity('error')
      setScanMessage(`Error al cargar cursos: ${error.message}`)
    } finally {
      setLoadingMyCourses(false)
    }
  }

  const loadShifts = async () => {
    setLoadingShifts(true)
    setShiftMessage('')
    try {
      const data = await authFetch(`${API_BASE}/shift-configs/`, { method: 'GET' })
      if (Array.isArray(data)) {
        setShifts(data)
        organizePeriodsByShiftType(data)
        if (data.length === 0) {
          setShiftMessage('No hay horarios configurados. Crea los turnos Mañana y Tarde.')
        }
      }
    } catch (error) {
      setShiftMessage(`Error al cargar horarios: ${error.message}`)
      setShifts([])
    } finally {
      setLoadingShifts(false)
    }
  }

  const organizePeriodsByShiftType = (shiftsData) => {
    const morningShifts = []
    const afternoonShifts = []

    shiftsData.forEach(shift => {
      const shiftType = String(shift.shift_type).toUpperCase()
      if (shiftType.includes('MANANA') || shiftType === 'MORNING') {
        morningShifts.push(shift)
      } else if (shiftType.includes('TARDE') || shiftType === 'AFTERNOON') {
        afternoonShifts.push(shift)
      }
    })

    const sortByTime = (a, b) => {
      if (a.start_time && b.start_time) {
        return a.start_time.localeCompare(b.start_time)
      }
      return 0
    }
    
    morningShifts.sort(sortByTime)
    afternoonShifts.sort(sortByTime)

    setAvailablePeriodsByShift({
      morning: morningShifts,
      afternoon: afternoonShifts,
      period: []
    })
  }

  const handleShiftTypeChange = (shiftType) => {
    setActiveShiftType(shiftType)
    setActivePeriodId('')
    setActiveShiftId('')
  }

  const handlePeriodChange = (periodId) => {
    setActivePeriodId(String(periodId))
    setActiveShiftId(String(periodId))
  }

  const getPeriodsForCurrentShiftType = () => {
    if (activeShiftType === 'morning') return availablePeriodsByShift.morning || []
    if (activeShiftType === 'afternoon') return availablePeriodsByShift.afternoon || []
    if (activeShiftType === 'period') return availablePeriodsByShift.period || []
    return []
  }

  const createShift = async (event) => {
    event.preventDefault()
    setShiftMessage('')
    try {
      await authFetch(`${API_BASE}/shift-configs/`, {
        method: 'POST',
        body: JSON.stringify(shiftForm),
      })
      setShiftMessage('✅ Horario creado exitosamente')
      setShiftForm({
        shift_type: '',
        start_time: '08:00',
        tolerance_minutes: 10,
        late_minutes: 20,
        is_active: true,
      })
      loadShifts()
    } catch (error) {
      setShiftMessage(`❌ Error al crear horario: ${error.message}`)
    }
  }

  const startEditShift = (shift) => {
    setEditingShift(shift)
    setShiftForm({
      shift_type: shift.shift_type,
      start_time: shift.start_time,
      tolerance_minutes: shift.tolerance_minutes,
      late_minutes: shift.late_minutes,
      is_active: shift.is_active,
    })
    setShiftMessage('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEditShift = () => {
    setEditingShift(null)
    setShiftForm({
      shift_type: '',
      start_time: '08:00',
      tolerance_minutes: 10,
      late_minutes: 20,
      is_active: true,
    })
    setShiftMessage('')
  }

  const updateShift = async (event) => {
    event.preventDefault()
    if (!editingShift) return
    
    setShiftMessage('')
    try {
      await authFetch(`${API_BASE}/shift-configs/${editingShift.id}/`, {
        method: 'PUT',
        body: JSON.stringify(shiftForm),
      })
      setShiftMessage('✅ Horario actualizado exitosamente')
      cancelEditShift()
      loadShifts()
    } catch (error) {
      setShiftMessage(`❌ Error al actualizar horario: ${error.message}`)
    }
  }

  const confirmDeleteShift = (shift) => {
    setModalDeleteShift({ open: true, shift })
  }

  const handleModalDeleteConfirm = () => {
    if (modalDeleteShift.shift) {
      deleteShift(modalDeleteShift.shift.id)
      setModalDeleteShift({ open: false, shift: null })
    }
  }

  const handleModalDeleteCancel = () => {
    setModalDeleteShift({ open: false, shift: null })
  }

  const deleteShift = async (shiftId) => {
    setShiftMessage('')
    try {
      await authFetch(`${API_BASE}/shift-configs/${shiftId}/`, {
        method: 'DELETE',
      })
      setShiftMessage('✅ Horario eliminado exitosamente')
      loadShifts()
    } catch (error) {
      setShiftMessage(`❌ Error al eliminar horario: ${error.message}`)
    }
  }

  const loadProfessorStudents = async (courseIdParam) => {
    if (!authToken) {
      return
    }

    const courseIdToUse = courseIdParam || activeCourseId
    if (!courseIdToUse) {
      setProfCourseStudents([])
      return
    }

    setLoadingProfCourseStudents(true)
    try {
      const data = await authFetch(`${API_BASE}/professor/students/?course_id=${courseIdToUse}`, {
        method: 'GET',
      })
      
      console.log('Professor students loaded:', data ? data.length : 0)
      
      // Usar datos directos del backend
      setProfCourseStudents(Array.isArray(data) ? data : [])
    } catch (error) {
      setProfStudentMessage(`Error al cargar estudiantes: ${error.message}`)
      setProfCourseStudents([])
    } finally {
      setLoadingProfCourseStudents(false)
    }
  }

  const loadTotalStudents = async () => {
    if (!authToken || !isProfessorRole) {
      return
    }

    try {
      const data = await authFetch(`${API_BASE}/professor/students/`, {
        method: 'GET',
      })
      
      if (Array.isArray(data)) {
        // Contar estudiantes únicos por student_id
        const uniqueStudents = new Set(data.map(enrollment => enrollment.student_id))
        setTotalStudents(uniqueStudents.size)
      }
    } catch (error) {
      console.error('Error loading total students:', error)
      setTotalStudents(0)
    }
  }

  const generateCredentials = async (courseId) => {
    if (!authToken || !courseId) {
      alert('No hay curso seleccionado')
      return
    }

    setGeneratingCredentials(true)
    
    try {
      const response = await fetch(`${API_BASE}/credentials/generate/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${authToken}`
        },
        body: JSON.stringify({ course_id: courseId })
      })

      if (!response.ok) {
        throw new Error('Error al generar credenciales')
      }

      // Descargar PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `credenciales_${activeCourseLabel || 'curso'}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setGeneratingCredentials(false)
      setShowCredentialsModal(true)
    } catch (error) {
      setGeneratingCredentials(false)
      alert(`Error al generar credenciales: ${error.message}`)
    }
  }

  const createMyEvent = async (event) => {
    event.preventDefault()
    if (!activeCourseId) {
      setAttendanceMessage('Por favor selecciona un curso')
      return
    }
    try {
      const payload = {
        course_id: Number(activeCourseId),
        title: eventForm.title,
        date: eventForm.date,
        start_time: eventForm.start_time,
        present_until: eventForm.present_until,
        late_until: eventForm.late_until,
      }
      await authFetch(`${API_BASE}/professor/my-events/`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setAttendanceMessage('✅ Evento creado exitosamente')
      setEventForm({ title: '', date: '', start_time: '', present_until: '', late_until: '' })
      setTimeout(() => setAttendanceMessage(''), 3000)
      loadMyEvents()
    } catch (error) {
      setAttendanceMessage(`❌ Error: ${error.message}`)
    }
  }

  const loadMyAttendance = async () => {
    if (!authToken || !isProfessorRole) {
      return
    }

    try {
      const data = await authFetch(`${API_BASE}/attendance/mine/`, { method: 'GET' })
      if (!Array.isArray(data)) {
        setScanLogs([])
        return
      }
      
      const normalized = data.map((item) => {
        const normalizedItem = normalizeAttendanceIdentity(item)
        return {
          id: `att-${normalizedItem.id}`,
          attendanceId: normalizedItem.id,
          studentCode: normalizedItem.student_code,
          ci: normalizedItem.ci,
          name: normalizedItem.student_name,
          course: normalizedItem.course_name,
          eventTitle: normalizedItem.course_name,
          shift: normalizedItem.shift,
          event: normalizedItem.event,
          date: normalizedItem.date,
          status: normalizedItem.status || 'PRESENT',
          registeredAt: normalizedItem.registered_at,
          scannedAt: normalizedItem.scanned_at,
        }
      })
      console.log('Attendance loaded:', normalized.length)
      setScanLogs(normalized)
    } catch {
      setScanLogs([])
    }
  }

  const loadMyEvents = async () => {
    if (!authToken || !isProfessorRole) {
      return
    }
    try {
      const data = await authFetch(`${API_BASE}/professor/my-events/`, { method: 'GET' })
      if (Array.isArray(data)) {
        setMyEvents(data)
        console.log('Events loaded:', data.length)
      } else {
        setMyEvents([])
      }
    } catch {
      setMyEvents([])
    }
  }

  const loadDailyReport = async (date = '', courseId = 'ALL') => {
    if (!authToken || !isProfessorRole) {
      return
    }
    setLoadingDailyReport(true)
    setDailyReportMessage('')
    try {
      const params = new URLSearchParams()
      if (date) params.append('date', date)
      if (courseId && courseId !== 'ALL') params.append('course_id', courseId)
      const query = params.toString() ? `?${params.toString()}` : ''
      const url = `${API_BASE}/professor/daily-report/${query}`
      const data = await authFetch(url, { method: 'GET' })
      setDailyReport(data)
      console.log('Daily report loaded:', data)
    } catch (error) {
      setDailyReportMessage(`Error al cargar reporte: ${error.message}`)
      setDailyReport(null)
    } finally {
      setLoadingDailyReport(false)
    }
  }

  const exportReportToPDF = async () => {
    if (!dailyReport) return

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    // Colores minimalistas
    const grisOscuro = [60, 60, 60]
    const grisClaro = [100, 100, 100]
    const fondoAlterno = [248, 248, 248]

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 15
    let yPosition = margin

    // Obtener nombre del curso filtrado
    const cursoFiltrado = reportCourseFilter !== 'ALL' 
      ? myCourses.find(c => String(c.id) === String(reportCourseFilter))
      : null
    const cursoTexto = cursoFiltrado ? `${cursoFiltrado.name} - ${cursoFiltrado.parallel}` : 'Todos los cursos'

    // Cargar logo del colegio
    try {
      const logoImg = new Image()
      logoImg.crossOrigin = 'anonymous'
      await new Promise((resolve, reject) => {
        logoImg.onload = resolve
        logoImg.onerror = reject
        logoImg.src = '/logo_colegio.jpg'
      })
      
      // Logo a la izquierda
      const logoSize = 25
      doc.addImage(logoImg, 'JPEG', margin, yPosition, logoSize, logoSize)
      
      // Título a la derecha del logo
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.setTextColor(...grisOscuro)
      doc.text('REPORTE DIARIO DE ASISTENCIA', margin + logoSize + 8, yPosition + 8)
      
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...grisClaro)
      doc.text(schoolName, margin + logoSize + 8, yPosition + 15)
      
      yPosition += 32
    } catch (e) {
      // Si no carga el logo, encabezado simple
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.setTextColor(...grisOscuro)
      doc.text('REPORTE DIARIO DE ASISTENCIA', margin, yPosition + 5)
      
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...grisClaro)
      doc.text(schoolName, margin, yPosition + 12)
      
      yPosition += 20
    }

    // Línea separadora
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.5)
    doc.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 8

    // Información del reporte
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...grisOscuro)
    doc.text(`Profesor: ${dailyReport.professor_name}`, margin, yPosition)
    doc.text(`Fecha: ${new Date(dailyReport.date + 'T12:00:00').toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth / 2, yPosition)
    yPosition += 6
    doc.text(`Curso: ${cursoTexto}`, margin, yPosition)
    yPosition += 10

    // Estadísticas generales
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...grisOscuro)
    doc.text('ESTADÍSTICAS GENERALES', margin, yPosition)
    yPosition += 7

    const statsData = [
      ['MÉTRICA', 'CANTIDAD', 'PORCENTAJE'],
      ['Total Inscritos', String(dailyReport.total_enrolled_all_events), '-'],
      ['Presentes', String(dailyReport.total_present_all_events), Math.round((dailyReport.total_present_all_events / (dailyReport.total_enrolled_all_events || 1) * 100)) + '%'],
      ['Tardíos', String(dailyReport.total_late_all_events), Math.round((dailyReport.total_late_all_events / (dailyReport.total_enrolled_all_events || 1) * 100)) + '%'],
      ['Ausentes', String(dailyReport.total_absent_all_events), Math.round((dailyReport.total_absent_all_events / (dailyReport.total_enrolled_all_events || 1) * 100)) + '%'],
    ]

    autoTable(doc, {
      head: [statsData[0]],
      body: statsData.slice(1),
      startY: yPosition,
      margin: { left: margin, right: margin },
      theme: 'striped',
      headStyles: { fillColor: [80, 80, 80], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { textColor: 40, fontSize: 9 },
      alternateRowStyles: { fillColor: fondoAlterno },
      styles: { cellPadding: 3 },
    })

    yPosition = (doc.lastAutoTable?.finalY || yPosition) + 10

    // Eventos
    if (dailyReport.events.length > 0) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(...grisOscuro)
      doc.text(`DETALLE POR EVENTO (${dailyReport.events.length} evento${dailyReport.events.length !== 1 ? 's' : ''})`, margin, yPosition)
      yPosition += 8

      dailyReport.events.forEach((event, idx) => {
        // Agregar nueva página si es necesario
        if (yPosition > pageHeight - 50) {
          doc.addPage()
          // Mini encabezado simple en páginas siguientes
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(9)
          doc.setTextColor(100, 100, 100)
          doc.text(`${schoolName} - Reporte de Asistencia - ${cursoTexto}`, margin, 10)
          doc.setDrawColor(200, 200, 200)
          doc.line(margin, 13, pageWidth - margin, 13)
          yPosition = 20
        }

        // Título del evento
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(60, 60, 60)
        doc.text(`${idx + 1}. ${event.title}`, margin, yPosition)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(100, 100, 100)
        doc.text(`${event.course_name} - Paralelo ${event.course_parallel} | Horario: ${event.start_time} | Presente hasta: ${event.present_until} | Tarde hasta: ${event.late_until}`, margin, yPosition + 5)
        
        yPosition += 10

        // Tabla de estadísticas del evento
        const eventStats = [
          ['Inscritos', 'Presentes', 'Tardíos', 'Ausentes', 'Escaneados'],
          [String(event.total_enrolled), String(event.present_count), String(event.late_count), String(event.absent_count), String(event.scanned_count)],
        ]

        autoTable(doc, {
          head: [eventStats[0]],
          body: [eventStats[1]],
          startY: yPosition,
          margin: { left: margin, right: margin },
          theme: 'grid',
          headStyles: { fillColor: [80, 80, 80], textColor: 255, fontStyle: 'bold', fontSize: 8, halign: 'center' },
          bodyStyles: { fontSize: 8, textColor: 40, halign: 'center' },
          styles: { cellPadding: 2 },
        })

        yPosition = (doc.lastAutoTable?.finalY || yPosition) + 8
      })
    }

    // Pie de página simple
    const totalPages = doc.internal.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setDrawColor(200, 200, 200)
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(120, 120, 120)
      doc.text(`Página ${i} de ${totalPages}`, margin, pageHeight - 6)
      doc.text(`Generado: ${new Date().toLocaleString('es-BO')}`, pageWidth - margin, pageHeight - 6, { align: 'right' })
    }

    doc.save(`Reporte_Asistencia_${dailyReport.date}.pdf`)
  }

  const exportReportToExcel = () => {
    if (!dailyReport) return

    // Obtener nombre del curso filtrado
    const cursoFiltrado = reportCourseFilter !== 'ALL' 
      ? myCourses.find(c => String(c.id) === String(reportCourseFilter))
      : null
    const cursoTexto = cursoFiltrado ? `${cursoFiltrado.name} - ${cursoFiltrado.parallel}` : 'Todos los cursos'

    // Crear workbook
    const wb = XLSX.utils.book_new()

    // === HOJA 1: RESUMEN ===
    const resumenData = [
      ['REPORTE DIARIO DE ASISTENCIA'],
      [],
      ['Institución:', schoolName],
      ['Profesor:', dailyReport.professor_name],
      ['Fecha:', new Date(dailyReport.date + 'T12:00:00').toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })],
      ['Curso:', cursoTexto],
      ['Total de Eventos:', dailyReport.total_events],
      [],
      ['ESTADÍSTICAS GENERALES'],
      ['Métrica', 'Cantidad', 'Porcentaje'],
      ['Total Inscritos', dailyReport.total_enrolled_all_events, '-'],
      ['Presentes', dailyReport.total_present_all_events, `${Math.round((dailyReport.total_present_all_events / (dailyReport.total_enrolled_all_events || 1)) * 100)}%`],
      ['Tardíos', dailyReport.total_late_all_events, `${Math.round((dailyReport.total_late_all_events / (dailyReport.total_enrolled_all_events || 1)) * 100)}%`],
      ['Ausentes', dailyReport.total_absent_all_events, `${Math.round((dailyReport.total_absent_all_events / (dailyReport.total_enrolled_all_events || 1)) * 100)}%`],
      [],
      ['RESUMEN POR EVENTO'],
      ['#', 'Evento', 'Curso', 'Paralelo', 'Horario', 'Inscritos', 'Presentes', 'Tardíos', 'Ausentes', 'Escaneados', '% Asistencia']
    ]

    dailyReport.events.forEach((event, idx) => {
      const pctAsist = event.total_enrolled > 0 ? Math.round(((event.present_count + event.late_count) / event.total_enrolled) * 100) : 0
      resumenData.push([
        idx + 1,
        event.title,
        event.course_name,
        event.course_parallel,
        event.start_time,
        event.total_enrolled,
        event.present_count,
        event.late_count,
        event.absent_count,
        event.scanned_count,
        `${pctAsist}%`
      ])
    })

    const wsResumen = XLSX.utils.aoa_to_sheet(resumenData)
    
    // Configurar anchos de columna
    wsResumen['!cols'] = [
      { wch: 5 },   // #
      { wch: 30 },  // Evento
      { wch: 25 },  // Curso
      { wch: 12 },  // Paralelo
      { wch: 12 },  // Horario
      { wch: 12 },  // Inscritos
      { wch: 12 },  // Presentes
      { wch: 12 },  // Tardíos
      { wch: 12 },  // Ausentes
      { wch: 12 },  // Escaneados
      { wch: 14 }   // % Asistencia
    ]

    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen')

    // === HOJAS POR CADA EVENTO ===
    dailyReport.events.forEach((event, idx) => {
      const eventData = [
        [`EVENTO ${idx + 1}: ${event.title}`],
        [],
        ['Curso:', event.course_name],
        ['Paralelo:', event.course_parallel],
        ['Horario de Inicio:', event.start_time],
        ['Presente Hasta:', event.present_until],
        ['Tarde Hasta:', event.late_until],
        ['Estado:', event.is_active ? 'Activo' : 'Cerrado'],
        [],
        ['ESTADÍSTICAS'],
        ['Inscritos', 'Presentes', 'Tardíos', 'Ausentes', 'Escaneados'],
        [event.total_enrolled, event.present_count, event.late_count, event.absent_count, event.scanned_count],
        [],
        ['LISTA DE ASISTENCIA'],
        ['#', 'Estudiante', 'Código', 'C.I.', 'Estado', 'Hora de Escaneo']
      ]

      event.attendance_records.forEach((record, recIdx) => {
        const scanTime = record.scanned_at ? new Date(record.scanned_at).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-'
        const estadoTexto = record.status === 'PRESENT' ? 'Presente' : record.status === 'LATE' ? 'Tardío' : record.status === 'ABSENT' ? 'Ausente' : record.status
        eventData.push([recIdx + 1, record.student_name, record.student_code, record.ci, estadoTexto, scanTime])
      })

      const wsEvent = XLSX.utils.aoa_to_sheet(eventData)
      wsEvent['!cols'] = [
        { wch: 5 },   // #
        { wch: 35 },  // Estudiante
        { wch: 18 },  // Código
        { wch: 12 },  // C.I.
        { wch: 12 },  // Estado
        { wch: 18 }   // Hora de Escaneo
      ]

      // Nombre de hoja limitado a 31 caracteres (límite de Excel)
      const sheetName = `${idx + 1}. ${event.title}`.substring(0, 31).replace(/[\[\]\*\?\/\\:]/g, '')
      XLSX.utils.book_append_sheet(wb, wsEvent, sheetName)
    })

    // Descargar archivo Excel
    XLSX.writeFile(wb, `Reporte_Asistencia_${dailyReport.date}.xlsx`)
  }

  const loadAdminActivity = async () => {
    if (!authToken || isProfessorRole) {
      setAdminActivity([])
      return
    }

    setLoadingAdminActivity(true)
    try {
      const params = new URLSearchParams()
      if (adminCourseFilter) {
        params.append('course_id', adminCourseFilter)
      }
      if (adminDateFilter) {
        params.append('date', adminDateFilter)
      }
      const query = params.toString() ? `?${params.toString()}` : ''
      const data = await authFetch(`${API_BASE}/attendance/activity/${query}`, { method: 'GET' })
      setAdminActivity(Array.isArray(data) ? data.map((item) => normalizeAttendanceIdentity(item)) : [])
    } catch (error) {
      setAttendanceMessage(`No se pudo cargar actividad: ${error.message}`)
      setAdminActivity([])
    } finally {
      setLoadingAdminActivity(false)
    }
  }

  useEffect(() => {
    fetch(`${API_BASE}/school-info/`)
      .then((res) => res.json())
      .then((data) => {
        if (data.school_name) {
          setSchoolName(data.school_name)
        }

        const parsedServerNow = data.server_datetime_iso ? new Date(data.server_datetime_iso) : null
        if (parsedServerNow && !Number.isNaN(parsedServerNow.getTime())) {
          setServerClockOffsetMs(parsedServerNow.getTime() - Date.now())
        } else {
          setServerClockOffsetMs(0)
        }

        setServerClockInfo({
          time: data.server_time || '',
          date: data.server_date || '',
          timezone: data.server_timezone || '',
        })
      })
      .catch(() => {
        setSchoolName('NACIONAL AYACUCHO')
        setServerClockOffsetMs(0)
        setServerClockInfo({ time: '', date: '', timezone: '' })
      })

    loadStudents()
  }, [])

  const currentPath = location.pathname.toLowerCase()
  const isLoginRoute = currentPath === '/login'

  useEffect(() => {
    const selectedMenu = routeToMenu[currentPath]
    if (selectedMenu) {
      setActiveMenu(selectedMenu)
      return
    }

    if (currentPath === '/') {
      navigate('/login', { replace: true })
    }
  }, [currentPath])

  const isDashboardMenu = activeMenu === 'Dashboard'
  const isStudentsMenu = activeMenu === 'Estudiantes'
  const isProfessorsMenu = activeMenu === 'Profesores'
  const isScannerMenu = activeMenu === 'QR y Escaner'
  const isCoursesMenu = activeMenu === 'Cursos'
  const isSchedulesMenu = activeMenu === 'Horarios'
  const isEventsMenu = activeMenu === 'Eventos'
  const isAttendanceMenu = activeMenu === 'Asistencia'
  const isReportsMenu = activeMenu === 'Reportes'
  const isProfessorRole = authUser?.role === 'PROFESSOR'
  const activeCourseLabel = myCourses.find((course) => String(course.id) === String(activeCourseId))?.label || ''
  // Filtrar periodos/turnos disponibles para el curso seleccionado
  const availableShifts = shifts.filter((shift) => String(shift.course_id) === String(activeCourseId) || !shift.course_id)
  const activeShift = availableShifts.find((shift) => String(shift.id) === String(activeShiftId))
  const requiresCourseContext = isProfessorRole && activeMenu !== 'Cursos'
  const visibleMenus = isProfessorRole ? professorMenus : menus
  const totalCreatedUsers = students.length + professors.length

  const getCourseStorageKey = () => {
    const userId = authUser?.id || 'anon'
    return `lastActiveCourse:${userId}`
  }

  const applyCourseSelection = (nextId, options = {}) => {
    const { resetDraft = true } = options

    setActiveCourseId(nextId)
    setActiveShiftType('')
    setActivePeriodId('')
    setActiveShiftId('')

    if (resetDraft) {
      setProfStudentForm({ ci: '', full_name: '' })
      setProfStudentCard(null)
      setProfStudentMessage('')
    }

    // Cargar estudiantes del nuevo curso seleccionado
    if (nextId) {
      loadProfessorStudents(nextId)
    } else {
      setProfCourseStudents([])
    }
  }

  const closeCourseSwitchModal = () => {
    setPendingCourseSwitch(null)
  }

  const confirmCourseSwitch = (options = {}) => {
    if (!pendingCourseSwitch) {
      return
    }

    applyCourseSelection(pendingCourseSwitch.nextId, options)
    setPendingCourseSwitch(null)
  }

  const selectActiveCourse = (nextCourseId, options = {}) => {
    const { confirmChange = true } = options
    const nextId = String(nextCourseId || '')
    const currentId = String(activeCourseId || '')

    if (nextId === currentId) {
      return
    }

    const hasStudentDraft = Boolean(
      profStudentForm.ci.trim() ||
      profStudentForm.full_name.trim() ||
      profStudentCard,
    )

    if (confirmChange && currentId && nextId && hasStudentDraft) {
      const currentLabel = myCourses.find((course) => String(course.id) === currentId)?.label || 'curso actual'
      const nextLabel = myCourses.find((course) => String(course.id) === nextId)?.label || 'curso seleccionado'

      setPendingCourseSwitch({
        nextId,
        currentLabel,
        nextLabel,
      })
      return
    }

    applyCourseSelection(nextId, { resetDraft: confirmChange })
  }

  const adminAttendanceTotals = adminActivity.reduce(
    (acc, item) => {
      const normalizedStatus = String(item.status || '').toUpperCase()
      if (normalizedStatus === 'PRESENT' || normalizedStatus === 'REGISTERED') {
        acc.present += 1
      } else if (normalizedStatus === 'LATE' || normalizedStatus === 'ALREADY_MARKED') {
        acc.late += 1
      } else {
        acc.other += 1
      }
      return acc
    },
    { present: 0, late: 0, other: 0 },
  )

  const adminActivityByEvent = Object.values(
    adminActivity.reduce((acc, item) => {
      const key = `${item.course_name || 'Sin curso'}`
      if (!acc[key]) {
        acc[key] = {
          key,
          title: item.course_name || 'Sin datos',
          course: item.course_name || '-',
          total: 0,
          present: 0,
          late: 0,
        }
      }
      acc[key].total += 1
      const normalizedStatus = String(item.status || '').toUpperCase()
      if (normalizedStatus === 'PRESENT' || normalizedStatus === 'REGISTERED') {
        acc[key].present += 1
      } else if (normalizedStatus === 'LATE' || normalizedStatus === 'ALREADY_MARKED') {
        acc[key].late += 1
      } else {
        acc[key].other += 1
      }
      return acc
    }, {}),
  ).sort((a, b) => b.total - a.total)

  // Eliminado agrupamiento por evento para acordeón, solo se agrupa por curso y fecha

  // Eliminado agrupamiento por evento en días, solo se agrupa por fecha y curso


  // Agrupar actividad por día para dashboard
  const adminActivityByDay = Object.values(
    adminActivity.reduce((acc, item) => {
      const key = item.date || 'Sin fecha'
      if (!acc[key]) {
        acc[key] = {
          key,
          date: item.date || '-',
          total: 0,
          present: 0,
          late: 0,
          other: 0,
        }
      }
      acc[key].total += 1
      const normalizedStatus = String(item.status || '').toUpperCase()
      if (normalizedStatus === 'PRESENT' || normalizedStatus === 'REGISTERED') {
        acc[key].present += 1
      } else if (normalizedStatus === 'LATE' || normalizedStatus === 'ALREADY_MARKED') {
        acc[key].late += 1
      } else {
        acc[key].other += 1
      }
      return acc
    }, {})
  ).sort((a, b) => b.total - a.total)

  // Top 3 días para dashboard
  const adminActivityTopDays = adminActivityByDay.slice(0, 3)

  const adminReportByDay = Object.values(
    adminActivity.reduce((acc, item) => {
      const dayKey = item.date || 'Sin fecha'
      if (!acc[dayKey]) {
        acc[dayKey] = {
          dayKey,
          date: item.date || '-',
          total: 0,
          present: 0,
          late: 0,
          other: 0,
          events: {},
        }
      }

      const eventKey = `${item.course_name || 'Sin curso'}`
      if (!acc[dayKey].events[eventKey]) {
        acc[dayKey].events[eventKey] = {
          key: eventKey,
          title: item.course_name || 'Sin datos',
          course: item.course_name || '-',
          total: 0,
          present: 0,
          late: 0,
          other: 0,
        }
      }

      acc[dayKey].total += 1
      acc[dayKey].events[eventKey].total += 1

      const normalizedStatus = String(item.status || '').toUpperCase()
      if (normalizedStatus === 'PRESENT' || normalizedStatus === 'REGISTERED') {
        acc[dayKey].present += 1
        acc[dayKey].events[eventKey].present += 1
      } else if (normalizedStatus === 'LATE' || normalizedStatus === 'ALREADY_MARKED') {
        acc[dayKey].late += 1
        acc[dayKey].events[eventKey].late += 1
      } else {
        acc[dayKey].other += 1
        acc[dayKey].events[eventKey].other += 1
      }

      return acc
    }, {}),
  )
    .map((dayGroup) => ({
      ...dayGroup,
      events: Object.values(dayGroup.events).sort((a, b) => b.total - a.total || a.title.localeCompare(b.title, 'es')), 
    }))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))

  const adminReportByDayRows = adminReportByDay.flatMap((dayGroup) =>
    dayGroup.events.map((eventItem) => ({
      day: dayGroup.date,
      title: eventItem.title,
      course: eventItem.course,
      total: eventItem.total,
      present: eventItem.present,
      late: eventItem.late,
      other: eventItem.other,
    })),
  )

  const adminActivitySortedForReport = [...adminActivity].sort((a, b) => {
    const dateCompare = String(b.date || '').localeCompare(String(a.date || ''))
    if (dateCompare !== 0) {
      return dateCompare
    }

    const courseCompare = String(a.course_name || '').localeCompare(String(b.course_name || ''), 'es')
    if (courseCompare !== 0) {
      return courseCompare
    }

    return String(b.registered_at || '').localeCompare(String(a.registered_at || ''))
  })

  const adminTopEvents = adminActivityByEvent.slice(0, 6)
  const adminRecentActivity = adminActivity.slice(0, 10)
  const adminTotalRecords = adminAttendanceTotals.present + adminAttendanceTotals.late + adminAttendanceTotals.other
  const presentPercent = adminTotalRecords > 0 ? Math.round((adminAttendanceTotals.present / adminTotalRecords) * 100) : 0
  const latePercent = adminTotalRecords > 0 ? Math.round((adminAttendanceTotals.late / adminTotalRecords) * 100) : 0
  const otherPercent = Math.max(0, 100 - presentPercent - latePercent)
  const adminAlerts = [
    students.length === 0
      ? { key: 'no-students', title: 'Sin estudiantes', detail: 'Aun no se registraron estudiantes en el sistema.' }
      : null,
    professors.length === 0
      ? { key: 'no-professors', title: 'Sin docentes', detail: 'No hay docentes creados para asignar cursos y eventos.' }
      : null,
    adminActivityByEvent.length === 0
      ? { key: 'no-activity', title: 'Sin actividad', detail: 'No se encontraron asistencias para los filtros actuales.' }
      : null,
    latePercent >= 25
      ? { key: 'late-high', title: 'Tardanzas elevadas', detail: `El ${latePercent}% de registros actuales esta en estado tarde.` }
      : null,
  ].filter(Boolean)

  const filteredAttendanceLogs = scanLogs.filter((logItem) => {
    // Filtro por curso
    if (attendanceCourseFilter !== 'ALL' && logItem.course !== attendanceCourseFilter) {
      return false
    }
    // Filtro por evento
    if (attendanceEventFilter !== 'ALL') {
      const eventKey = getAttendanceEventKey(logItem)
      if (eventKey !== attendanceEventFilter) {
        return false
      }
    }
    // Filtro por estado
    if (attendanceStatusFilter !== 'ALL' && logItem.status !== attendanceStatusFilter) {
      return false
    }
    // Filtro por fecha
    if (attendanceDateFilter && logItem.date !== attendanceDateFilter) {
      return false
    }
    // Filtro por búsqueda
    const search = attendanceSearchTerm.trim().toLowerCase()
    if (search) {
      const searchable = [
        logItem.studentCode,
        logItem.ci,
        logItem.name,
        logItem.course,
        logItem.date,
      ]
        .map((value) => String(value || '').toLowerCase())
        .join(' ')
      if (!searchable.includes(search)) {
        return false
      }
    }
    return true
  })

  const attendanceTotals = filteredAttendanceLogs.reduce(
    (acc, logItem) => {
      const normalizedStatus = String(logItem.status || '').toUpperCase()
      acc.total += 1
      if (normalizedStatus === 'PRESENT') {
        acc.present += 1
      } else if (normalizedStatus === 'LATE') {
        acc.late += 1
      } else {
        acc.absent += 1
      }
      return acc
    },
    { total: 0, present: 0, late: 0, absent: 0 },
  )

  const attendancePresentPercent = attendanceTotals.total > 0
    ? Math.round((attendanceTotals.present / attendanceTotals.total) * 100)
    : 0
  const attendanceLatePercent = attendanceTotals.total > 0
    ? Math.round((attendanceTotals.late / attendanceTotals.total) * 100)
    : 0
  const attendanceAbsentPercent = Math.max(0, 100 - attendancePresentPercent - attendanceLatePercent)

  const attendanceByEvent = Object.values(
    filteredAttendanceLogs.reduce((acc, logItem) => {
      const key = getAttendanceEventKey(logItem)
      if (!acc[key]) {
        // Construir título: si hay evento con título, usarlo; si no, usar curso
        const eventTitle = logItem.event && logItem.event.title ? logItem.event.title : (logItem.course || 'Sin datos')
        const startTime = logItem.event && logItem.event.start_time ? ` - ${logItem.event.start_time.substring(0, 5)}` : ''
        acc[key] = {
          key,
          title: `${eventTitle}${startTime}`,
          eventTitle: eventTitle,
          date: logItem.date || '',
          course: logItem.course || '-',
          total: 0,
          present: 0,
          late: 0,
          absent: 0,
          latest: logItem.registeredAt || '',
          rows: [],
          eventId: logItem.event && logItem.event.id ? logItem.event.id : null,
        }
      }

      acc[key].rows.push(logItem)
      acc[key].total += 1
      const normalizedStatus = String(logItem.status || '').toUpperCase()
      if (normalizedStatus === 'PRESENT') {
        acc[key].present += 1
      } else if (normalizedStatus === 'LATE') {
        acc[key].late += 1
      } else {
        acc[key].absent += 1
      }
      if ((logItem.registeredAt || '') > acc[key].latest) {
        acc[key].latest = logItem.registeredAt || ''
      }
      return acc
    }, {}),
  ).sort((a, b) => (b.latest || '').localeCompare(a.latest || ''))

  // Agrupar asistencias por día -> evento
  const attendanceByDay = Object.values(
    filteredAttendanceLogs.reduce((acc, logItem) => {
      const dayKey = logItem.date || 'Sin fecha'

      if (!acc[dayKey]) {
        acc[dayKey] = {
          dayKey,
          date: logItem.date || '-',
          events: {},
          dayTotal: 0,
          dayPresent: 0,
          dayLate: 0,
          dayAbsent: 0,
        }
      }

      const eventKey = getAttendanceEventKey(logItem)
      if (!acc[dayKey].events[eventKey]) {
        const eventTitle = logItem.event && logItem.event.title ? logItem.event.title : (logItem.course || 'Sin datos')
        const startTime = logItem.event && logItem.event.start_time ? ` - ${logItem.event.start_time.substring(0, 5)}` : ''
        acc[dayKey].events[eventKey] = {
          key: eventKey,
          title: `${eventTitle}${startTime}`,
          eventTitle: eventTitle,
          date: logItem.date || '',
          course: logItem.course || '-',
          total: 0,
          present: 0,
          late: 0,
          absent: 0,
          latest: logItem.registeredAt || '',
          rows: [],
          eventId: logItem.event && logItem.event.id ? logItem.event.id : null,
        }
      }

      const event = acc[dayKey].events[eventKey]
      event.rows.push(logItem)
      event.total += 1
      acc[dayKey].dayTotal += 1

      const normalizedStatus = String(logItem.status || '').toUpperCase()
      if (normalizedStatus === 'PRESENT') {
        event.present += 1
        acc[dayKey].dayPresent += 1
      } else if (normalizedStatus === 'LATE') {
        event.late += 1
        acc[dayKey].dayLate += 1
      } else {
        event.absent += 1
        acc[dayKey].dayAbsent += 1
      }

      if ((logItem.registeredAt || '') > event.latest) {
        event.latest = logItem.registeredAt || ''
      }

      return acc
    }, {}),
  )
    .map((dayGroup) => ({
      ...dayGroup,
      events: Object.values(dayGroup.events).sort((a, b) => (b.latest || '').localeCompare(a.latest || '')),
    }))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))

  const attendanceTopEvents = [...attendanceByEvent]
    .sort((a, b) => b.total - a.total)
    .slice(0, 6)

  const attendanceTimelinePoints = Object.values(
    filteredAttendanceLogs.reduce((acc, logItem) => {
      if (!logItem.registeredAt) {
        return acc
      }

      const parsedDate = new Date(logItem.registeredAt)
      if (Number.isNaN(parsedDate.getTime())) {
        return acc
      }

      const hourBucket = new Date(parsedDate)
      hourBucket.setMinutes(0, 0, 0)
      const key = hourBucket.toISOString()
      if (!acc[key]) {
        acc[key] = {
          key,
          sortKey: hourBucket.getTime(),
          label: hourBucket.toLocaleString('es-BO', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          }),
          total: 0,
          present: 0,
          other: 0,
        }
      }
      acc[key].total += 1
      const normalizedStatus = String(logItem.status || '').toUpperCase()
      if (normalizedStatus === 'PRESENT') {
        acc[key].present += 1
      } else {
        acc[key].other += 1
      }
      return acc
    }, {}),
  )
    .sort((a, b) => a.sortKey - b.sortKey)
    .slice(-10)

  const attendanceTimelineMax = Math.max(1, ...attendanceTimelinePoints.map((point) => point.total))
  const buildTrendPolyline = (getValue) => attendanceTimelinePoints
    .map((point, index, list) => {
      const x = list.length === 1 ? 50 : Math.round((index / (list.length - 1)) * 100)
      const y = Math.max(8, 100 - Math.round((getValue(point) / attendanceTimelineMax) * 92))
      return `${x},${y}`
    })
    .join(' ')

  const attendancePresentTrendPolyline = buildTrendPolyline((point) => point.present)
  const attendanceOtherTrendPolyline = buildTrendPolyline((point) => point.other)

  useEffect(() => {
    if (attendanceEventFilter === 'ALL') {
      return
    }

    const exists = attendanceByEvent.some((option) => option.key === attendanceEventFilter)
    if (!exists) {
      setAttendanceEventFilter('ALL')
    }
  }, [attendanceEventFilter, attendanceByEvent])
  const assignedCoursesPageSize = 5
  const filteredAssignedCourses = assigningProfessor?.assigned_courses?.filter((course) => {
    const search = assignCourseSearchTerm.trim().toLowerCase()
    if (!search) {
      return true
    }
    const label = `${course.name} ${course.parallel} ${course.label}`.toLowerCase()
    return label.includes(search)
  }) || []
  const sortedAssignedCourses = [...filteredAssignedCourses].sort((a, b) => {
    if (assignCourseSortBy === 'name-desc') {
      return b.name.localeCompare(a.name, 'es', { sensitivity: 'base' })
    }
    if (assignCourseSortBy === 'parallel-asc') {
      return a.parallel.localeCompare(b.parallel, 'es', { sensitivity: 'base' })
    }
    if (assignCourseSortBy === 'parallel-desc') {
      return b.parallel.localeCompare(a.parallel, 'es', { sensitivity: 'base' })
    }
    if (assignCourseSortBy === 'recent') {
      return b.id - a.id
    }
    return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
  })
  const assignCourseTotalPages = Math.max(1, Math.ceil(filteredAssignedCourses.length / assignedCoursesPageSize))
  const assignCourseSafePage = Math.min(assignCoursePage, assignCourseTotalPages)
  const paginatedAssignedCourses = sortedAssignedCourses.slice(
    (assignCourseSafePage - 1) * assignedCoursesPageSize,
    assignCourseSafePage * assignedCoursesPageSize,
  )

  const highlightSearchMatch = (text) => {
    const value = String(text || '')
    const search = assignCourseSearchTerm.trim()
    if (!search) {
      return value
    }

    const normalizedValue = value.toLowerCase()
    const normalizedSearch = search.toLowerCase()
    const firstIndex = normalizedValue.indexOf(normalizedSearch)
    if (firstIndex === -1) {
      return value
    }

    const before = value.slice(0, firstIndex)
    const match = value.slice(firstIndex, firstIndex + search.length)
    const after = value.slice(firstIndex + search.length)

    return (
      <>
        {before}
        <mark className="inline-match">{match}</mark>
        {after}
      </>
    )
  }

  const goToMenu = (menuLabel) => {
    const targetPath = menuToRoute[menuLabel]
    if (!targetPath) {
      return
    }
    setActiveMenu(menuLabel)
    navigate(targetPath)
  }

  useEffect(() => {
    if (activeMenu === 'Profesores') {
      loadProfessors()
    }
  }, [activeMenu, authUser, authToken])

  useEffect(() => {
    if (authToken) {
      if (authUser?.is_staff || authUser?.role === 'ADMIN') {
        loadProfessors()
        loadAdminActivity()
      }
      loadMyCourses()
      if (authUser?.role === 'PROFESSOR') {
        loadTotalStudents()
        loadShifts()
        loadMyEvents()
        loadMyAttendance()
      }
    }
  }, [authToken, authUser])

  useEffect(() => {
    if (!isProfessorRole && authToken && (isDashboardMenu || isAttendanceMenu || isReportsMenu)) {
      loadAdminActivity()
    }
    if (!isProfessorRole && authToken && activeMenu === 'Cursos') {
      loadAllShifts()
    }
  }, [
    isProfessorRole,
    authToken,
    isDashboardMenu,
    isAttendanceMenu,
    isReportsMenu,
    activeMenu,
    adminCourseFilter,
    adminDateFilter,
  ])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAssignCourseSearchTerm(assignCourseSearchInput)
    }, 260)

    return () => window.clearTimeout(timer)
  }, [assignCourseSearchInput])

  useEffect(() => {
    if (isScannerMenu && authToken) {
      loadMyCourses()
      
      // Solicitar permiso de cámara automáticamente al entrar a la sección
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
          .then((stream) => {
            // Cerrar el stream después de obtener el permiso
            stream.getTracks().forEach(track => track.stop())
          })
          .catch((error) => {
            // El usuario puede haber rechazado el permiso, pero lo intentaremos de nuevo cuando inicie el scanner
            console.log('Permiso de cámara no concedido al cargar scanner', error)
          })
      }
    }
  }, [isScannerMenu, authToken])

  useEffect(() => {
    if (!authToken || !isProfessorRole) {
      return
    }

    const storageKey = getCourseStorageKey()
    if (!activeCourseId) {
      localStorage.removeItem(storageKey)
      return
    }

    localStorage.setItem(storageKey, String(activeCourseId))
  }, [authToken, isProfessorRole, authUser?.id, activeCourseId])

  useEffect(() => {
    if (authToken && isProfessorRole && (isDashboardMenu || isAttendanceMenu)) {
      loadMyAttendance()
    }
  }, [authToken, isProfessorRole, isDashboardMenu, isAttendanceMenu])

  useEffect(() => {
    if (authToken && isProfessorRole && isReportsMenu) {
      loadDailyReport(dailyReportDate, reportCourseFilter)
    }
  }, [authToken, isProfessorRole, isReportsMenu])

  useEffect(() => {
    if (isProfessorRole && activeCourseId && activeMenu === 'Estudiantes') {
      loadProfessorStudents(activeCourseId)
    }
  }, [isProfessorRole, activeCourseId, activeMenu])

  useEffect(() => {
    if (isSchedulesMenu && authToken && !isProfessorRole) {
      loadShifts()
    }
  }, [isSchedulesMenu, authToken, isProfessorRole])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (currentPath !== '/login' && !authToken) {
      setAuthMessage('Inicia sesion para acceder al sistema.')
      navigate('/login', { replace: true })
    }
    if (currentPath === '/login' && authToken) {
      navigate('/dashboard', { replace: true })
    }
  }, [currentPath, authToken])

  useEffect(() => {
    const adminOnlyRoutes = ['/profesores', '/configuracion']
    if (isProfessorRole && adminOnlyRoutes.includes(currentPath)) {
      navigate('/dashboard', { replace: true })
    }
  }, [isProfessorRole, currentPath])

  const createMyCourse = async (event) => {
    event.preventDefault()
    setProfStudentMessage('')
    try {
      const data = await authFetch(`${API_BASE}/professor/my-courses/`, {
        method: 'POST',
        body: JSON.stringify(newCourseForm),
      })
      setMyCourses((prev) => {
        if (prev.some((course) => course.id === data.id)) {
          return prev
        }
        return [...prev, data]
      })
      setActiveCourseId(String(data.id))
      setNewCourseForm({ name: '', parallel: '' })
      setProfStudentMessage(`Curso listo: ${data.label}`)
    } catch (error) {
      setProfStudentMessage(`Error al crear curso: ${error.message}`)
    }
  }

  const createAdminCourse = async (event) => {
    event.preventDefault()
    if (!adminCourseForm.professor_id) {
      setAdminCourseMessage('Debes seleccionar un profesor para crear el curso.')
      return
    }

    try {
      await authFetch(`${API_BASE}/professor/my-courses/`, {
        method: 'POST',
        body: JSON.stringify({
          name: adminCourseForm.name,
          parallel: adminCourseForm.parallel,
          professor_id: Number(adminCourseForm.professor_id),
        }),
      })
      setAdminCourseMessage('Curso institucional creado correctamente.')
      setAdminCourseForm({ name: '', parallel: '', professor_id: '' })
      loadMyCourses()
      loadProfessors()
    } catch (error) {
      setAdminCourseMessage(`No se pudo crear curso: ${error.message}`)
    }
  }

  const openEditAdminCourse = (course) => {
    setEditingAdminCourse(course)
    setAdminCourseEditForm({
      name: course.name || '',
      parallel: course.parallel || '',
      professor_id: String(course.professor_id || ''),
    })
  }

  const cancelEditAdminCourse = () => {
    setEditingAdminCourse(null)
    setAdminCourseEditForm({ name: '', parallel: '', professor_id: '' })
  }

  const submitEditAdminCourse = async (event) => {
    event.preventDefault()
    if (!editingAdminCourse) {
      return
    }

    try {
      await authFetch(`${API_BASE}/professors/${editingAdminCourse.professor_id}/courses/${editingAdminCourse.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({
          course_name: adminCourseEditForm.name,
          course_parallel: adminCourseEditForm.parallel,
        }),
      })
      setAdminCourseMessage('Curso actualizado correctamente.')
      cancelEditAdminCourse()
      loadMyCourses()
    } catch (error) {
      setAdminCourseMessage(`No se pudo actualizar curso: ${error.message}`)
    }
  }

  const deleteAdminCourse = (course) => {
    setPendingDeleteAdminCourse(course)
  }

  const cancelDeleteAdminCourse = () => {
    setPendingDeleteAdminCourse(null)
  }

  const confirmDeleteAdminCourse = async () => {
    const course = pendingDeleteAdminCourse
    if (!course) {
      return
    }

    try {
      await authFetch(`${API_BASE}/professors/${course.professor_id}/courses/${course.id}/`, {
        method: 'DELETE',
      })
      setAdminCourseMessage('Curso eliminado correctamente.')
      setPendingDeleteAdminCourse(null)
      loadMyCourses()
    } catch (error) {
      setAdminCourseMessage(`No se pudo eliminar curso: ${error.message}`)
    }
  }

  const registerStudentForProfessor = async (event) => {
    event.preventDefault()
    if (!activeCourseId) {
      setProfStudentMessage('Selecciona un curso activo primero.')
      return
    }

    try {
      const data = await authFetch(`${API_BASE}/professor/students/register/`, {
        method: 'POST',
        body: JSON.stringify({
          ...profStudentForm,
          course_id: Number(activeCourseId),
        }),
      })
      setProfStudentCard(data)
      setProfStudentForm({ ci: '', full_name: '' })
      setProfStudentMessage(
        data.created_student
          ? `Estudiante creado: ${data.student.full_name}`
          : `Estudiante vinculado al curso: ${data.student.full_name}`,
      )
      loadProfessorStudents(activeCourseId)
      loadTotalStudents()
    } catch (error) {
      setProfStudentMessage(`Error al registrar estudiante: ${error.message}`)
    }
  }

  const openProfessorStudentQr = (studentItem) => {
    setProfStudentCard({
      student: {
        id: studentItem.student_id,
        ci: studentItem.ci,
        full_name: studentItem.full_name,
        student_code: studentItem.student_code,
      },
      course: {
        id: studentItem.course_id,
        label: studentItem.course_label,
      },
      qr_payload: studentItem.qr_payload,
      created_student: false,
    })
    setProfStudentMessage(`QR listo para ${studentItem.full_name}`)
  }

  const formatDateForApi = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const markManualAttendance = async (studentItem) => {
    try {
      const payload = {
        student_code: studentItem.student_code,
        status: 'PRESENT',
        course_id: Number(activeCourseId),
        date: formatDateForApi(),
      }

      if (activeShiftId) {
        payload.shift_id = Number(activeShiftId)
      }

      await authFetch(`${API_BASE}/attendance/register/`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setProfStudentMessage(`Asistencia marcada para ${studentItem.full_name}`)
      loadMyAttendance()
    } catch (error) {
      setProfStudentMessage(`No se pudo marcar asistencia: ${error.message}`)
    }
  }

  const updateAttendanceStatus = async (attendanceId, status) => {
    try {
      await authFetch(`${API_BASE}/attendance/mine/${attendanceId}/`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      setAttendanceMessage('Registro actualizado correctamente.')
      loadMyAttendance()
    } catch (error) {
      setAttendanceMessage(`No se pudo actualizar: ${error.message}`)
    }
  }

  const deleteAttendanceRecord = async (attendanceId) => {
    try {
      await authFetch(`${API_BASE}/attendance/mine/${attendanceId}/`, {
        method: 'DELETE',
      });
      setAttendanceMessage('Registro eliminado correctamente.');
      loadMyAttendance();
    } catch (error) {
      setAttendanceMessage('No se pudo eliminar: ' + (error?.message || error));
    }
  }

  const fetchImageAsDataUrl = async (imageUrl) => {
    const response = await fetch(imageUrl)
    const blob = await response.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  const downloadAttendancePdf = async () => {
    const logsForPdf = filteredAttendanceLogs
    if (!logsForPdf || logsForPdf.length === 0) {
      setAttendanceMessage('⚠️ No hay asistencias para exportar con los filtros actuales.')
      return
    }

    try {
      console.log('📊 Iniciando generación de PDF con', logsForPdf.length, 'registros')
      
      const doc = new jsPDF('p', 'mm', 'a4')
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const generatedAt = new Date()
      
      const activeCourseLabel =
        myCourses.find((course) => String(course.id) === String(activeCourseId))?.label || 'Todos los cursos'
      const selectedStatusLabel =
        attendanceStatusFilter === 'ALL'
          ? 'Todos los estados'
          : attendanceStatusFilter === 'PRESENT'
            ? 'Presente'
            : attendanceStatusFilter === 'LATE'
              ? 'Tarde'
              : 'Ausente'
      const searchLabel = attendanceSearchTerm.trim() || 'Sin filtro'

      try {
        const logoData = await fetchImageAsDataUrl('/logo_colegio.jpg')
        doc.addImage(logoData, 'JPEG', 14, 10, 18, 18)
      } catch (imgErr) {
        console.warn('Logo no disponible, continuando sin logo')
      }

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text(schoolName || 'NACIONAL AYACUCHO', 36, 16)
      doc.setFontSize(11)
      doc.text('Reporte Institucional de Asistencia', 36, 22)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text(`Docente: ${authUser?.full_name || '-'}`, 14, 34)
      doc.text(`Curso: ${activeCourseLabel}`, 14, 40)
      doc.text(`Estado: ${selectedStatusLabel}`, 14, 46)
      doc.text(`Búsqueda: ${searchLabel}`, 14, 52)
      doc.text(
        'Generado: ' + generatedAt.toLocaleString('es-BO', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        pageWidth - 14,
        34,
        { align: 'right' },
      )

      // Construir datos de tabla de forma segura
      const tableBody = []
      logsForPdf.forEach((log) => {
        try {
          const statusMeta = getScanStatusMeta(log.status) || { label: 'Desconocido' }
          
          let startTime = '-'
          let presentUntil = '-'
          let lateUntil = '-'
          
          if (log.event && typeof log.event === 'object') {
            startTime = log.event.start_time ? String(log.event.start_time) : '-'
            presentUntil = log.event.present_until ? String(log.event.present_until) : '-'
            lateUntil = log.event.late_until ? String(log.event.late_until) : '-'
          } else if (log.shift && typeof log.shift === 'object') {
            startTime = log.shift.start_time ? String(log.shift.start_time) : '-'
            presentUntil = log.shift.present_until ? String(log.shift.present_until) : '-'
            lateUntil = log.shift.late_until ? String(log.shift.late_until) : '-'
          }
          
          const scannedDate = 
            (log.status === 'PRESENT' || log.status === 'LATE') && log.scannedAt
              ? new Date(log.scannedAt).toLocaleString('es-BO', {
                  day: '2-digit',
                  month: '2-digit',
                  year: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : (log.status === 'ABSENT' ? 'Sin escaneo' : '-')
          
          tableBody.push({
            codigo: String(log.studentCode || '-'),
            ci: String(log.ci || '-'),
            nombre: String(log.name || '-'),
            curso: String(log.course || '-'),
            inicio: startTime,
            phasta: presentUntil,
            thasta: lateUntil,
            escaneo: scannedDate,
            estado: String(statusMeta.label || '-'),
            status: log.status,  // Para determinar color
          })
        } catch (rowErr) {
          console.warn('Error procesando fila:', rowErr, log)
          tableBody.push({
            codigo: 'ERROR',
            ci: 'ERROR',
            nombre: 'ERROR',
            curso: 'ERROR',
            inicio: '-',
            phasta: '-',
            thasta: '-',
            escaneo: '-',
            estado: '-',
            status: 'ABSENT',
          })
        }
      })

      console.log('📋 Body generado con', tableBody.length, 'filas')

      if (tableBody.length > 0) {
        autoTable(doc, {
          startY: 58,
          margin: { bottom: 16 },
          head: [['Codigo', 'CI', 'Estudiante', 'Curso', 'Inicio', 'P.hasta', 'T.hasta', 'Escaneo', 'Estado']],
          body: tableBody.map((row) => [
            row.codigo, row.ci, row.nombre, row.curso, row.inicio, row.phasta, row.thasta, row.escaneo, row.estado
          ]),
          styles: {
            fontSize: 8,
            cellPadding: 2.2,
          },
          headStyles: {
            fillColor: [15, 90, 112],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
          },
          alternateRowStyles: {
            fillColor: [246, 250, 252],
          },
          didDrawCell: (data) => {
            // Colorear la fila según el estado del registro
            if (data.section === 'body') {
              const rowData = tableBody[data.row.index]
              if (rowData) {
                let bgColor = [255, 255, 255]
                let fontColor = [0, 0, 0]
                
                if (rowData.status === 'PRESENT') {
                  bgColor = [212, 237, 218]  // Verde claro
                  fontColor = [21, 87, 36]   // Verde oscuro
                } else if (rowData.status === 'LATE') {
                  bgColor = [255, 243, 205]  // Amarillo claro
                  fontColor = [133, 100, 4]  // Marrón
                } else if (rowData.status === 'ABSENT') {
                  bgColor = [248, 215, 218]  // Rojo claro
                  fontColor = [114, 28, 36]  // Rojo oscuro
                }
                
                // Aplicar color solo a la última celda (Estado)
                if (data.column.index === 8) {
                  const { x, y, width, height } = data.cell
                  doc.setFillColor(...bgColor)
                  doc.rect(x, y, width, height, 'F')
                  doc.setTextColor(...fontColor)
                }
              }
            }
          },
        })
      }

      const totalPages = doc.getNumberOfPages()
      for (let page = 1; page <= totalPages; page += 1) {
        doc.setPage(page)
        doc.setDrawColor(194, 215, 224)
        doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        doc.setTextColor(59, 92, 105)
        doc.text('NACIONAL AYACUCHO - Gestion academica y asistencia QR', 14, pageHeight - 7)
        doc.text(`Pagina ${page} de ${totalPages}`, pageWidth - 14, pageHeight - 7, { align: 'right' })
      }

      const filename = `asistencia_${generatedAt.getFullYear()}-${String(generatedAt.getMonth() + 1).padStart(2, '0')}-${String(generatedAt.getDate()).padStart(2, '0')}.pdf`
      doc.save(filename)
      console.log('✅ PDF guardado:', filename)
      setAttendanceMessage(`✅ PDF descargado: ${filename}`)
    } catch (e) {
      console.error('❌ Error generating PDF:', e)
      console.error('Stack:', e.stack)
      setAttendanceMessage(`❌ Error al generar PDF: ${e.message}`)
    }
  }

  const downloadAdminEventReportPdf = async () => {
    if (adminActivity.length === 0) {
      setReportMessage('No hay datos para generar el reporte con los filtros actuales.')
      return
    }

    try {
      const doc = new jsPDF('p', 'mm', 'a4')
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const generatedAt = new Date()
      const selectedCourseLabel =
        myCourses.find((course) => String(course.id) === String(adminCourseFilter))?.label || 'Todos los cursos'
      const selectedDateLabel = adminDateFilter || 'Todas las fechas'

      try {
        const logoData = await fetchImageAsDataUrl('/logo_colegio.jpg')
        doc.addImage(logoData, 'JPEG', 14, 10, 18, 18)
      } catch (e) {
        // Continue without logo.
      }

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text(schoolName, 36, 16)
      doc.setFontSize(11)
      doc.text('Reporte Ejecutivo de Asistencia por Cursos', 36, 22)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9.6)
      doc.text(`Generado por: ${authUser?.full_name || authUser?.username || 'Administrador'}`, 14, 34)
      doc.text(`Curso: ${selectedCourseLabel}`, 14, 40)
      doc.text(`Fecha filtro: ${selectedDateLabel}`, 14, 46)
      doc.text(
        'Generado: ' + generatedAt.toLocaleString('es-BO', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        pageWidth - 14,
        34,
        { align: 'right' },
      )

      const summaryStartY = 58
      const boxWidth = 42
      const boxGap = 4
      const summaryValues = [
        { label: 'Total registros', value: String(adminTotalRecords) },
        { label: 'Presentes', value: String(adminAttendanceTotals.present) },
        { label: 'Tardanzas', value: String(adminAttendanceTotals.late) },
        { label: 'Otros', value: String(adminAttendanceTotals.other) },
      ]

      summaryValues.forEach((item, index) => {
        const x = 14 + (boxWidth + boxGap) * index
        doc.setDrawColor(210, 214, 232)
        doc.setFillColor(247, 249, 255)
        doc.roundedRect(x, summaryStartY, boxWidth, 16, 2, 2, 'FD')
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(92, 88, 122)
        doc.text(item.label, x + 3, summaryStartY + 5.5)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.setTextColor(34, 33, 53)
        doc.text(item.value, x + 3, summaryStartY + 12)
      })

      autoTable(doc, {
        startY: summaryStartY + 22,
        head: [['Dia', 'Curso', 'Registros', 'Presentes', 'Tardanzas', 'Otros']],
        body: adminReportByDayRows.map((item) => [
          item.day,
          item.course,
          String(item.total),
          String(item.present),
          String(item.late),
          String(item.other),
        ]),
        styles: {
          fontSize: 8.7,
          cellPadding: 2.4,
        },
        headStyles: {
          fillColor: [78, 52, 113],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [247, 246, 252],
        },
      })

      const secondTableStartY = (doc.lastAutoTable?.finalY || 108) + 8
      autoTable(doc, {
        startY: secondTableStartY,
        margin: { bottom: 16 },
        head: [['Dia', 'Docente', 'Curso', 'CI', 'Estudiante', 'Estado', 'Registro']],
        body: adminActivitySortedForReport.map((item) => {
          const statusMeta = getScanStatusMeta(item.status)
          return [
            item.date || '-',
            item.professor_name || '-',
            item.course_name || '-',
            item.ci || '-',
            item.student_name || '-',
            statusMeta.label,
            item.registered_at
              ? new Date(item.registered_at).toLocaleString('es-BO', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '-',
          ]
        }),
        styles: {
          fontSize: 8.2,
          cellPadding: 2.2,
        },
        headStyles: {
          fillColor: [15, 90, 112],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [246, 250, 252],
        },
      })

      const totalPages = doc.getNumberOfPages()
      for (let page = 1; page <= totalPages; page += 1) {
        doc.setPage(page)
        doc.setDrawColor(194, 215, 224)
        doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.3)
        doc.setTextColor(59, 92, 105)
        doc.text('Reporte Ejecutivo Institucional - Asistencia por Eventos', 14, pageHeight - 7)
        doc.text(`Pagina ${page} de ${totalPages}`, pageWidth - 14, pageHeight - 7, { align: 'right' })
      }

      doc.save(
        `reporte_eventos_${generatedAt.getFullYear()}-${String(generatedAt.getMonth() + 1).padStart(2, '0')}-${String(generatedAt.getDate()).padStart(2, '0')}.pdf`,
      )
      setReportMessage('Reporte PDF ejecutivo generado correctamente.')
    } catch (e) {
      setReportMessage('No se pudo generar el reporte PDF ejecutivo.')
    }
  }

  const requestRemoveStudentFromCourse = (studentItem) => {
    setPendingRemovalStudent(studentItem)
  }

  const cancelRemoveStudentFromCourse = () => {
    if (isRemovingStudent) {
      return
    }
    setPendingRemovalStudent(null)
  }

  const confirmRemoveStudentFromCourse = async () => {
    if (!pendingRemovalStudent) {
      return
    }

    setIsRemovingStudent(true)
    try {
      await authFetch(`${API_BASE}/professor/students/enrollment/${pendingRemovalStudent.id}/`, {
        method: 'DELETE',
      })
      setProfStudentMessage(`Estudiante retirado del curso: ${pendingRemovalStudent.full_name}`)
      setPendingRemovalStudent(null)
      loadProfessorStudents(activeCourseId)
      loadTotalStudents()
    } catch (error) {
      setProfStudentMessage(`No se pudo quitar del curso: ${error.message}`)
    } finally {
      setIsRemovingStudent(false)
    }
  }

  const downloadProfessorQr = () => {
    if (!profStudentCard) {
      return
    }
    const canvas = document.getElementById('prof-student-qr-canvas')
    if (!canvas) {
      return
    }
    const downloadLink = document.createElement('a')
    const safeName = profStudentCard.student.full_name.replace(/\s+/g, '_').toLowerCase()
    downloadLink.download = `qr_${safeName}_${profStudentCard.student.ci}.png`
    downloadLink.href = canvas.toDataURL('image/png')
    downloadLink.click()
  }

  const prepareNextProfessorRegistration = () => {
    setProfStudentCard(null)
    setProfStudentForm({ ci: '', full_name: '' })
    setProfStudentMessage('Listo para registrar un nuevo estudiante.')
    window.setTimeout(() => {
      professorCiInputRef.current?.focus()
    }, 0)
  }

  const registerStudent = async (event) => {
    event.preventDefault()
    const res = await fetch(`${API_BASE}/students/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    if (!res.ok) {
      setRegisteredStudent(null)
      setMessage(`Error al registrar estudiante: ${JSON.stringify(data)}`)
      return
    }

    setRegisteredStudent(data)
    setStudents((prev) => [data, ...prev])
    setMessage('Estudiante registrado correctamente. QR generado.')
    setForm({ ci: '', full_name: '', course_name: '' })
  }

  const downloadQr = () => {
    if (!registeredStudent) {
      return
    }

    const canvas = document.getElementById('student-qr-canvas')
    if (!canvas) {
      return
    }

    const downloadLink = document.createElement('a')
    const safeName = registeredStudent.full_name.replace(/\s+/g, '_').toLowerCase()
    downloadLink.download = `qr_${safeName}_${registeredStudent.ci}.png`
    downloadLink.href = canvas.toDataURL('image/png')
    downloadLink.click()
  }

  const sendScanToBackend = async (qrPayload) => {
    const res = await fetch(`${API_BASE}/attendance/scan/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${authToken}`,
      },
      body: JSON.stringify({
        qr_payload: qrPayload,
        event_id: activeEventId ? Number(activeEventId) : null,
      }),
    })

    const contentType = res.headers.get('content-type') || ''
    let data = null
    if (contentType.includes('application/json')) {
      data = await res.json()
    } else {
      const raw = await res.text()
      if (raw.includes('DisallowedHost')) {
        throw new Error('Backend bloqueo el host (DisallowedHost). Reinicia Django con ALLOWED_HOSTS actualizado.')
      }
      if (raw.trim().toLowerCase().startsWith('<!doctype') || raw.trim().startsWith('<')) {
        throw new Error('La API devolvio HTML en vez de JSON. Verifica que frontend y backend esten conectados por /api.')
      }
      throw new Error(`Respuesta invalida del servidor (${res.status}).`)
    }

    if (!res.ok) {
      throw new Error(data.detail || 'QR no valido')
    }
    return data
  }

  const login = async (event) => {
    event.preventDefault()
    if (isLoggingIn) {
      return
    }

    setAuthMessage('')
    setIsLoggingIn(true)
    try {
      const data = await fetch(`${API_BASE}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      }).then(async (res) => {
        const payload = await res.json()
        if (!res.ok) {
          throw new Error(payload.detail || 'Credenciales incorrectas.')
        }
        return payload
      })

      setAuthToken(data.token)
      setAuthUser(data.user)
      setActiveCourseId('')
      setMyCourses([])
      setProfCourseStudents([])
      localStorage.setItem('authToken', data.token)
      localStorage.setItem('authUser', JSON.stringify(data.user))
      setAuthMessage(`Bienvenido ${data.user.full_name}`)
      setLoginForm({ username: '', password: '' })
      goToMenu('Dashboard')
    } catch (error) {
      setAuthMessage(error.message)
    } finally {
      setIsLoggingIn(false)
    }
  }

  const logout = () => {
    setAuthToken('')
    setAuthUser(null)
    setActiveCourseId('')
    setMyCourses([])
    setProfCourseStudents([])
    setProfessors([])
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')
    setAuthMessage('Sesion cerrada.')
    navigate('/login')
  }

  const createProfessor = async (event) => {
    event.preventDefault()
    const generatedEmployeeCode = `EMP-${professorForm.username.trim().toUpperCase()}-${Date.now().toString().slice(-6)}`
    const preparedCourses = newProfessorCourses
      .map((item) => ({
        name: item.name.trim(),
        parallel: item.parallel.trim(),
      }))
      .filter((item) => item.name && item.parallel)

    if (preparedCourses.length === 0) {
      setAuthMessage('Debes agregar al menos un curso valido para el profesor.')
      return
    }

    try {
      const data = await authFetch(`${API_BASE}/professors/`, {
        method: 'POST',
        body: JSON.stringify({
          ...professorForm,
          employee_code: generatedEmployeeCode,
          courses: preparedCourses,
        }),
      })
      setProfessors((prev) => [data, ...prev])
      setProfessorForm({
        username: '',
        first_name: '',
        last_name: '',
        password: '',
      })
      setNewProfessorCourses([{ name: '', parallel: '' }])
      setAuthMessage(`Profesor creado: ${data.full_name}`)
    } catch (error) {
      setAuthMessage(`Error al crear profesor: ${error.message}`)
    }
  }

  const addProfessorCourseField = () => {
    setNewProfessorCourses((prev) => [...prev, { name: '', parallel: '' }])
  }

  const removeProfessorCourseField = (indexToRemove) => {
    setNewProfessorCourses((prev) => {
      if (prev.length === 1) {
        return [{ name: '', parallel: '' }]
      }
      return prev.filter((_, index) => index !== indexToRemove)
    })
  }

  const updateProfessorCourseField = (indexToUpdate, key, value) => {
    setNewProfessorCourses((prev) =>
      prev.map((item, index) => (index === indexToUpdate ? { ...item, [key]: value } : item)),
    )
  }

  const refreshProfessorListAndSelection = async (professorIdToKeep) => {
    const data = await authFetch(`${API_BASE}/professors/`, { method: 'GET' })
    if (!Array.isArray(data)) {
      return
    }
    setProfessors(data)
    if (professorIdToKeep) {
      const updatedProfessor = data.find((item) => item.id === professorIdToKeep) || null
      setAssigningProfessor(updatedProfessor)
      if (viewingProfessorCourses?.id === professorIdToKeep) {
        setViewingProfessorCourses(updatedProfessor)
      }
    }
  }

  const openEditProfessor = (professor) => {
    setEditingProfessor(professor)
    const [firstName = '', ...rest] = (professor.full_name || '').split(' ')
    setEditProfessorForm({
      first_name: firstName,
      last_name: rest.join(' '),
      email: '',
      employee_code: professor.employee_code || '',
      password: '',
    })
  }

  const closeEditProfessor = () => {
    setEditingProfessor(null)
    setEditProfessorForm({ first_name: '', last_name: '', email: '', employee_code: '', password: '' })
  }

  const submitEditProfessor = async (event) => {
    event.preventDefault()
    if (!editingProfessor) {
      return
    }

    try {
      await authFetch(`${API_BASE}/professors/${editingProfessor.id}/`, {
        method: 'PATCH',
        body: JSON.stringify(editProfessorForm),
      })
      setAuthMessage('Profesor actualizado correctamente.')
      closeEditProfessor()
      loadProfessors()
    } catch (error) {
      setAuthMessage(`No se pudo editar profesor: ${error.message}`)
    }
  }

  const openAssignCourse = (professor) => {
    setAssigningProfessor(professor)
    setAssignCourseForm({ course_name: '', course_parallel: '' })
    setAssignCourseEditingId(null)
    setAssignCourseEditForm({ course_name: '', course_parallel: '' })
    setAssignCourseSearchInput('')
    setAssignCourseSearchTerm('')
    setAssignCourseSortBy('name-asc')
    setAssignCoursePage(1)
    setPendingDeleteAssignedCourse(null)
  }

  const closeAssignCourse = () => {
    setAssigningProfessor(null)
    setAssignCourseForm({ course_name: '', course_parallel: '' })
    setAssignCourseEditingId(null)
    setAssignCourseEditForm({ course_name: '', course_parallel: '' })
    setAssignCourseSearchInput('')
    setAssignCourseSearchTerm('')
    setAssignCourseSortBy('name-asc')
    setAssignCoursePage(1)
    setPendingDeleteAssignedCourse(null)
  }

  const submitAssignCourse = async (event) => {
    event.preventDefault()
    if (!assigningProfessor) {
      return
    }

    try {
      await authFetch(`${API_BASE}/professors/${assigningProfessor.id}/courses/`, {
        method: 'POST',
        body: JSON.stringify(assignCourseForm),
      })
      setAuthMessage('Curso asignado correctamente.')
      setAssignCourseForm({ course_name: '', course_parallel: '' })
      await refreshProfessorListAndSelection(assigningProfessor.id)
    } catch (error) {
      setAuthMessage(`No se pudo asignar curso: ${error.message}`)
    }
  }

  const startEditAssignedCourse = (course) => {
    setAssignCourseEditingId(course.id)
    setAssignCourseEditForm({
      course_name: course.name,
      course_parallel: course.parallel,
    })
  }

  const cancelEditAssignedCourse = () => {
    setAssignCourseEditingId(null)
    setAssignCourseEditForm({ course_name: '', course_parallel: '' })
  }

  const submitEditAssignedCourse = async (event) => {
    event.preventDefault()
    if (!assigningProfessor || !assignCourseEditingId) {
      return
    }

    try {
      await authFetch(`${API_BASE}/professors/${assigningProfessor.id}/courses/${assignCourseEditingId}/`, {
        method: 'PATCH',
        body: JSON.stringify(assignCourseEditForm),
      })
      setAuthMessage('Curso actualizado correctamente.')
      cancelEditAssignedCourse()
      await refreshProfessorListAndSelection(assigningProfessor.id)
    } catch (error) {
      setAuthMessage(`No se pudo actualizar curso: ${error.message}`)
    }
  }

  const deleteAssignedCourse = async (course) => {
    setPendingDeleteAssignedCourse(course)
  }

  const cancelDeleteAssignedCourse = () => {
    setPendingDeleteAssignedCourse(null)
  }

  const confirmDeleteAssignedCourse = async () => {
    const course = pendingDeleteAssignedCourse
    if (!assigningProfessor) {
      return
    }
    if (!course) {
      return
    }

    try {
      await authFetch(`${API_BASE}/professors/${assigningProfessor.id}/courses/${course.id}/`, {
        method: 'DELETE',
      })
      setAuthMessage('Curso eliminado correctamente.')
      if (assignCourseEditingId === course.id) {
        cancelEditAssignedCourse()
      }
      setPendingDeleteAssignedCourse(null)
      await refreshProfessorListAndSelection(assigningProfessor.id)
    } catch (error) {
      setAuthMessage(`No se pudo eliminar curso: ${error.message}`)
    }
  }

  const confirmDeleteProfessor = async () => {
    if (!pendingDeleteProfessor) {
      return
    }

    try {
      await authFetch(`${API_BASE}/professors/${pendingDeleteProfessor.id}/`, {
        method: 'DELETE',
      })
      setAuthMessage('Profesor eliminado correctamente.')
      setPendingDeleteProfessor(null)
      loadProfessors()
    } catch (error) {
      setAuthMessage(`No se pudo eliminar profesor: ${error.message}`)
    }
  }

  const openEditStudent = (student) => {
    setEditingStudent(student)
    setEditStudentForm({
      ci: student.ci || '',
      full_name: student.full_name || '',
      course_name: student.course_name || '',
    })
  }

  const closeEditStudent = () => {
    setEditingStudent(null)
    setEditStudentForm({ ci: '', full_name: '', course_name: '' })
  }

  const submitEditStudent = async (event) => {
    event.preventDefault()
    if (!editingStudent) {
      return
    }

    try {
      await authFetch(`${API_BASE}/students/${editingStudent.id}/`, {
        method: 'PATCH',
        body: JSON.stringify(editStudentForm),
      })
      closeEditStudent()
      setShowStudentSavedModal(true)
      loadStudents()
      // Recargar la lista de estudiantes del profesor si hay un curso activo
      if (activeCourseId) {
        loadProfessorStudents(activeCourseId)
      }
    } catch (error) {
      setAuthMessage(`No se pudo editar estudiante: ${error.message}`)
    }
  }

  const confirmDeleteStudent = async () => {
    if (!pendingDeleteStudent) {
      return
    }

    try {
      await authFetch(`${API_BASE}/students/${pendingDeleteStudent.id}/`, {
        method: 'DELETE',
      })
      setAuthMessage('Estudiante eliminado exitosamente.')
      setPendingDeleteStudent(null)
      loadStudents()
    } catch (error) {
      const errorText = String(error?.message || '')
      if (errorText.includes('404') || errorText.toLowerCase().includes('no encontrado')) {
        setAuthMessage('El estudiante ya no existe o fue eliminado previamente.')
      } else {
        setAuthMessage(`No se pudo eliminar estudiante: ${error.message}`)
      }
    }
  }


  const loadAllShifts = async () => {
    setLoadingShifts(true)
    try {
      const data = await authFetch(`${API_BASE}/shifts/`, { method: 'GET' })
      if (Array.isArray(data)) {
        setShifts(data)
      }
    } catch (error) {
      setAdminEventMessage(`Error al cargar turnos: ${error.message}`)
      setShifts([])
    } finally {
      setLoadingShifts(false)
    }
  }


  const startScanner = async () => {
    if (isScannerRunning) {
      return
    }
    if (!activeCourseId) {
      setScanMessage('Selecciona un curso antes de iniciar el escaner.')
      return
    }
    if (!activeEventId) {
      setScanSeverity('warning')
      setScanMessage('Selecciona un evento antes de iniciar el escaner.')
      return
    }

    try {
      const qrScanner = new Html5Qrcode('qr-reader')
      scannerRef.current = qrScanner

      await qrScanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (decodedText) => {
          if (decodedText === lastScannedRef.current) {
            return
          }
          lastScannedRef.current = decodedText

          try {
            const result = await sendScanToBackend(decodedText)
            const alreadyMarked = result.status === 'already_marked'
            setScanSeverity(alreadyMarked ? 'warning' : 'success')
            setScanMessage(
              alreadyMarked
                ? `Ya fue registrado hoy: ${result.student.full_name}`
                : `Asistencia registrada correctamente: ${result.student.full_name}`,
            )
            setScanLogs((prev) => [
              {
                id: `${Date.now()}-${result.student.id}`,
                name: result.student.full_name,
                ci: result.student.ci,
                course: result.course?.label || result.student.course_name,
                status: result.status,
              },
              ...prev,
            ])
            loadMyAttendance()
          } catch (error) {
            setScanSeverity('error')
            setScanMessage(`Error: ${error.message}`)
          }

          window.setTimeout(() => {
            lastScannedRef.current = ''
          }, 1800)
        },
        () => {},
      )

      setIsScannerRunning(true)
      setScanSeverity('info')
      setScanMessage('Escaner activo. Apunta la camara al QR del estudiante.')
    } catch (error) {
      setScanSeverity('error')
      setScanMessage('No se pudo iniciar la camara. Revisa permisos del navegador.')
    }
  }

  const stopScanner = async () => {
    if (!scannerRef.current) {
      return
    }

    try {
      await scannerRef.current.stop()
      await scannerRef.current.clear()
    } catch {
      // Prevent UI breaks if scanner is already stopped.
    } finally {
      scannerRef.current = null
      setIsScannerRunning(false)
      setScanSeverity('info')
      setScanMessage('Escaner detenido.')
    }
  }

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [])

  if (isLoginRoute) {
    return (
      <main className="auth-root">
        <section
          className={isAuthPanelExpanded ? 'auth-card auth-card-interactive' : 'auth-card auth-card-interactive auth-left-collapsed'}
          onMouseMove={handleAuthCardMove}
          onMouseLeave={resetAuthCardFx}
          style={{
            '--auth-tilt-x': `${authCardFx.rotateX}deg`,
            '--auth-tilt-y': `${authCardFx.rotateY}deg`,
            '--auth-glow-x': `${authCardFx.glowX}%`,
            '--auth-glow-y': `${authCardFx.glowY}%`,
          }}
        >
          <aside className={isAuthPanelExpanded ? 'auth-brand-side' : 'auth-brand-side is-collapsed'}>
            <div className="auth-grid-glow" aria-hidden="true" />
            <div className="auth-brand-header">
              <img src="/logo_colegio.jpg" alt="Escudo del colegio" className="auth-brand-logo" />
              <div>
                <p className="auth-kicker">Nucleo del sistema</p>
                <h1>{schoolName}</h1>
              </div>
              <button
                type="button"
                className="auth-brand-toggle"
                aria-label={isAuthPanelExpanded ? 'Ocultar panel de detalles' : 'Mostrar panel de detalles'}
                aria-expanded={isAuthPanelExpanded}
                onClick={() => setIsAuthPanelExpanded((prev) => !prev)}
              >
                {isAuthPanelExpanded ? <ChevronsLeft size={14} /> : <ChevronsRight size={14} />}
                <span>{isAuthPanelExpanded ? 'Ocultar' : 'Mostrar'}</span>
              </button>
            </div>

            <div className="auth-brand-content">
              <p className="auth-subtitle">Control academico + asistencia QR en tiempo real.</p>

              <div className="auth-metrics" aria-hidden="true">
                <span>SIS/QR</span>
                <span>Tiempo real</span>
                <span>Seguro</span>
              </div>

              <div className="auth-feature-grid" role="tablist" aria-label="Detalles del sistema">
                {authFeatureItems.map(({ key, title, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    title={`Ver detalle de ${title.toLowerCase()}`}
                    className={activeAuthFeature === key ? 'auth-feature-btn is-active' : 'auth-feature-btn'}
                    onClick={() => setActiveAuthFeature(key)}
                  >
                    <Icon size={16} />
                    <span>{title}</span>
                  </button>
                ))}
              </div>

              <article className="auth-feature-detail" aria-live="polite">
                <p className="auth-feature-detail-label">Detalle activo</p>
                <h3>{activeAuthFeatureData.title}</h3>
                <p>{activeAuthFeatureData.description}</p>
              </article>

              <div className="auth-pulse-line" aria-hidden="true">
                <span />
              </div>

              <p className="auth-side-foot">Modo institucional activo</p>
            </div>
          </aside>

          <div className="auth-form-side">
            <div className="auth-title-wrap">
              <p className="auth-mini-tag">Capa de acceso</p>
              <h2>Inicio de sesion administrativo</h2>
              <p className="auth-form-caption">Accede al panel central.</p>
            </div>

            <form onSubmit={login} className="auth-form">
              <label className="auth-input-wrap" htmlFor="login-user">
                <span>Usuario</span>
                <input
                  id="login-user"
                  placeholder="Tu usuario"
                  value={loginForm.username}
                  onChange={(event) => setLoginForm((prev) => ({ ...prev, username: event.target.value }))}
                  required
                />
              </label>

              <label className="auth-input-wrap" htmlFor="login-password">
                <span>Contrasena</span>
                <input
                  id="login-password"
                  type="password"
                  placeholder="Tu contrasena"
                  value={loginForm.password}
                  onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
                  required
                />
              </label>

              <button type="submit" className={isLoggingIn ? 'auth-submit-btn is-loading' : 'auth-submit-btn'} disabled={isLoggingIn}>
                {isLoggingIn ? <span className="auth-loader" aria-hidden="true" /> : <LogIn size={16} />}
                <span>{isLoggingIn ? 'Ingresando...' : 'Entrar al sistema'}</span>
              </button>
            </form>

            {authMessage ? <p className="message auth-message">{authMessage}</p> : null}

            <div className="auth-trust-row" aria-hidden="true">
              <span>Cifrado SSL</span>
              <span>Monitoreo vivo</span>
              <span>Disponible 24/7</span>
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <div>
      {/* ...el resto del contenido principal de tu app... */}
    <main className={isProfessorRole ? 'dashboard-root professor-mode' : 'dashboard-root'}>
      <aside className={sidebarCollapsed ? 'sidebar is-collapsed' : 'sidebar'}>
        <div className="sidebar-header">
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            title={sidebarCollapsed ? 'Expandir menu' : 'Colapsar menu'}
            aria-label={sidebarCollapsed ? 'Expandir menu lateral' : 'Colapsar menu lateral'}
          >
            {sidebarCollapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
          </button>
        </div>

        <div className="brand-box">
          <img
            src="/logo_colegio.jpg"
            alt="Logo del colegio"
            className="brand-logo"
            onError={(event) => {
              event.currentTarget.src = '/vite.svg'
            }}
          />
          <div>
            <p className="brand-overline">{isProfessorRole ? 'Panel Docente' : 'Panel Admin'}</p>
            <h1>{schoolName}</h1>
          </div>
        </div>

        <nav className="menu-list">
          {visibleMenus.map(({ label, icon: Icon }) => (
            <button
              key={label}
              type="button"
              className={activeMenu === label ? 'menu-btn is-active' : 'menu-btn'}
              onClick={() => goToMenu(label)}
            >
              <span className="menu-icon-wrap">
                <Icon size={16} />
              </span>
              <span className="menu-label">{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-foot">
          <p>Sistema institucional</p>
          <small>Gestion academica y asistencia QR</small>
        </div>
      </aside>

      <section className="main-panel">
        <header className="top-header">
          <div>
            <p className="section-tag">{activeMenu}</p>
            <h2>{isProfessorRole ? 'Panel del profesor' : 'Control administrativo'}</h2>
          </div>

          <div className="search-wrap">
            <Search size={16} />
            <input placeholder="Buscar estudiante, curso o CI" />
          </div>

          <div className="header-meta">
            <div className="status-chip">En linea</div>

            <div className="user-chip">
              <UserCircle2 size={16} />
              <div>
                <strong>{authUser?.full_name || 'Invitado'}</strong>
                <small>{authUser?.role || 'Sin sesion'}</small>
              </div>
            </div>

            <div className="clock-chip">
              <Clock3 size={16} />
              <div>
                <strong>
                  {currentTime.toLocaleTimeString('es-BO', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </strong>
                <small>
                  {currentTime.toLocaleDateString('es-BO', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </small>
              </div>
            </div>

            {authToken ? (
              <button type="button" className="auth-btn" onClick={logout}>
                <LogOut size={16} />
                <span>Cerrar sesion</span>
              </button>
            ) : (
              <button type="button" className="auth-btn" onClick={() => { setAuthMessage(''); navigate('/login') }}>
                <LogIn size={16} />
                <span>Iniciar sesion</span>
              </button>
            )}
          </div>
        </header>

        <section className={isProfessorRole ? 'stats-grid' : 'stats-grid admin-stats-grid'}>
          {isProfessorRole ? (
            <>
              <article className="stat-card">
                <p>Mis cursos asignados</p>
                <strong>{myCourses.length}</strong>
              </article>
              <article className="stat-card">
                <p>Estudiantes registrados</p>
                <strong>{activeCourseId ? profCourseStudents.length : 0}</strong>
                <small style={{ display: 'block', fontSize: '0.75rem', marginTop: '4px', opacity: 0.7 }}>
                  {activeCourseId ? 'del curso activo' : 'selecciona un curso'}
                </small>
              </article>
              <article className="stat-card">
                <p>Escaneos del dia</p>
                <strong>{scanLogs.length}</strong>
              </article>
              <article className="stat-card">
                <p>Curso activo</p>
                <strong>
                  {activeCourseLabel || 'Sin seleccionar'}
                </strong>
              </article>
            </>
          ) : (
            <>
              <article className="stat-card admin-kpi-card">
                <div className="stat-icon-shell">
                  <Users size={16} />
                </div>
                <p>Usuarios creados</p>
                <strong>{totalCreatedUsers}</strong>
              </article>

              <article className="stat-card admin-kpi-card">
                <div className="stat-icon-shell">
                  <UserCog size={16} />
                </div>
                <p>Docentes registrados</p>
                <strong>{professors.length}</strong>
              </article>

              <article className="stat-card admin-kpi-card">
                <div className="stat-icon-shell">
                  <ClipboardCheck size={16} />
                </div>
                <p>Asistencias visibles</p>
                <strong>{adminActivity.length}</strong>
              </article>

              <article className="stat-card admin-kpi-card">
                <div className="stat-icon-shell">
                  <CalendarClock size={16} />
                </div>
                <p>Eventos con actividad</p>
                <strong>{adminActivityByEvent.length}</strong>
              </article>

              <article className="stat-card admin-kpi-card">
                <div className="stat-icon-shell">
                  <Clock3 size={16} />
                </div>
                <p>Registros puntuales</p>
                <strong>{adminAttendanceTotals.present}</strong>
              </article>

              <article className="stat-card admin-kpi-card">
                <div className="stat-icon-shell">
                  <ScanLine size={16} />
                </div>
                <p>Registros tarde</p>
                <strong>{adminAttendanceTotals.late}</strong>
              </article>
            </>
          )}
        </section>

        {requiresCourseContext ? (
          <section className={activeCourseId ? 'course-context-banner is-ready' : 'course-context-banner is-missing'}>
            <p>
              {activeCourseId
                ? `Curso activo bloqueado: ${activeCourseLabel}.`
                : 'No hay curso activo. Selecciona uno antes de registrar, escanear o crear eventos.'}
            </p>
            {!activeCourseId ? (
              <button type="button" onClick={() => goToMenu('Cursos')}>
                Ir a Cursos
              </button>
            ) : null}
          </section>
        ) : null}

        <section className="content-grid">
          {isDashboardMenu && isProfessorRole ? (
            <>
              <article className="panel-card professor-hero">
                <h3>Mi jornada docente</h3>
                <p>
                  Selecciona tu curso activo y luego pasa a escanear asistencias. Este panel esta optimizado para trabajo rapido en aula.
                </p>
                <div className="professor-actions">
                  <button type="button" onClick={() => goToMenu('QR y Escaner')}>
                    Abrir escaner QR
                  </button>
                  <button type="button" onClick={loadMyCourses}>
                    Actualizar cursos
                  </button>
                </div>
              </article>

              <article className="panel-card professor-course-card">
                <h3>Curso activo del profesor</h3>
                <div className="scanner-course-bar">
                  <label htmlFor="teacher-active-course">Seleccionar curso</label>
                  <select
                    id="teacher-active-course"
                    value={activeCourseId}
                    onChange={(event) => selectActiveCourse(event.target.value)}
                    disabled={loadingMyCourses || myCourses.length === 0}
                  >
                    {myCourses.length === 0 ? <option value="">Sin cursos disponibles</option> : null}
                    {myCourses.map((course) => (
                      <option key={course.id} value={String(course.id)}>
                        {course.label}
                      </option>
                    ))}
                  </select>
                </div>
                <p>
                  Contexto actual:{' '}
                  <strong>
                    {activeCourseLabel || 'Ninguno'}
                  </strong>
                </p>
              </article>

              <article className="panel-card students-card">
                <h3>Ultimos escaneos de mi jornada</h3>
                {scanLogs.length === 0 ? <p>No hay escaneos registrados aun.</p> : null}
                {scanLogs.length > 0 ? (
                  <div className="students-table-wrap">
                    <table className="students-table">
                      <thead>
                        <tr>
                          <th>CI</th>
                          <th>Nombre</th>
                          <th>Curso</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scanLogs.slice(0, 8).map((log, idx) => {
                          const statusMeta = getScanStatusMeta(log.status)
                          console.log(`Row ${idx}: CI=${log.ci}, Name=${log.name}, Course=${log.course}`)
                          return (
                            <tr key={log.id}>
                              <td data-col="ci">{log.ci}</td>
                              <td data-col="nombre">{log.name}</td>
                              <td data-col="curso">{log.course}</td>
                              <td data-col="estado">
                                <span className={`scan-status-badge ${statusMeta.className}`}>
                                  {statusMeta.label}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </article>
            </>
          ) : null}

          {isDashboardMenu ? (
            !isProfessorRole ? (
            <>
              <article className="panel-card dashboard-top-days-card">
                <div className="dashboard-card-header">
                  <h3>📊 Top Días - Resumen de Asistencias</h3>
                  <button type="button" className="view-all-btn" onClick={() => goToMenu('Asistencia')}>
                    Ver Detalle Completo →
                  </button>
                </div>

                {adminActivityTopDays.length === 0 ? (
                  <p className="empty-state">No hay datos de asistencia disponibles.</p>
                ) : (
                  <div className="top-days-grid">
                    {adminActivityTopDays.map((dayGroup, idx) => {
                      const presentPercent = dayGroup.dayTotal > 0 ? Math.round((dayGroup.dayPresent / dayGroup.dayTotal) * 100) : 0
                      return (
                        <div key={dayGroup.dayKey} className="day-summary-card">
                          <div className="day-badge">{idx + 1}</div>
                          <h4>{dayGroup.date}</h4>
                          <p className="day-info">
                            <span>{dayGroup.eventCount} eventos</span>
                            <span>•</span>
                            <span>{dayGroup.dayTotal} registros</span>
                          </p>

                          <div className="progress-section">
                            <div className="progress-bar">
                              <div
                                className="progress-fill"
                                style={{
                                  width: `${presentPercent}%`,
                                  background: `linear-gradient(90deg, #1ea97c 0%, #16a765 100%)`,
                                }}
                              />
                            </div>
                            <span className="progress-label">Presente: {presentPercent}%</span>
                          </div>

                          <div className="day-stats">
                            <div className="stat-item">
                              <span className="stat-label">Presentes</span>
                              <span className="stat-value stat-present">{dayGroup.dayPresent}</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">Tardanzas</span>
                              <span className="stat-value stat-late">{dayGroup.dayLate}</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">Ausentes</span>
                              <span className="stat-value stat-other">{dayGroup.dayOther}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </article>

              <article className="panel-card students-card admin-overview-card">
                <div className="admin-overview-head">
                  <div>
                    <h3>🎯 Centro de Gestión</h3>
                    <p>Acceso rápido a las herramientas administrativas principales.</p>
                  </div>
                  <div className="admin-overview-actions">
                    <button type="button" className="inline-action-btn" onClick={() => goToMenu('Estudiantes')}>
                      👥 Estudiantes
                    </button>
                    <button type="button" className="inline-action-btn" onClick={() => goToMenu('Profesores')}>
                      👨‍🏫 Docentes
                    </button>
                    <button type="button" className="inline-action-btn" onClick={() => goToMenu('Cursos')}>
                      📚 Cursos
                    </button>
                    <button type="button" className="inline-action-btn" onClick={() => goToMenu('Asistencia')}>
                      📊 Asistencia
                    </button>
                  </div>
                </div>

                <div className="admin-analytics-grid">
                  <article className="admin-analytics-card admin-ring-card">
                    <p className="admin-analytics-kicker">Estado de asistencias</p>
                    <div
                      className="admin-attendance-ring"
                      style={{
                        background: `conic-gradient(#1ea97c 0 ${presentPercent}%, #f29f3f ${presentPercent}% ${presentPercent + latePercent}%, #8ea0af ${presentPercent + latePercent}% 100%)`,
                      }}
                    >
                      <div>
                        <strong>{presentPercent}%</strong>
                        <span>Presente</span>
                      </div>
                    </div>
                    <div className="admin-ring-legend">
                      <span>Presente: {presentPercent}%</span>
                      <span>Tarde: {latePercent}%</span>
                      <span>Otros: {otherPercent}%</span>
                    </div>
                  </article>

                  <article className="admin-analytics-card admin-bars-card">
                    <p className="admin-analytics-kicker">Asistencia por evento</p>
                    {adminTopEvents.length === 0 ? <p className="admin-empty">Sin datos para graficar.</p> : null}
                    {adminTopEvents.map((eventItem) => {
                      const percent = adminTotalRecords > 0 ? Math.round((eventItem.total / adminTotalRecords) * 100) : 0
                      return (
                        <div key={`bar-${eventItem.key}`} className="admin-event-bar-row">
                          <div className="admin-event-bar-head">
                            <strong>{eventItem.title}</strong>
                            <span>{eventItem.total}</span>
                          </div>
                          <div className="admin-event-bar-track">
                            <span style={{ width: `${Math.max(percent, 4)}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </article>

                  <article className="admin-analytics-card admin-alerts-card">
                    <p className="admin-analytics-kicker">Alertas administrativas</p>
                    {adminAlerts.length === 0 ? <p className="admin-empty">Sin alertas criticas. Operacion estable.</p> : null}
                    {adminAlerts.map((alertItem) => (
                      <div key={alertItem.key} className="admin-alert-item">
                        <strong>{alertItem.title}</strong>
                        <span>{alertItem.detail}</span>
                      </div>
                    ))}
                  </article>
                </div>

                <div className="admin-event-kpi-grid">
                  {adminTopEvents.length === 0 ? (
                    <p className="admin-empty">Sin eventos con actividad para los filtros seleccionados.</p>
                  ) : (
                    adminTopEvents.map((eventItem) => (
                      <article key={eventItem.key} className="admin-event-kpi">
                        <h4>{eventItem.title}</h4>
                        <p>{eventItem.course}</p>
                        <div>
                          <span>Total: {eventItem.total}</span>
                          <span>Presente: {eventItem.present}</span>
                          <span>Tarde: {eventItem.late}</span>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </article>

              <article className="panel-card admin-users-card">
                <div className="admin-users-header">
                  <h3>📚 Usuarios Registrados</h3>
                </div>

                <div className="admin-users-grid">
                  {/* Estudiantes por Curso */}
                  <div className="admin-users-section">
                    <div className="section-header">
                      <h4>Estudiantes por Curso</h4>
                      <span className="badge-count">{students.length}</span>
                    </div>

                    {students.length === 0 ? (
                      <p className="admin-empty">No hay estudiantes registrados.</p>
                    ) : (
                      <>
                        <div className="students-by-course">
                          {Object.values(
                            students.reduce((acc, student) => {
                              const course = student.course_name || 'Sin asignar'
                              if (!acc[course]) {
                                acc[course] = []
                              }
                              acc[course].push(student)
                              return acc
                            }, {}),
                          )
                            .slice(0, 3)
                            .map((courseStudents, idx) => (
                              <div key={`course-${idx}`} className="course-group">
                                <h5>{courseStudents[0].course_name || 'Sin asignar'}</h5>
                                <div className="course-students">
                                  {courseStudents.slice(0, 3).map((student) => (
                                    <div key={`stu-${student.id}`} className="user-item">
                                      <span className="user-name">{student.full_name}</span>
                                      <span className="user-meta">{student.ci}</span>
                                    </div>
                                  ))}
                                  {courseStudents.length > 3 && (
                                    <div className="user-item more-indicator">
                                      +{courseStudents.length - 3} más
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                        <button type="button" className="detail-btn" onClick={() => goToMenu('Estudiantes')}>
                          Ver Todos los Estudiantes →
                        </button>
                      </>
                    )}
                  </div>

                  {/* Docentes */}
                  <div className="admin-users-section">
                    <div className="section-header">
                      <h4>Docentes</h4>
                      <span className="badge-count">{professors.length}</span>
                    </div>

                    {professors.length === 0 ? (
                      <p className="admin-empty">No hay docentes registrados.</p>
                    ) : (
                      <>
                        <div className="professors-list">
                          {professors.slice(0, 4).map((professor) => (
                            <div key={`prof-${professor.id}`} className="user-item">
                              <span className="user-name">{professor.full_name}</span>
                              <span className="user-meta">{professor.employee_code || 'Sin código'}</span>
                            </div>
                          ))}
                          {professors.length > 4 && (
                            <div className="user-item more-indicator">
                              +{professors.length - 4} más
                            </div>
                          )}
                        </div>
                        <button type="button" className="detail-btn" onClick={() => goToMenu('Profesores')}>
                          Ver Todos los Docentes →
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            </>
            ) : null
          ) : null}

          {isStudentsMenu ? (
            !isProfessorRole ? (
              <>
                <article className="panel-card">
                  <h3>Registrar estudiante</h3>
                  <form onSubmit={registerStudent}>
                    <input
                      placeholder="CI"
                      value={form.ci}
                      onChange={(event) => setForm({ ...form, ci: event.target.value })}
                      required
                    />
                    <input
                      placeholder="Nombre completo"
                      value={form.full_name}
                      onChange={(event) => setForm({ ...form, full_name: event.target.value })}
                      required
                    />
                    <input
                      placeholder="Curso"
                      value={form.course_name}
                      onChange={(event) => setForm({ ...form, course_name: event.target.value })}
                      required
                    />
                    <button type="submit">Guardar y generar QR</button>
                  </form>
                  {message ? <p className="message">{message}</p> : null}

                  <div className="quick-actions">
                    <button type="button" onClick={loadStudents}>
                      Actualizar lista
                    </button>
                  </div>
                </article>

                <article className="panel-card qr-panel">
                  <h3>QR del estudiante</h3>
                  {registeredStudent ? (
                    <>
                      <p>
                        <strong>{registeredStudent.full_name}</strong>
                      </p>
                      <p>CI: {registeredStudent.ci}</p>
                      <p>Curso: {registeredStudent.course_name}</p>
                      <QRCodeCanvas id="student-qr-canvas" value={registeredStudent.qr_payload} size={220} />
                      <button type="button" className="qr-download-btn" onClick={downloadQr}>
                        Descargar QR
                      </button>
                    </>
                  ) : (
                    <p className="qr-empty">Registra un estudiante para generar su QR aqui.</p>
                  )}
                </article>

                <article className="panel-card students-card">
                  <h3>Estudiantes recientes</h3>
                  {loadingStudents ? <p>Cargando...</p> : null}
                  {!loadingStudents && students.length === 0 ? <p>No hay estudiantes registrados.</p> : null}

                  {!loadingStudents && students.length > 0 ? (
                    <div className="students-table-wrap">
                      <table className="students-table">
                        <thead>
                          <tr>
                            <th>CI</th>
                            <th>Nombre</th>
                            <th>Curso</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.slice(0, 8).map((student) => (
                            <tr key={`${student.id}-${student.ci}`}>
                              <td>{student.ci}</td>
                              <td>{student.full_name}</td>
                              <td>{student.course_name}</td>
                              <td className="row-actions-cell">
                                <div className="row-actions">
                                  <button
                                    type="button"
                                    className="action-icon-btn"
                                    title="Ver detalles"
                                    aria-label="Ver detalles"
                                    onClick={() => setViewingStudent(student)}
                                  >
                                    <Eye size={15} />
                                  </button>
                                  <button
                                    type="button"
                                    className="action-icon-btn"
                                    title="Editar estudiante"
                                    aria-label="Editar estudiante"
                                    onClick={() => openEditStudent(student)}
                                  >
                                    <SquarePen size={15} />
                                  </button>
                                  <button
                                    type="button"
                                    className="action-icon-btn danger"
                                    title="Eliminar estudiante"
                                    aria-label="Eliminar estudiante"
                                    onClick={() => setPendingDeleteStudent(student)}
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </article>
              </>
            ) : (
              <>
                <article className="panel-card professor-student-card">
                  <h3>Registrar estudiante en mi curso</h3>
                  <div className="scanner-course-bar">
                    <label htmlFor="prof-active-course">Curso del profesor</label>
                    <select
                      id="prof-active-course"
                      value={activeCourseId}
                      onChange={(event) => selectActiveCourse(event.target.value)}
                      disabled={loadingMyCourses || myCourses.length === 0}
                    >
                      {myCourses.length === 0 ? <option value="">Sin cursos disponibles</option> : null}
                      {myCourses.map((course) => (
                        <option key={course.id} value={String(course.id)}>
                          {course.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <form onSubmit={registerStudentForProfessor}>
                    <input
                      ref={professorCiInputRef}
                      placeholder="CI del estudiante"
                      value={profStudentForm.ci}
                      onChange={(event) =>
                        setProfStudentForm((prev) => ({ ...prev, ci: event.target.value }))
                      }
                      required
                    />
                    <input
                      placeholder="Nombre completo"
                      value={profStudentForm.full_name}
                      onChange={(event) =>
                        setProfStudentForm((prev) => ({ ...prev, full_name: event.target.value }))
                      }
                      required
                    />
                    <button type="submit" disabled={!activeCourseId}>Registrar y generar QR</button>
                  </form>
                  {profStudentMessage ? <p className="message">{profStudentMessage}</p> : null}
                </article>

                <article className="panel-card qr-panel">
                  <h3>QR del estudiante del curso</h3>
                  {profStudentCard ? (
                    <>
                      <p>
                        <strong>{profStudentCard.student.full_name}</strong>
                      </p>
                      <p>CI: {profStudentCard.student.ci}</p>
                      <p>Curso: {profStudentCard.course.label}</p>
                      <QRCodeCanvas id="prof-student-qr-canvas" value={profStudentCard.qr_payload} size={220} />
                      <div className="qr-action-row">
                        <button type="button" className="qr-download-btn" onClick={downloadProfessorQr}>
                          Descargar QR
                        </button>
                        <button type="button" className="qr-new-btn" onClick={prepareNextProfessorRegistration}>
                          <SquarePen size={15} />
                          <span>Nuevo registro</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="qr-empty">Registra un estudiante para generar su QR personalizado.</p>
                  )}
                </article>

                <article className="panel-card students-card">
                  <h3>Estudiantes registrados del curso activo</h3>
                  <p>
                    Curso actual:{' '}
                    <strong>
                      {activeCourseLabel || 'Sin seleccionar'}
                    </strong>
                  </p>
                  <div className="quick-actions">
                    <button type="button" onClick={() => loadProfessorStudents(activeCourseId)} disabled={!activeCourseId}>
                      Actualizar estudiantes
                    </button>
                    <button 
                      type="button" 
                      onClick={() => generateCredentials(activeCourseId)} 
                      disabled={!activeCourseId || profCourseStudents.length === 0 || generatingCredentials}
                      style={{marginLeft: '10px', background: generatingCredentials ? '#ccc' : '#16a765'}}
                    >
                      {generatingCredentials ? '⏳ Generando...' : '📄 Generar Credenciales PDF'}
                    </button>
                  </div>

                  {generatingCredentials && (
                    <div style={{
                      padding: '15px',
                      margin: '10px 0',
                      background: '#fff3cd',
                      border: '1px solid #ffc107',
                      borderRadius: '5px',
                      textAlign: 'center',
                      color: '#856404'
                    }}>
                      <strong>⏳ Generando credenciales...</strong>
                      <p style={{margin: '5px 0 0 0', fontSize: '14px'}}>Por favor espere, esto puede tomar unos segundos.</p>
                    </div>
                  )}

                  {loadingProfCourseStudents ? <p>Cargando estudiantes...</p> : null}
                  {!loadingProfCourseStudents && profCourseStudents.length === 0 ? (
                    <p>No hay estudiantes registrados en este curso todavia.</p>
                  ) : null}

                  {!loadingProfCourseStudents && profCourseStudents.length > 0 ? (
                    <div className="students-table-wrap">
                      <table className="students-table">
                        <thead>
                          <tr>
                            <th>CI</th>
                            <th>Nombre</th>
                            <th>Codigo</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {profCourseStudents.map((studentItem, idx) => (
                            <tr key={`prof-${studentItem.id}-${idx}`}>
                              <td>{studentItem.ci}</td>
                              <td>{studentItem.full_name}</td>
                              <td>{studentItem.student_code}</td>
                              <td className="row-actions-cell">
                                <div className="row-actions">
                                  <button
                                    type="button"
                                    className="action-icon-btn"
                                    title="Ver QR"
                                    aria-label="Ver QR"
                                    onClick={() => openProfessorStudentQr(studentItem)}
                                  >
                                    <Eye size={15} />
                                  </button>
                                  <button
                                    type="button"
                                    className="action-icon-btn"
                                    title="Editar estudiante"
                                    aria-label="Editar estudiante"
                                    onClick={() => openEditStudent({
                                      id: studentItem.student_id,
                                      ci: studentItem.ci,
                                      full_name: studentItem.full_name,
                                      course_name: studentItem.course_label
                                    })}
                                  >
                                    <SquarePen size={15} />
                                  </button>
                                  <button
                                    type="button"
                                    className="action-icon-btn"
                                    title="Marcar asistencia"
                                    aria-label="Marcar asistencia"
                                    onClick={() => markManualAttendance(studentItem)}
                                  >
                                    <ClipboardCheck size={15} />
                                  </button>
                                  <button
                                    type="button"
                                    className="action-icon-btn danger"
                                    title="Quitar del curso"
                                    aria-label="Quitar del curso"
                                    onClick={() => requestRemoveStudentFromCourse(studentItem)}
                                  >
                                    <UserMinus size={15} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </article>
              </>
            )
          ) : null}

          {isScannerMenu ? (
            <article className="panel-card scanner-card">
              <h3>Escaner del profesor</h3>
              <p className="scanner-hint">Usa la camara del celular para pasar lista por QR.</p>
              <div className="scanner-course-bar">
                <label htmlFor="active-course">Curso activo</label>
                <select
                  id="active-course"
                  value={activeCourseId}
                  onChange={(event) => selectActiveCourse(event.target.value)}
                  disabled={loadingMyCourses || myCourses.length === 0}
                >
                  {myCourses.length === 0 ? <option value="">Sin cursos disponibles</option> : null}
                  {myCourses.map((course) => (
                    <option key={course.id} value={String(course.id)}>
                      {course.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="scanner-course-bar">
                <label htmlFor="active-event">🎯 Evento</label>
                <select
                  id="active-event"
                  style={{
                    padding: '0.65rem',
                    borderRadius: 6,
                    border: '2px solid ' + (activeEventId ? '#27ae60' : '#ecf0f1'),
                    background: activeEventId ? '#e8f8f0' : '#fff',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: !activeCourseId ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  value={activeEventId}
                  onChange={e => setActiveEventId(e.target.value)}
                  disabled={!activeCourseId || myEvents.length === 0}
                >
                  <option value="">Selecciona evento</option>
                  {myEvents
                    .filter(event => String(event.course_id) === String(activeCourseId))
                    .map(event => (
                      <option key={event.id} value={event.id}>
                        {event.title} ({event.date})
                      </option>
                    ))}
                </select>
              </div>
              <div className="scanner-actions">
                <button type="button" onClick={startScanner} disabled={isScannerRunning || !activeCourseId || !activeEventId}>
                  <Camera size={16} />
                  <span>Iniciar escaner</span>
                </button>
                <button type="button" onClick={stopScanner} disabled={!isScannerRunning} className="stop-btn">
                  <StopCircle size={16} />
                  <span>Detener</span>
                </button>
              </div>

              <div id="qr-reader" className="qr-reader-box" />
              <p className={`scan-message ${scanSeverity}`}>
                <ScanLine size={16} />
                <span>
                  {scanMessage}
                  {activeCourseId
                    ? ` | Curso activo: ${myCourses.find((course) => String(course.id) === String(activeCourseId))?.label || ''}`
                    : ''}
                  {activeEventId
                    ? ` | Evento: ${myEvents.find(e => String(e.id) === String(activeEventId))?.title || ''}`
                    : ''}
                </span>
              </p>

              {scanLogs.length > 0 ? (
                <div className="scan-log">
                  <h4>Ultimos escaneos</h4>
                  <ul>
                    {scanLogs.slice(0, 6).map((log) => (
                      (() => {
                        const statusMeta = getScanStatusMeta(log.status)
                        return (
                      <li key={log.id}>
                        <strong>{log.name}</strong> ({log.ci}) - {log.course} -{' '}
                        <span className={`scan-status-badge ${statusMeta.className}`}>{statusMeta.label}</span>
                      </li>
                        )
                      })()
                    ))}
                  </ul>
                </div>
              ) : null}
            </article>
          ) : null}

          {isAttendanceMenu && isProfessorRole ? (
            <article className="panel-card students-card attendance-premium-panel">
              <h3>Registro de asistencia del profesor</h3>
              
              {/* Filtros en cascada */}
              <div className="professor-toolbar" style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
                background: '#fff',
                borderRadius: '12px',
                boxShadow: '0 2px 8px #0001',
                padding: '1rem 2rem',
                margin: '1.5rem auto 2rem',
                maxWidth: 900,
                flexWrap: 'wrap',
              }}>
                {/* Filtro Curso */}
                <div style={{ flex: 1, minWidth: 150 }}>
                  <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 4, color: '#2c3e50' }}>
                    📖 Curso:
                  </label>
                  <select
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: 6,
                      border: '1px solid #ddd',
                      fontSize: 13,
                    }}
                    value={attendanceCourseFilter}
                    onChange={e => setAttendanceCourseFilter(e.target.value)}
                  >
                    <option value="ALL">Todos</option>
                    {[...new Set(scanLogs.map(log => log.course))].map((course) => (
                      <option key={course} value={course}>{course}</option>
                    ))}
                  </select>
                </div>

                {/* Filtro Evento */}
                <div style={{ flex: 1, minWidth: 150 }}>
                  <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 4, color: '#2c3e50' }}>
                    🎯 Evento:
                  </label>
                  <select
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: 6,
                      border: '1px solid #ddd',
                      fontSize: 13,
                    }}
                    value={attendanceEventFilter}
                    onChange={e => setAttendanceEventFilter(e.target.value)}
                  >
                    <option value="ALL">Todos</option>
                    {attendanceByEvent.map((event) => (
                      <option key={event.key} value={event.key}>
                        {event.title} ({event.date})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro Fecha */}
                <div style={{ flex: 1, minWidth: 130 }}>
                  <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 4, color: '#2c3e50' }}>
                    📅 Fecha:
                  </label>
                  <input
                    type="date"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: 6,
                      border: '1px solid #ddd',
                      fontSize: 13,
                    }}
                    value={attendanceDateFilter}
                    onChange={e => setAttendanceDateFilter(e.target.value)}
                  />
                </div>

                {/* Filtro Estado */}
                <div style={{ flex: 1, minWidth: 130 }}>
                  <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 4, color: '#2c3e50' }}>
                    ✓ Estado:
                  </label>
                  <select
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: 6,
                      border: '1px solid #ddd',
                      fontSize: 13,
                    }}
                    value={attendanceStatusFilter}
                    onChange={e => setAttendanceStatusFilter(e.target.value)}
                  >
                    <option value="ALL">Todos</option>
                    <option value="PRESENT">Presente</option>
                    <option value="LATE">Tarde</option>
                    <option value="ABSENT">Ausente</option>
                  </select>
                </div>

                {/* Filtro Búsqueda */}
                <div style={{ flex: 1.2, minWidth: 150 }}>
                  <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 4, color: '#2c3e50' }}>
                    🔍 Buscar:
                  </label>
                  <input
                    type="text"
                    placeholder="CI, nombre..."
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: 6,
                      border: '1px solid #ddd',
                      fontSize: 13,
                    }}
                    value={attendanceSearchTerm}
                    onChange={e => setAttendanceSearchTerm(e.target.value)}
                  />
                </div>

                {/* Botones de acción */}
                <div style={{ flex: 0.8, display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <button type="button" onClick={loadMyAttendance} style={{ background: '#218c74', color: '#fff', fontWeight: 600, borderRadius: 6, padding: '0.5rem 1rem', fontSize: 13, border: 'none', cursor: 'pointer' }}>
                    Actualizar
                  </button>
                  <button type="button" onClick={downloadAttendancePdf} style={{ background: '#006266', color: '#fff', fontWeight: 600, borderRadius: 6, padding: '0.5rem 1rem', fontSize: 13, border: 'none', cursor: 'pointer' }}>
                    PDF
                  </button>
                </div>
              </div>
              {attendanceMessage ? <p className="message">{attendanceMessage}</p> : null}
              {scanLogs.length === 0 ? <p>No hay asistencias registradas aun.</p> : null}

              {scanLogs.length > 0 ? (
                <div className="attendance-summary-strip">
                  <article className="stat-card attendance-summary-card" style={{
                    borderLeftColor: '#218c74',
                    backgroundColor: 'rgba(33, 140, 116, 0.05)',
                  }}>
                    <p>Total filtrado</p>
                    <strong>{attendanceTotals.total}</strong>
                  </article>
                  <article className="stat-card attendance-summary-card" style={{
                    borderLeftColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.05)',
                  }}>
                    <p>✅ Presentes</p>
                    <strong>{attendanceTotals.present}</strong>
                  </article>
                  <article className="stat-card attendance-summary-card" style={{
                    borderLeftColor: '#ffc107',
                    backgroundColor: 'rgba(255, 193, 7, 0.05)',
                  }}>
                    <p>⏱️ Tardanzas</p>
                    <strong>{attendanceTotals.late}</strong>
                  </article>
                  <article className="stat-card attendance-summary-card" style={{
                    borderLeftColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.05)',
                  }}>
                    <p>❌ Ausentes</p>
                    <strong>{attendanceTotals.absent}</strong>
                  </article>
                </div>
              ) : null}

              {scanLogs.length > 0 ? (
                <section className="attendance-pro-analytics">
                  <article className="attendance-chart-card">
                    <p className="attendance-chart-kicker">Distribucion de estados</p>
                    <div
                      className="attendance-status-ring"
                      style={{
                        background: `conic-gradient(#28a745 0 ${attendancePresentPercent}%, #ffc107 ${attendancePresentPercent}% ${attendancePresentPercent + attendanceLatePercent}%, #dc3545 ${attendancePresentPercent + attendanceLatePercent}% 100%)`,
                      }}
                    >
                      <div>
                        <strong>{attendanceTotals.total}</strong>
                        <span>Registros</span>
                      </div>
                    </div>
                    <div className="attendance-chart-legend">
                      <span>Presente: {attendancePresentPercent}%</span>
                      <span>Tarde: {attendanceLatePercent}%</span>
                      <span>Ausente: {attendanceAbsentPercent}%</span>
                    </div>
                  </article>

                  <article className="attendance-chart-card">
                    <p className="attendance-chart-kicker">Registros por curso</p>
                    {attendanceTopEvents.length === 0 ? <p className="attendance-chart-empty">Sin datos para graficar.</p> : null}
                    {attendanceTopEvents.length > 0 ? (
                      <div className="attendance-event-bars">
                        {attendanceTopEvents.map((eventItem) => {
                          const widthPercent = attendanceTotals.total > 0
                            ? Math.max(6, Math.round((eventItem.total / attendanceTotals.total) * 100))
                            : 0
                          return (
                            <div key={`bar-${eventItem.key}`} className="attendance-event-bar-row">
                              <div className="attendance-event-bar-meta">
                                <strong>{eventItem.title}</strong>
                                <span>{eventItem.total} registros</span>
                              </div>
                              <div className="attendance-event-bar-track">
                                <div className="attendance-event-bar-fill" style={{ width: `${widthPercent}%` }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : null}
                  </article>

                  <article className="attendance-chart-card attendance-chart-card-wide">
                    <p className="attendance-chart-kicker">Tendencia por hora (Presentes vs Tarde/Ausente)</p>
                    {attendanceTimelinePoints.length === 0 ? <p className="attendance-chart-empty">Sin datos temporales para mostrar tendencia.</p> : null}
                    {attendanceTimelinePoints.length > 0 ? (
                      <>
                        <div className="attendance-trend-legend">
                          <span className="is-present">Presentes</span>
                          <span className="is-other">Tarde/Ausente</span>
                        </div>
                        <div className="attendance-trend-wrap">
                          <svg viewBox="0 0 100 100" className="attendance-trend-svg" preserveAspectRatio="none" role="img" aria-label="Tendencia de registros por hora">
                            <polyline
                              points={attendancePresentTrendPolyline}
                              className="attendance-trend-line is-present"
                            />
                            <polyline
                              points={attendanceOtherTrendPolyline}
                              className="attendance-trend-line is-other"
                            />
                            {attendanceTimelinePoints.map((point, index, list) => {
                              const cx = list.length === 1 ? 50 : Math.round((index / (list.length - 1)) * 100)
                              const presentCy = Math.max(8, 100 - Math.round((point.present / attendanceTimelineMax) * 92))
                              const otherCy = Math.max(8, 100 - Math.round((point.other / attendanceTimelineMax) * 92))
                              return (
                                <g key={`trend-dot-${point.key}`}>
                                  <circle cx={cx} cy={presentCy} r="1.8" className="attendance-trend-dot is-present" />
                                  <circle cx={cx} cy={otherCy} r="1.8" className="attendance-trend-dot is-other" />
                                </g>
                              )
                            })}
                          </svg>
                        </div>
                        <div className="attendance-trend-points">
                          {attendanceTimelinePoints.map((point) => (
                            <span key={`trend-label-${point.key}`}>
                              {point.label} : P {point.present} | T/A {point.other}
                            </span>
                          ))}
                        </div>
                      </>
                    ) : null}
                  </article>
                </section>
              ) : null}

              {scanLogs.length > 0 && filteredAttendanceLogs.length === 0 ? (
                <p>No hay registros para los filtros seleccionados.</p>
              ) : null}

              {attendanceByDay.length > 0 ? (
                <div className="attendance-days-groups">
                  {attendanceByDay.map((dayGroup) => {
                    const isExpanded = expandedDays[dayGroup.dayKey] !== false
                    const toggleDay = () => {
                      setExpandedDays((prev) => ({
                        ...prev,
                        [dayGroup.dayKey]: !prev[dayGroup.dayKey],
                      }))
                    }

                    return (
                      <section key={dayGroup.dayKey} className="attendance-day-group">
                        <header className="attendance-day-head">
                          <button
                            type="button"
                            className="day-toggle-btn"
                            onClick={toggleDay}
                            title={isExpanded ? 'Contraer día' : 'Expandir día'}
                          >
                            <ChevronDown
                              size={18}
                              style={{
                                transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                                transition: 'transform 0.3s',
                              }}
                            />
                          </button>
                          <div>
                            <h4>Día: {dayGroup.date || '-'}</h4>
                          </div>
                          <div className="attendance-day-metrics">
                            <span>Total: {dayGroup.dayTotal}</span>
                            <span>Presente: {dayGroup.dayPresent}</span>
                            <span>Tarde: {dayGroup.dayLate}</span>
                            <span>Ausente: {dayGroup.dayOther}</span>
                          </div>
                        </header>

                        {isExpanded && (
                          <div className="attendance-day-events">
                            {dayGroup.events.map((eventGroup) => (
                              <section key={eventGroup.key} className="attendance-event-group">
                                <header className="attendance-event-head">
                                  <div>
                                    <h5>{eventGroup.title}</h5>
                                    <p>{eventGroup.course}</p>
                                  </div>
                                  <div className="attendance-event-metrics">
                                    <span>Total: {eventGroup.total}</span>
                                    <span>Presente: {eventGroup.present}</span>
                                    <span>Tarde: {eventGroup.late}</span>
                                    <span>Ausente: {eventGroup.other}</span>
                                  </div>
                                </header>

                                <div className="students-table-wrap">
                                  <table className="students-table">
                                    <thead>
                                      <tr>
                                        <th>Codigo</th>
                                        <th>CI</th>
                                        <th>Estudiante</th>
                                        <th>Hora scaneo</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {eventGroup.rows.map((log) => {
                                        const statusMeta = getScanStatusMeta(log.status)
                                        // Solo mostrar hora de escaneo si realmente escaneó (Presente o Tarde)
                                        const scannedDate = (log.status === 'PRESENT' || log.status === 'LATE') && log.scannedAt
                                          ? new Date(log.scannedAt).toLocaleString('es-BO', {
                                              day: '2-digit',
                                              month: '2-digit',
                                              year: '2-digit',
                                              hour: '2-digit',
                                              minute: '2-digit',
                                            })
                                          : (log.status === 'ABSENT' ? 'Sin escaneo' : '-')

                                        // Determinar clase CSS según estado
                                        let rowClass = ''
                                        if (log.status === 'PRESENT') {
                                          rowClass = 'attendance-row-present'
                                        } else if (log.status === 'LATE') {
                                          rowClass = 'attendance-row-late'
                                        } else if (log.status === 'ABSENT') {
                                          rowClass = 'attendance-row-absent'
                                        }

                                        return (
                                          <tr key={log.id} className={rowClass}>
                                            <td>{log.studentCode || '-'}</td>
                                            <td>{log.ci || '-'}</td>
                                            <td><strong>{log.name}</strong></td>
                                            <td>{scannedDate}</td>
                                            <td>
                                              <span className={`attendance-status-${log.status.toLowerCase()}`}>
                                                {log.status === 'PRESENT' && '✅ '}
                                                {log.status === 'LATE' && '⏱️ '}
                                                {log.status === 'ABSENT' && '❌ '}
                                                {statusMeta.label}
                                              </span>
                                            </td>
                                            <td className="row-actions-cell">
                                              <div className="row-actions">
                                                <button
                                                  type="button"
                                                  className="action-icon-btn"
                                                  title="Marcar presente"
                                                  aria-label="Marcar presente"
                                                  onClick={() => updateAttendanceStatus(log.attendanceId, 'PRESENT')}
                                                >
                                                  <ClipboardCheck size={15} />
                                                </button>
                                                <button
                                                  type="button"
                                                  className="action-icon-btn"
                                                  title="Marcar tarde"
                                                  aria-label="Marcar tarde"
                                                  onClick={() => updateAttendanceStatus(log.attendanceId, 'LATE')}
                                                >
                                                  <Clock3 size={15} />
                                                </button>
                                                <button
                                                  type="button"
                                                  className="action-icon-btn"
                                                  title="Marcar ausente"
                                                  aria-label="Marcar ausente"
                                                  onClick={() => updateAttendanceStatus(log.attendanceId, 'ABSENT')}
                                                >
                                                  <X size={15} />
                                                </button>
                                                <button
                                                  type="button"
                                                  className="action-icon-btn danger"
                                                  title="Eliminar registro"
                                                  aria-label="Eliminar registro"
                                                  onClick={() => deleteAttendanceRecord(log.attendanceId)}
                                                >
                                                  <UserMinus size={15} />
                                                </button>
                                              </div>
                                            </td>
                                          </tr>
                                        )
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </section>
                            ))}
                          </div>
                        )}
                      </section>
                    )
                  })}
                </div>
              ) : null}
            </article>
          ) : null}

          {isAttendanceMenu && !isProfessorRole ? (
            <article className="panel-card students-card">
              <h3>Actividad institucional de asistencia</h3>
              <div className="quick-actions">
                <select value={adminCourseFilter} onChange={(event) => setAdminCourseFilter(event.target.value)}>
                  <option value="">Todos los cursos</option>
                  {myCourses.map((course) => (
                    <option key={course.id} value={String(course.id)}>
                      {course.label}
                    </option>
                  ))}
                </select>
                <input type="date" value={adminDateFilter} onChange={(event) => setAdminDateFilter(event.target.value)} />
                <button type="button" onClick={loadAdminActivity}>Actualizar</button>
              </div>

              {loadingAdminActivity ? <p>Cargando actividad...</p> : null}
              {!loadingAdminActivity && adminActivity.length === 0 ? <p>No hay registros para mostrar.</p> : null}

              {!loadingAdminActivity && adminActivityEventAccordion.length > 0 ? (
                <div className="event-accordion-group">
                  {adminActivityEventAccordion.map((eventGroup) => {
                    const isExpanded = expandedEventAccordions[eventGroup.key] === true
                    const toggleEvent = () => {
                      setExpandedEventAccordions((prev) => ({
                        ...prev,
                        [eventGroup.key]: !prev[eventGroup.key],
                      }))
                    }

                    return (
                      <div key={eventGroup.key} className="event-accordion-item">
                        <button
                          type="button"
                          className="event-accordion-header"
                          onClick={toggleEvent}
                          title={isExpanded ? 'Contraer' : 'Expandir'}
                        >
                          <ChevronDown
                            size={20}
                            style={{
                              transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                              transition: 'transform 0.3s',
                            }}
                          />
                          <div className="event-accordion-info">
                            <h5>{eventGroup.title}</h5>
                            <p>{eventGroup.course}</p>
                          </div>
                          <div className="event-accordion-stats">
                            <span className="stat-badge">Total: {eventGroup.total}</span>
                            <span className="stat-badge stat-present">P: {eventGroup.present}</span>
                            <span className="stat-badge stat-late">T: {eventGroup.late}</span>
                            <span className="stat-badge stat-other">O: {eventGroup.other}</span>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="event-accordion-content">
                            <div className="students-table-wrap">
                              <table className="students-table">
                                <thead>
                                  <tr>
                                    <th>Docente</th>
                                    <th>Evento</th>
                                    <th>CI</th>
                                    <th>Estudiante</th>
                                    <th>Curso</th>
                                    <th>Fecha</th>
                                    <th>Estado</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {eventGroup.rows.map((item) => (
                                    <tr key={`activity-${item.id}`}>
                                      <td>{item.professor_name || '-'}</td>
                                      <td>{item.course_name || '-'}</td>
                                      <td>{item.ci || '-'}</td>
                                      <td>{item.student_name}</td>
                                      <td>{item.course_name}</td>
                                      <td>
                                        {item.registered_at
                                          ? new Date(item.registered_at).toLocaleString('es-BO', {
                                              day: '2-digit',
                                              month: '2-digit',
                                              year: 'numeric',
                                              hour: '2-digit',
                                              minute: '2-digit',
                                            })
                                          : '-'}
                                      </td>
                                      <td>
                                        <span className={`scan-status-badge ${statusMeta.className}`}>{statusMeta.label}</span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : null}
            </article>
          ) : null}

          {isReportsMenu && !isProfessorRole ? (
            <>
              <article className="panel-card students-card report-executive-card">
                <h3>Reporte ejecutivo por cursos</h3>
                <p>Genera un PDF institucional con control por dia y por curso (ideal para auditoría y reportes ejecutivos).</p>

                <div className="quick-actions">
                  <select value={adminCourseFilter} onChange={(event) => setAdminCourseFilter(event.target.value)}>
                    <option value="">Todos los cursos</option>
                    {myCourses.map((course) => (
                      <option key={course.id} value={String(course.id)}>
                        {course.label}
                      </option>
                    ))}
                  </select>

                  <input type="date" value={adminDateFilter} onChange={(event) => setAdminDateFilter(event.target.value)} />
                  <button type="button" onClick={loadAdminActivity}>Actualizar datos</button>
                  <button type="button" onClick={downloadAdminEventReportPdf}>
                    <FileDown size={15} />
                    <span>Generar PDF ejecutivo</span>
                  </button>
                </div>

                {reportMessage ? <p className="message">{reportMessage}</p> : null}

                <div className="report-kpis">
                  <div>
                    <p>Total registros</p>
                    <strong>{adminTotalRecords}</strong>
                  </div>
                  <div>
                    <p>Dias analizados</p>
                    <strong>{adminReportByDay.length}</strong>
                  </div>
                  <div>
                    <p>Eventos analizados</p>
                    <strong>{adminReportByDayRows.length}</strong>
                  </div>
                  <div>
                    <p>Presentes</p>
                    <strong>{adminAttendanceTotals.present}</strong>
                  </div>
                  <div>
                    <p>Tardanzas</p>
                    <strong>{adminAttendanceTotals.late}</strong>
                  </div>
                </div>
              </article>

              <article className="panel-card students-card report-preview-card">
                <h3>Vista previa por dia y evento</h3>
                {loadingAdminActivity ? <p>Cargando vista previa...</p> : null}
                {!loadingAdminActivity && adminReportByDay.length === 0 ? <p>No hay datos para vista previa.</p> : null}
                {!loadingAdminActivity && adminReportByDay.length > 0 ? (
                  <div className="attendance-days-groups">
                    {adminReportByDay.map((dayGroup) => (
                      <section key={`report-day-${dayGroup.dayKey}`} className="attendance-day-group">
                        <header className="attendance-day-head">
                          <div>
                            <h4>Dia: {dayGroup.date || '-'}</h4>
                          </div>
                          <div className="attendance-day-metrics">
                            <span>Eventos: {dayGroup.events.length}</span>
                            <span>Total: {dayGroup.total}</span>
                            <span>Presente: {dayGroup.present}</span>
                            <span>Tarde: {dayGroup.late}</span>
                            <span>Otros: {dayGroup.other}</span>
                          </div>
                        </header>

                        <div className="students-table-wrap">
                          <table className="students-table">
                            <thead>
                              <tr>
                                <th>Evento</th>
                                <th>Curso</th>
                                <th>Total</th>
                                <th>Presentes</th>
                                <th>Tardanzas</th>
                                <th>Otros</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dayGroup.events.map((eventItem) => (
                                <tr key={`preview-${dayGroup.dayKey}-${eventItem.key}`}>
                                  <td>{eventItem.title}</td>
                                  <td>{eventItem.course}</td>
                                  <td>{eventItem.total}</td>
                                  <td>{eventItem.present}</td>
                                  <td>{eventItem.late}</td>
                                  <td>{eventItem.other}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    ))}
                  </div>
                ) : null}
              </article>
            </>
          ) : null}

          {isReportsMenu && isProfessorRole ? (
            <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Título */}
              <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#2c3e50', margin: 0 }}>Reporte Diario del Profesor</h2>

              {/* Panel de controles */}
              <div style={{ background: 'linear-gradient(170deg, #fff, #fffafc)', border: '1px solid #e8ecf0', borderRadius: '18px', padding: '1.5rem', boxShadow: '0 12px 28px rgba(60,16,32,0.1)' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}>
                  <label style={{ fontWeight: 600, color: '#555' }}>📅 Fecha:</label>
                  <input type="date" value={dailyReportDate} onChange={(e) => {
                    setDailyReportDate(e.target.value)
                    loadDailyReport(e.target.value, reportCourseFilter)
                  }}
                    style={{ padding: '0.6rem 1rem', border: '1px solid #ddd', borderRadius: '8px', fontSize: '0.95rem', minWidth: '150px' }} />
                  
                  <label style={{ fontWeight: 600, color: '#555', marginLeft: '1rem' }}>📚 Curso:</label>
                  <select value={reportCourseFilter} onChange={(e) => {
                    setReportCourseFilter(e.target.value)
                    loadDailyReport(dailyReportDate, e.target.value)
                  }}
                    style={{ padding: '0.6rem 1rem', border: '1px solid #ddd', borderRadius: '8px', fontSize: '0.95rem', minWidth: '200px', background: 'white', cursor: 'pointer' }}>
                    <option value="ALL">Todos los cursos</option>
                    {myCourses.map((course) => (
                      <option key={course.id} value={course.id}>{course.name} - {course.parallel}</option>
                    ))}
                  </select>
                  
                  <div style={{ display: 'flex', gap: '0.6rem', marginLeft: 'auto' }}>
                    <button onClick={() => loadDailyReport(dailyReportDate, reportCourseFilter)} disabled={loadingDailyReport}
                      style={{ background: 'linear-gradient(135deg, #218c74, #0d6f57)', color: 'white', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                      {loadingDailyReport ? '⏳ Cargando...' : 'Actualizar'}
                    </button>
                    <button onClick={exportReportToPDF} disabled={!dailyReport || loadingDailyReport}
                      style={{ background: 'linear-gradient(135deg, #6c5ce7, #5541d8)', color: 'white', border: 'none', padding: '0.7rem 1.2rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', opacity: (!dailyReport || loadingDailyReport) ? 0.5 : 1 }}>
                      PDF
                    </button>
                    <button onClick={exportReportToExcel} disabled={!dailyReport || loadingDailyReport}
                      style={{ background: 'linear-gradient(135deg, #00b894, #00a085)', color: 'white', border: 'none', padding: '0.7rem 1.2rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', opacity: (!dailyReport || loadingDailyReport) ? 0.5 : 1 }}>
                      Excel
                    </button>
                  </div>
                </div>
              </div>

              {dailyReportMessage && <p className="message error">{dailyReportMessage}</p>}

              {!dailyReport && !loadingDailyReport && (
                <div style={{ background: 'white', border: '1px solid #e8ecf0', borderRadius: '18px', padding: '4rem 2rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.4 }}>📅</div>
                  <p style={{ color: '#888', margin: 0 }}>Selecciona una fecha y presiona "Actualizar"</p>
                </div>
              )}

              {dailyReport && dailyReport.total_events === 0 && (
                <div style={{ background: 'linear-gradient(135deg, #fff8e6, #fff3d0)', border: '1px solid #f5c842', borderRadius: '18px', padding: '3rem 2rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                  <p style={{ color: '#8a6d00', margin: 0, fontWeight: 600, fontSize: '1.1rem' }}>No hay eventos para este curso en la fecha seleccionada</p>
                  <p style={{ color: '#a88c20', margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
                    {reportCourseFilter !== 'ALL' ? 'Prueba seleccionar "Todos los cursos" o cambia la fecha' : 'No se encontraron eventos para esta fecha'}
                  </p>
                </div>
              )}

              {dailyReport && dailyReport.total_events > 0 && (
                <>
                  {/* Resumen */}
                  <div style={{ background: 'linear-gradient(135deg, #f0fdf8, #e8f5f0)', border: '1px solid #c8e6d8', borderRadius: '10px', padding: '0.8rem 1.2rem', fontWeight: 600, color: '#218c74', textTransform: 'capitalize' }}>
                    📅 {new Date(dailyReport.date + 'T12:00:00').toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} — {dailyReport.total_events} evento{dailyReport.total_events !== 1 ? 's' : ''}
                  </div>

                  {/* KPIs */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                    <div style={{ background: 'white', border: '1px solid #e8ecf0', borderRadius: '12px', padding: '1.2rem 1.5rem', borderLeft: '4px solid #6c5ce7' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#888', textTransform: 'uppercase' }}>TOTAL INSCRITOS</div>
                      <div style={{ fontSize: '2.2rem', fontWeight: 700, color: '#2c3e50' }}>{dailyReport.total_enrolled_all_events}</div>
                    </div>
                    <div style={{ background: 'white', border: '1px solid #e8ecf0', borderRadius: '12px', padding: '1.2rem 1.5rem', borderLeft: '4px solid #00b894' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#888', textTransform: 'uppercase' }}>✅ PRESENTES</div>
                      <div style={{ fontSize: '2.2rem', fontWeight: 700, color: '#2c3e50' }}>{dailyReport.total_present_all_events}</div>
                    </div>
                    <div style={{ background: 'white', border: '1px solid #e8ecf0', borderRadius: '12px', padding: '1.2rem 1.5rem', borderLeft: '4px solid #fdcb6e' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#888', textTransform: 'uppercase' }}>⏰ TARDANZAS</div>
                      <div style={{ fontSize: '2.2rem', fontWeight: 700, color: '#2c3e50' }}>{dailyReport.total_late_all_events}</div>
                    </div>
                    <div style={{ background: 'white', border: '1px solid #e8ecf0', borderRadius: '12px', padding: '1.2rem 1.5rem', borderLeft: '4px solid #e17055' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#888', textTransform: 'uppercase' }}>❌ AUSENTES</div>
                      <div style={{ fontSize: '2.2rem', fontWeight: 700, color: '#2c3e50' }}>{dailyReport.total_absent_all_events}</div>
                    </div>
                  </div>

                  {/* Gráficos */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    {/* Donut */}
                    <div style={{ background: 'white', border: '1px solid #e8ecf0', borderRadius: '12px', padding: '1.5rem' }}>
                      <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#666', textTransform: 'uppercase', margin: '0 0 1rem' }}>DISTRIBUCIÓN DE ESTADOS</h4>
                      <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem 0' }}>
                        <svg width="180" height="180" viewBox="0 0 100 100">
                          {(() => {
                            const total = dailyReport.total_enrolled_all_events || 1
                            const present = dailyReport.total_present_all_events
                            const late = dailyReport.total_late_all_events
                            const absent = dailyReport.total_absent_all_events
                            const r = 35, cx = 50, cy = 50
                            const circumference = 2 * Math.PI * r
                            let offset = 0
                            const presentDash = (present / total) * circumference
                            const lateDash = (late / total) * circumference
                            const absentDash = (absent / total) * circumference
                            return (
                              <>
                                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e0e0e0" strokeWidth="12" />
                                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#4caf50" strokeWidth="12" strokeDasharray={`${presentDash} ${circumference}`} strokeDashoffset={-offset} transform="rotate(-90 50 50)" />
                                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ff9800" strokeWidth="12" strokeDasharray={`${lateDash} ${circumference}`} strokeDashoffset={-(offset += presentDash)} transform="rotate(-90 50 50)" />
                                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f44336" strokeWidth="12" strokeDasharray={`${absentDash} ${circumference}`} strokeDashoffset={-(offset += lateDash)} transform="rotate(-90 50 50)" />
                              </>
                            )
                          })()}
                          <text x="50" y="46" textAnchor="middle" style={{ fontSize: '1.2rem', fontWeight: 700, fill: '#2c3e50' }}>{dailyReport.total_enrolled_all_events}</text>
                          <text x="50" y="58" textAnchor="middle" style={{ fontSize: '0.5rem', fill: '#888' }}>Registros</text>
                        </svg>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', fontSize: '0.85rem', color: '#555' }}>
                        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#4caf50', marginRight: 4 }}></span>Presente: {dailyReport.attendance_percentage}%</span>
                        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#ff9800', marginRight: 4 }}></span>Tarde: {Math.round((dailyReport.total_late_all_events / (dailyReport.total_enrolled_all_events || 1)) * 100)}%</span>
                        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#f44336', marginRight: 4 }}></span>Ausente: {Math.round((dailyReport.total_absent_all_events / (dailyReport.total_enrolled_all_events || 1)) * 100)}%</span>
                      </div>
                    </div>

                    {/* Barras */}
                    <div style={{ background: 'white', border: '1px solid #e8ecf0', borderRadius: '12px', padding: '1.5rem' }}>
                      <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#666', textTransform: 'uppercase', margin: '0 0 1rem' }}>REGISTROS POR EVENTO</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: 280, overflowY: 'auto' }}>
                        {dailyReport.events.map((event) => (
                          <div key={event.event_id}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontSize: '0.85rem', color: '#333' }}>{event.title}</span>
                              <span style={{ fontSize: '0.8rem', color: '#e17055', fontWeight: 600 }}>{event.total_enrolled} registros</span>
                            </div>
                            <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3 }}>
                              <div style={{ height: '100%', background: 'linear-gradient(90deg, #e17055, #fdcb6e)', borderRadius: 3, width: `${Math.min(100, (event.total_enrolled / (dailyReport.total_enrolled_all_events || 1)) * 100 * 2)}%` }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Eventos */}
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#2c3e50', margin: 0 }}>Detalle por Evento</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {dailyReport.events.map((event, eventIdx) => {
                      const isOpen = !!expandedEvents[event.event_id]
                      const pct = event.total_enrolled > 0 ? Math.round(((event.present_count + event.late_count) / event.total_enrolled) * 100) : 0
                      return (
                        <div key={event.event_id} style={{ background: 'white', border: `1px solid ${isOpen ? '#218c74' : '#e8ecf0'}`, borderRadius: '12px', overflow: 'hidden', boxShadow: isOpen ? '0 4px 16px rgba(33,140,116,0.15)' : 'none' }}>
                          <button type="button" onClick={() => setExpandedEvents(prev => ({ ...prev, [event.event_id]: !prev[event.event_id] }))}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.2rem', background: isOpen ? 'linear-gradient(135deg, #f0fdf8, #e8f8f2)' : 'none', border: 'none', borderBottom: isOpen ? '1px solid #c8e6d8' : 'none', cursor: 'pointer', textAlign: 'left' }}>
                            <span style={{ width: 32, height: 32, minWidth: 32, background: 'linear-gradient(135deg, #218c74, #0d6f57)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700 }}>{eventIdx + 1}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <span style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600, color: '#2c3e50' }}>{event.title}</span>
                              <span style={{ display: 'block', fontSize: '0.8rem', color: '#888' }}>{event.course_name} · {event.course_parallel}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.6rem', borderRadius: 12, background: '#e8f5e9', color: '#2e7d32' }}>✅ {event.present_count}</span>
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.6rem', borderRadius: 12, background: '#fff8e1', color: '#f57f17' }}>⏰ {event.late_count}</span>
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.6rem', borderRadius: 12, background: '#fce4ec', color: '#c62828' }}>❌ {event.absent_count}</span>
                            </div>
                            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#218c74', minWidth: 45, textAlign: 'right' }}>{pct}%</span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: 12, background: event.is_active ? '#e8f5e9' : '#fce4ec', color: event.is_active ? '#2e7d32' : '#c62828' }}>{event.is_active ? 'Activo' : 'Cerrado'}</span>
                            <span style={{ color: '#218c74', fontSize: '0.8rem' }}>{isOpen ? '▲' : '▼'}</span>
                          </button>
                          {isOpen && (
                            <div style={{ borderTop: '1px solid #e8f0e8', background: '#fafcfa', overflowX: 'auto' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <thead style={{ background: 'linear-gradient(135deg, #218c74, #0d6f57)' }}>
                                  <tr>
                                    {['#', 'Estudiante', 'Código', 'C.I.', 'Estado', 'Hora'].map(h => (
                                      <th key={h} style={{ padding: '0.8rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase' }}>{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {event.attendance_records.map((record, idx) => (
                                    <tr key={`${event.event_id}-${record.student_id}-${idx}`} style={{ borderBottom: '1px solid #f0f4f0' }}>
                                      <td style={{ padding: '0.7rem 1rem', color: '#444' }}>{idx + 1}</td>
                                      <td style={{ padding: '0.7rem 1rem', fontWeight: 600, color: '#2c3e50' }}>{record.student_name}</td>
                                      <td style={{ padding: '0.7rem 1rem', color: '#444' }}>{record.student_code}</td>
                                      <td style={{ padding: '0.7rem 1rem', color: '#444' }}>{record.ci}</td>
                                      <td style={{ padding: '0.7rem 1rem' }}>
                                        <span style={{ display: 'inline-block', padding: '0.25rem 0.7rem', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600, background: record.status === 'PRESENT' ? '#e8f5e9' : record.status === 'LATE' ? '#fff8e1' : '#fce4ec', color: record.status === 'PRESENT' ? '#2e7d32' : record.status === 'LATE' ? '#f57f17' : '#c62828' }}>
                                          {record.status === 'PRESENT' ? '✅ Presente' : record.status === 'LATE' ? '⏰ Tardío' : '❌ Ausente'}
                                        </span>
                                      </td>
                                      <td style={{ padding: '0.7rem 1rem', color: '#444' }}>{record.scanned_at ? new Date(record.scanned_at).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          ) : null}

          {isEventsMenu && isProfessorRole ? (
            <>
              <article className="panel-card professor-course-card">
                <h3>Crear evento de asistencia</h3>
                <p>Define fecha y ventanas horarias para controlar presente y retraso por sesion.</p>
                {serverClockInfo.time ? (
                  <p className="message">
                    Hora del servidor: {serverClockInfo.time} ({serverClockInfo.timezone || 'America/La_Paz'}) - {serverClockInfo.date}
                  </p>
                ) : null}
                {Math.abs(serverClockOffsetMs) >= 120000 ? (
                  <p className="message">
                    Tu dispositivo tiene desfase de hora respecto al servidor. Al guardar, se ajustara automaticamente a la hora del servidor.
                  </p>
                ) : null}
                <div className="scanner-course-bar">
                  <label htmlFor="events-course-select">Curso del evento</label>
                  <select
                    id="events-course-select"
                    value={activeCourseId}
                    onChange={(event) => selectActiveCourse(event.target.value)}
                    disabled={loadingMyCourses || myCourses.length === 0}
                  >
                    {myCourses.length === 0 ? <option value="">Sin cursos disponibles</option> : null}
                    {myCourses.map((course) => (
                      <option key={course.id} value={String(course.id)}>
                        {course.label}
                      </option>
                    ))}
                  </select>
                </div>
                <form onSubmit={createMyEvent}>
                  <input
                    placeholder="Titulo del evento (ej: Matematica - 1ra hora)"
                    value={eventForm.title}
                    onChange={(event) => setEventForm((prev) => ({ ...prev, title: event.target.value }))}
                    required
                  />
                  <input
                    type="date"
                    value={eventForm.date}
                    onChange={(event) => setEventForm((prev) => ({ ...prev, date: event.target.value }))}
                    required
                  />
                  <input
                    type="time"
                    value={eventForm.start_time}
                    onChange={(event) => setEventForm((prev) => ({ ...prev, start_time: event.target.value }))}
                    required
                  />
                  <input
                    type="time"
                    value={eventForm.present_until}
                    onChange={(event) => setEventForm((prev) => ({ ...prev, present_until: event.target.value }))}
                    required
                  />
                  <input
                    type="time"
                    value={eventForm.late_until}
                    onChange={(event) => setEventForm((prev) => ({ ...prev, late_until: event.target.value }))}
                    required
                  />
                  <button type="submit">Guardar evento</button>
                </form>
                {attendanceMessage ? <p className="message">{attendanceMessage}</p> : null}
              </article>

              <article className="panel-card students-card">
                <h3>Mis eventos de asistencia</h3>
                {myEvents.length === 0 ? (
                  <p style={{ color: '#7f8c8d', fontSize: 14 }}>
                    No hay eventos creados aún. Crea uno en el formulario anterior.
                  </p>
                ) : (
                  <div style={{ marginTop: '1rem' }}>
                    {myEvents.map((event) => (
                      <div
                        key={event.id}
                        onMouseEnter={() => setHoveredEventId(event.id)}
                        onMouseLeave={() => setHoveredEventId(null)}
                        style={{
                          padding: '1.2rem',
                          marginBottom: '0.8rem',
                          border: '1px solid #ecf0f1',
                          borderRadius: '8px',
                          background: event.is_active ? '#f8f9fa' : '#fef5f5',
                          opacity: event.is_active ? 1 : 0.7,
                          transition: 'all 0.3s ease',
                          position: 'relative',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#2c3e50', fontSize: 15 }}>
                              {event.title}
                              {event.is_active ? (
                                <span style={{ marginLeft: '0.5rem', fontSize: 12, color: '#27ae60', fontWeight: 'bold' }}>● ACTIVO</span>
                              ) : (
                                <span style={{ marginLeft: '0.5rem', fontSize: 12, color: '#e74c3c', fontWeight: 'bold' }}>● INACTIVO</span>
                              )}
                            </div>
                            <div style={{ fontSize: 13, color: '#555', marginBottom: '0.3rem' }}>
                              📅 {event.date}
                            </div>
                            <div style={{ fontSize: 13, color: '#555', marginBottom: '0.3rem' }}>
                              🕐 {event.start_time} - {event.late_until}
                            </div>
                            <div style={{ fontSize: 13, color: '#555' }}>
                              ✓ Presente hasta: {event.present_until} | ⏱ Tarde hasta: {event.late_until}
                            </div>
                          </div>
                          {hoveredEventId === event.id && (
                            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem', animation: 'fadeIn 0.3s ease' }}>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    await authFetch(`${API_BASE}/professor/my-events/${event.id}/`, {
                                      method: 'PATCH',
                                      body: JSON.stringify({ is_active: !event.is_active }),
                                    })
                                    loadMyEvents()
                                  } catch (error) {
                                    setAttendanceMessage(`❌ Error: ${error.message}`)
                                  }
                                }}
                                style={{
                                  padding: '0.5rem 1rem',
                                  borderRadius: '6px',
                                  border: 'none',
                                  background: event.is_active ? '#27ae60' : '#95a5a6',
                                  color: 'white',
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease',
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.background = event.is_active ? '#229954' : '#7f8c8d'
                                  e.target.style.transform = 'scale(1.05)'
                                  e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = event.is_active ? '#27ae60' : '#95a5a6'
                                  e.target.style.transform = 'scale(1)'
                                  e.target.style.boxShadow = 'none'
                                }}
                              >
                                {event.is_active ? '✓ Desactivar' : '✗ Activar'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEventToDelete(event)
                                  setDeleteModalOpen(true)
                                }}
                                style={{
                                  padding: '0.5rem 1rem',
                                  borderRadius: '6px',
                                  border: 'none',
                                  background: '#e74c3c',
                                  color: 'white',
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease',
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.background = '#c0392b'
                                  e.target.style.transform = 'scale(1.05)'
                                  e.target.style.boxShadow = '0 4px 12px rgba(231, 76, 60, 0.4)'
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = '#e74c3c'
                                  e.target.style.transform = 'scale(1)'
                                  e.target.style.boxShadow = 'none'
                                }}
                              >
                                🗑 Eliminar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {deleteModalOpen && eventToDelete && (
                  <div
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(0, 0, 0, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 9999,
                      animation: 'fadeIn 0.3s ease',
                    }}
                    onClick={() => {
                      setDeleteModalOpen(false)
                      setEventToDelete(null)
                    }}
                  >
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '2rem',
                        maxWidth: '400px',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                        animation: 'slideUp 0.3s ease',
                      }}
                    >
                      <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ color: '#2c3e50', marginBottom: '0.5rem', fontSize: 18 }}>
                          Eliminar evento
                        </h3>
                        <p style={{ color: '#7f8c8d', margin: 0, fontSize: 14, lineHeight: 1.5 }}>
                          ¿Estás seguro de que deseas eliminar el evento <strong>"{eventToDelete.title}"</strong>? Esta acción no se puede deshacer.
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteModalOpen(false)
                            setEventToDelete(null)
                          }}
                          style={{
                            padding: '0.7rem 1.5rem',
                            borderRadius: '6px',
                            border: '1px solid #ecf0f1',
                            background: 'white',
                            color: '#2c3e50',
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = '#f0f0f0'
                            e.target.style.borderColor = '#bdc3c7'
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'white'
                            e.target.style.borderColor = '#ecf0f1'
                          }}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await authFetch(`${API_BASE}/professor/my-events/${eventToDelete.id}/`, {
                                method: 'DELETE',
                              })
                              loadMyEvents()
                              setAttendanceMessage('✅ Evento eliminado correctamente')
                              setTimeout(() => setAttendanceMessage(''), 3000)
                              setDeleteModalOpen(false)
                              setEventToDelete(null)
                            } catch (error) {
                              setAttendanceMessage(`❌ Error: ${error.message}`)
                            }
                          }}
                          style={{
                            padding: '0.7rem 1.5rem',
                            borderRadius: '6px',
                            border: 'none',
                            background: '#e74c3c',
                            color: 'white',
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = '#c0392b'
                            e.target.style.boxShadow = '0 4px 12px rgba(231, 76, 60, 0.4)'
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = '#e74c3c'
                            e.target.style.boxShadow = 'none'
                          }}
                        >
                          Sí, eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            </>
          ) : null}

          {isCoursesMenu && isProfessorRole ? (
            <>
              <article className="panel-card professor-course-card">
                <h3>Armar mi curso</h3>
                <p>Crea cursos dinamicos para organizar a tus estudiantes y QR por paralelo.</p>
                <form onSubmit={createMyCourse}>
                  <input
                    placeholder="Nombre del curso (ej: 5to Sec)"
                    value={newCourseForm.name}
                    onChange={(event) =>
                      setNewCourseForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                    required
                  />
                  <input
                    placeholder="Paralelo (ej: B)"
                    value={newCourseForm.parallel}
                    onChange={(event) =>
                      setNewCourseForm((prev) => ({ ...prev, parallel: event.target.value }))
                    }
                    required
                  />
                  <button type="submit">Crear curso</button>
                </form>
                {profStudentMessage ? <p className="message">{profStudentMessage}</p> : null}
              </article>

              <article className="panel-card students-card">
                <h3>Mis cursos del profesor</h3>
                {loadingMyCourses ? <p>Cargando cursos...</p> : null}
                {!loadingMyCourses && myCourses.length === 0 ? <p>Aun no tienes cursos creados.</p> : null}
                {!loadingMyCourses && myCourses.length > 0 ? (
                  <div className="students-table-wrap">
                    <table className="students-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Curso</th>
                          <th>Accion</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myCourses.map((course) => (
                          <tr key={course.id}>
                            <td>{course.id}</td>
                            <td>{course.label}</td>
                            <td>
                              <button
                                type="button"
                                className="inline-action-btn"
                                onClick={() => selectActiveCourse(String(course.id), { confirmChange: false })}
                              >
                                Activar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </article>
            </>
          ) : null}

          {isCoursesMenu && !isProfessorRole ? (
            <>
              <article className="panel-card">
                <h3>Gestion de cursos institucionales</h3>
                <p>Administra cursos globales y asignalos a docentes desde una sola vista.</p>
                <form onSubmit={createAdminCourse}>
                  <input
                    placeholder="Nombre del curso"
                    value={adminCourseForm.name}
                    onChange={(event) => setAdminCourseForm((prev) => ({ ...prev, name: event.target.value }))}
                    required
                  />
                  <input
                    placeholder="Paralelo"
                    value={adminCourseForm.parallel}
                    onChange={(event) => setAdminCourseForm((prev) => ({ ...prev, parallel: event.target.value }))}
                    required
                  />
                  <select
                    value={adminCourseForm.professor_id}
                    onChange={(event) => setAdminCourseForm((prev) => ({ ...prev, professor_id: event.target.value }))}
                    required
                  >
                    <option value="">Seleccionar profesor</option>
                    {professors.map((professor) => (
                      <option key={`course-prof-${professor.id}`} value={String(professor.id)}>
                        {professor.full_name} ({professor.employee_code})
                      </option>
                    ))}
                  </select>
                  <button type="submit">Crear curso</button>
                </form>
                <div className="quick-actions">
                  <button type="button" onClick={loadMyCourses}>Actualizar cursos</button>
                </div>
                {adminCourseMessage ? <p className="message">{adminCourseMessage}</p> : null}
              </article>

              <article className="panel-card students-card">
                <h3>Cursos institucionales registrados</h3>
                {loadingMyCourses ? <p>Cargando cursos...</p> : null}
                {!loadingMyCourses && myCourses.length === 0 ? <p>No hay cursos registrados aun.</p> : null}
                {!loadingMyCourses && myCourses.length > 0 ? (
                  <div className="students-table-wrap">
                    <table className="students-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Curso</th>
                          <th>Paralelo</th>
                          <th>Docente</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myCourses.map((course) => (
                          <tr key={`admin-course-${course.id}`}>
                            <td>{course.id}</td>
                            <td>{course.name}</td>
                            <td>{course.parallel}</td>
                            <td>{course.professor_name || 'Sin docente'}</td>
                            <td className="row-actions-cell">
                              <div className="row-actions">
                                <button
                                  type="button"
                                  className="action-icon-btn"
                                  title="Editar curso"
                                  aria-label="Editar curso"
                                  onClick={() => openEditAdminCourse(course)}
                                >
                                  <SquarePen size={15} />
                                </button>
                                <button
                                  type="button"
                                  className="action-icon-btn danger"
                                  title="Eliminar curso"
                                  aria-label="Eliminar curso"
                                  onClick={() => deleteAdminCourse(course)}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </article>

              <article className="panel-card">
                <h3>Gestion de eventos de asistencia</h3>
                <p>Crea y administra eventos de asistencia para todos los cursos del sistema.</p>
                <form onSubmit={submitCreateEvent}>
                  <input
                    placeholder="Titulo del evento (ej: Matematica - 1ra hora)"
                    value={editEventForm.title}
                    onChange={(event) => setEditEventForm((prev) => ({ ...prev, title: event.target.value }))}
                    required
                  />
                  <select
                    value={editEventForm.course_id}
                    onChange={(event) => setEditEventForm((prev) => ({ ...prev, course_id: event.target.value }))}
                    required
                  >
                    <option value="">Seleccionar curso</option>
                    {myCourses.map((course) => (
                      <option key={`event-course-${course.id}`} value={String(course.id)}>
                        {course.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={editEventForm.date}
                    onChange={(event) => setEditEventForm((prev) => ({ ...prev, date: event.target.value }))}
                    required
                  />
                  <input
                    type="time"
                    value={editEventForm.start_time}
                    onChange={(event) => setEditEventForm((prev) => ({ ...prev, start_time: event.target.value }))}
                    required
                  />
                  <input
                    type="time"
                    placeholder="Presente hasta"
                    value={editEventForm.present_until}
                    onChange={(event) => setEditEventForm((prev) => ({ ...prev, present_until: event.target.value }))}
                    required
                  />
                  <input
                    type="time"
                    placeholder="Retraso hasta"
                    value={editEventForm.late_until}
                    onChange={(event) => setEditEventForm((prev) => ({ ...prev, late_until: event.target.value }))}
                    required
                  />
                  <button type="submit">Crear turno</button>
                </form>
                <div className="quick-actions">
                  <button type="button" onClick={loadAllShifts}>Actualizar turnos</button>
                </div>
                {adminEventMessage ? <p className="message">{adminEventMessage}</p> : null}
              </article>

              <article className="panel-card students-card">
                <h3>Configuración de turnos registrados</h3>
                {loadingShifts ? <p>Cargando turnos...</p> : null}
                {!loadingShifts && shifts.length === 0 ? <p>No hay turnos registrados.</p> : null}
                {!loadingShifts && shifts.length > 0 ? (
                  <div className="students-table-wrap">
                    <table className="students-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Titulo</th>
                          <th>Fecha</th>
                          <th>Horario</th>
                          <th>Curso</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shifts.map((shift) => (
                          <tr key={`shift-${shift.id}`}>
                            <td>{shift.id}</td>
                            <td>{shift.shift_type_display}</td>
                            <td>{shift.start_time}</td>
                            <td>{shift.time_window_display}</td>
                            <td className="row-actions-cell">
                              <div className="row-actions">
                                <button
                                  type="button"
                                  className="action-icon-btn"
                                  title="Editar turno"
                                  aria-label="Editar turno"
                                  onClick={() => setEditingShift(shift)}
                                >
                                  <SquarePen size={15} />
                                </button>
                                <button
                                  type="button"
                                  className="action-icon-btn danger"
                                  title="Eliminar turno"
                                  aria-label="Eliminar turno"
                                  onClick={() => {
                                    // Delete shift
                                  }}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </article>
            </>
          ) : null}

          {isProfessorsMenu ? (
            <>
              <article className="panel-card login-card">
                <h3>Acceso de administracion</h3>
                <div className="auth-state">
                  <p>
                    <Shield size={16} />
                    <span>
                      Sesion activa: <strong>{authUser?.full_name || authUser?.username}</strong> ({authUser?.role})
                    </span>
                  </p>
                </div>
                {authMessage ? <p className="message">{authMessage}</p> : null}
              </article>

              <article className="panel-card">
                <h3>Crear profesor</h3>
                {!authToken ? (
                  <p>Inicia sesion como administrador para crear profesores.</p>
                ) : (
                  <form onSubmit={createProfessor}>
                    <input
                      placeholder="Usuario"
                      value={professorForm.username}
                      onChange={(event) =>
                        setProfessorForm((prev) => ({ ...prev, username: event.target.value }))
                      }
                      required
                    />
                    <input
                      placeholder="Nombre"
                      value={professorForm.first_name}
                      onChange={(event) =>
                        setProfessorForm((prev) => ({ ...prev, first_name: event.target.value }))
                      }
                      required
                    />
                    <input
                      placeholder="Apellido"
                      value={professorForm.last_name}
                      onChange={(event) =>
                        setProfessorForm((prev) => ({ ...prev, last_name: event.target.value }))
                      }
                      required
                    />
                    <div className="professor-courses-builder">
                      <p className="professor-courses-title">Cursos del profesor</p>
                      {newProfessorCourses.map((courseItem, index) => (
                        <div key={`new-prof-course-${index}`} className="professor-course-row">
                          <input
                            placeholder="Curso (ej: 6to Sec)"
                            value={courseItem.name}
                            onChange={(event) => updateProfessorCourseField(index, 'name', event.target.value)}
                            required
                          />
                          <input
                            placeholder="Paralelo (ej: A)"
                            value={courseItem.parallel}
                            onChange={(event) => updateProfessorCourseField(index, 'parallel', event.target.value)}
                            required
                          />
                          <button type="button" className="inline-action-btn" onClick={() => removeProfessorCourseField(index)}>
                            Quitar
                          </button>
                        </div>
                      ))}
                      <button type="button" className="inline-action-btn" onClick={addProfessorCourseField}>
                        Agregar curso
                      </button>
                    </div>
                    <input
                      type="password"
                      placeholder="Contrasena"
                      value={professorForm.password}
                      onChange={(event) =>
                        setProfessorForm((prev) => ({ ...prev, password: event.target.value }))
                      }
                      required
                    />
                    <button type="submit">Guardar profesor</button>
                  </form>
                )}
              </article>

              <article className="panel-card students-card">
                <h3>Profesores registrados</h3>
                {loadingProfessors ? <p>Cargando profesores...</p> : null}
                {!loadingProfessors && professors.length === 0 ? <p>No hay profesores registrados.</p> : null}
                {!loadingProfessors && professors.length > 0 ? (
                  <div className="students-table-wrap">
                    <table className="students-table">
                      <thead>
                        <tr>
                          <th>Codigo</th>
                          <th>Nombre</th>
                          <th>Cursos asignados</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {professors.map((professor) => (
                          <tr key={professor.id}>
                            <td>{professor.employee_code}</td>
                            <td>{professor.full_name}</td>
                            <td>
                              {professor.assigned_courses?.length > 0
                                ? professor.assigned_courses.slice(0, 2).map((course) => course.label).join(', ')
                                : 'Sin curso'}
                              {professor.assigned_courses?.length > 2 ? ` +${professor.assigned_courses.length - 2}` : ''}
                            </td>
                            <td className="row-actions-cell">
                              <div className="row-actions">
                                <button
                                  type="button"
                                  className="action-icon-btn"
                                  title="Ver cursos"
                                  aria-label="Ver cursos"
                                  onClick={() => setViewingProfessorCourses(professor)}
                                >
                                  <Eye size={15} />
                                </button>
                                <button
                                  type="button"
                                  className="action-icon-btn"
                                  title="Editar profesor"
                                  aria-label="Editar profesor"
                                  onClick={() => openEditProfessor(professor)}
                                >
                                  <SquarePen size={15} />
                                </button>
                                <button
                                  type="button"
                                  className="action-icon-btn"
                                  title="Gestionar cursos"
                                  aria-label="Gestionar cursos"
                                  onClick={() => openAssignCourse(professor)}
                                >
                                  <BookPlus size={15} />
                                </button>
                                <button
                                  type="button"
                                  className="action-icon-btn danger"
                                  title="Eliminar profesor"
                                  aria-label="Eliminar profesor"
                                  onClick={() => setPendingDeleteProfessor(professor)}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </article>
            </>
          ) : null}

          {isSchedulesMenu && !isProfessorRole ? (
            <>
              <article className="panel-card">
                <h3>⏰ {editingShift ? 'Editar Horario' : 'Crear Nuevo Horario'}</h3>
                <p>Configura los turnos del colegio para el registro automático de asistencias.</p>
                <form onSubmit={editingShift ? updateShift : createShift}>
                  <select
                    value={shiftForm.shift_type}
                    onChange={(e) => setShiftForm({ ...shiftForm, shift_type: e.target.value })}
                    required
                    disabled={editingShift !== null}
                  >
                    <option value="">Seleccionar turno</option>
                    <option value="MORNING">Mañana</option>
                    <option value="AFTERNOON">Tarde</option>
                  </select>
                  <input
                    type="time"
                    placeholder="Hora de inicio"
                    value={shiftForm.start_time}
                    onChange={(e) => setShiftForm({ ...shiftForm, start_time: e.target.value })}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Tolerancia presente (minutos)"
                    value={shiftForm.tolerance_minutes}
                    onChange={(e) => setShiftForm({ ...shiftForm, tolerance_minutes: parseInt(e.target.value) || 0 })}
                    required
                    min="0"
                    max="60"
                  />
                  <input
                    type="number"
                    placeholder="Tolerancia tarde (minutos)"
                    value={shiftForm.late_minutes}
                    onChange={(e) => setShiftForm({ ...shiftForm, late_minutes: parseInt(e.target.value) || 0 })}
                    required
                    min="0"
                    max="120"
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <input
                      type="checkbox"
                      checked={shiftForm.is_active}
                      onChange={(e) => setShiftForm({ ...shiftForm, is_active: e.target.checked })}
                    />
                    <span>Activo</span>
                  </label>
                  <div className="quick-actions">
                    <button type="submit">
                      {editingShift ? '💾 Guardar cambios' : '➕ Crear horario'}
                    </button>
                    {editingShift ? (
                      <button type="button" className="ghost-btn" onClick={cancelEditShift}>
                        Cancelar
                      </button>
                    ) : null}
                  </div>
                </form>
                {shiftMessage ? <p className="message">{shiftMessage}</p> : null}
              </article>

              <article className="panel-card students-card">
                <h3>📋 Horarios configurados</h3>
                <div className="quick-actions">
                  <button type="button" onClick={loadShifts}>🔄 Actualizar</button>
                </div>
                {loadingShifts ? <p>Cargando horarios...</p> : null}
                {!loadingShifts && shifts.length === 0 ? (
                  <p>No hay horarios configurados. Crea los turnos Mañana y Tarde.</p>
                ) : null}
                {!loadingShifts && shifts.length > 0 ? (
                  <div className="students-table-wrap">
                    <table className="students-table" style={{ minWidth: '950px', tableLayout: 'auto' }}>
                      <thead>
                        <tr>
                          <th style={{ minWidth: '120px' }}>🏷️ Turno</th>
                          <th style={{ minWidth: '100px' }}>🕐 Inicio</th>
                          <th style={{ minWidth: '130px' }}>✅ Presente</th>
                          <th style={{ minWidth: '120px' }}>⏰ Tarde</th>
                          <th style={{ minWidth: '130px' }}>📊 Ventana</th>
                          <th style={{ minWidth: '110px', textAlign: 'center' }}>🔋 Estado</th>
                          <th style={{ minWidth: '140px', textAlign: 'center' }}>⚙️ Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shifts.map((shift) => (
                          <tr key={`shift-${shift.id}`}>
                            <td style={{ minWidth: '120px' }}>
                              <strong style={{
                                backgroundColor: shift.shift_type === 'MORNING' ? '#fef3c7' : '#dbeafe',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                color: shift.shift_type === 'MORNING' ? '#92400e' : '#1e40af'
                              }}>
                                {shift.shift_type_display}
                              </strong>
                            </td>
                            <td style={{ minWidth: '100px' }}>{shift.start_time}</td>
                            <td style={{ minWidth: '130px' }}>{shift.present_until} <small>(+{shift.tolerance_minutes}m)</small></td>
                            <td style={{ minWidth: '120px' }}>{shift.late_until} <small>(+{shift.late_minutes}m)</small></td>
                            <td style={{ minWidth: '130px' }}>{shift.time_window_display}</td>
                            <td style={{ textAlign: 'center', minWidth: '110px' }}>
                              {shift.is_active ? (
                                <span style={{
                                  backgroundColor: '#d4edda',
                                  color: '#155724',
                                  padding: '4px 12px',
                                  borderRadius: '12px',
                                  fontSize: '0.85rem',
                                  fontWeight: '600',
                                  display: 'inline-block',
                                  border: '1px solid #c3e6cb'
                                }}>
                                  ✓ Activo
                                </span>
                              ) : (
                                <span style={{
                                  backgroundColor: '#f8f9fa',
                                  color: '#6c757d',
                                  padding: '4px 12px',
                                  borderRadius: '12px',
                                  fontSize: '0.85rem',
                                  fontWeight: '600',
                                  display: 'inline-block',
                                  border: '1px solid #dee2e6'
                                }}>
                                  ✗ Inactivo
                                </span>
                              )}
                            </td>
                            <td style={{ textAlign: 'center', minWidth: '140px', padding: '0.75rem' }}>
                              <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '10px'
                              }}>
                                <button
                                  type="button"
                                  className="shift-action-btn shift-edit-btn"
                                  onClick={() => startEditShift(shift)}
                                  aria-label={`Editar horario ${shift.shift_type_display}`}
                                >
                                  <SquarePen size={18} />
                                </button>
                                <button
                                  type="button"
                                  className="shift-action-btn shift-delete-btn"
                                  onClick={() => confirmDeleteShift(shift)}
                                  aria-label={`Eliminar horario ${shift.shift_type_display}`}
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
                
                <div className="info-box" style={{
                  backgroundColor: '#fef3c7',
                  border: '1px solid #fde68a',
                  borderRadius: '8px',
                  padding: '16px',
                  marginTop: '16px'
                }}>
                  <h4 style={{ marginTop: 0, color: '#78350f' }}>📚 Horarios del Colegio</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <strong>🌅 MAÑANA</strong>
                      <ul style={{ margin: '8px 0', paddingLeft: '20px', fontSize: '14px' }}>
                        <li>Ingreso: 7:30</li>
                        <li>1er periodo: 7:30 - 9:00</li>
                        <li>2do periodo: 9:20 - 11:00</li>
                        <li>3er periodo: 11:10 - 12:00</li>
                      </ul>
                    </div>
                    <div>
                      <strong>🌆 TARDE</strong>
                      <ul style={{ margin: '8px 0', paddingLeft: '20px', fontSize: '14px' }}>
                        <li>Ingreso: 14:00</li>
                        <li>1er periodo: 14:00 - 15:20</li>
                        <li>2do periodo: 15:30 - 16:40</li>
                        <li>3er periodo: 17:00 - 18:20</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </article>
            </>
          ) : null}

          {!isDashboardMenu && !isStudentsMenu && !isProfessorsMenu && !isScannerMenu && !isCoursesMenu && !isSchedulesMenu && !isAttendanceMenu && !isEventsMenu && !isReportsMenu ? (
            <article className="panel-card placeholder-card">
              <h3>Modulo en construccion</h3>
              <p>
                Esta seccion estara disponible pronto. Mientras tanto puedes usar Estudiantes, Profesores y QR y Escaner.
              </p>
            </article>
          ) : null}
        </section>
      </section>

      {pendingRemovalStudent ? (
        <div className="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-remove-title">
          <div className="confirm-modal">
            <button
              type="button"
              className="confirm-close"
              onClick={cancelRemoveStudentFromCourse}
              aria-label="Cerrar confirmacion"
            >
              <X size={15} />
            </button>

            <p className="confirm-kicker">Confirmar accion</p>
            <h3 id="confirm-remove-title">Quitar estudiante del curso</h3>
            <p>
              Vas a retirar a <strong>{pendingRemovalStudent.full_name}</strong> del curso activo.
            </p>
            <div className="confirm-actions">
              <button type="button" className="ghost-btn" onClick={cancelRemoveStudentFromCourse} disabled={isRemovingStudent}>
                Cancelar
              </button>
              <button
                type="button"
                className="danger-btn"
                onClick={confirmRemoveStudentFromCourse}
                disabled={isRemovingStudent}
              >
                {isRemovingStudent ? 'Quitando...' : 'Quitar'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editingProfessor ? (
        <div className="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="edit-professor-title">
          <div className="confirm-modal form-modal">
            <button type="button" className="confirm-close" onClick={closeEditProfessor} aria-label="Cerrar edicion">
              <X size={15} />
            </button>
            <p className="confirm-kicker">Gestion de profesor</p>
            <h3 id="edit-professor-title">Editar profesor</h3>
            <form onSubmit={submitEditProfessor}>
              <input
                placeholder="Nombre"
                value={editProfessorForm.first_name}
                onChange={(event) => setEditProfessorForm((prev) => ({ ...prev, first_name: event.target.value }))}
                required
              />
              <input
                placeholder="Apellido"
                value={editProfessorForm.last_name}
                onChange={(event) => setEditProfessorForm((prev) => ({ ...prev, last_name: event.target.value }))}
                required
              />
              <input
                placeholder="Correo"
                value={editProfessorForm.email}
                onChange={(event) => setEditProfessorForm((prev) => ({ ...prev, email: event.target.value }))}
              />
              <input
                placeholder="Codigo de empleado"
                value={editProfessorForm.employee_code}
                onChange={(event) => setEditProfessorForm((prev) => ({ ...prev, employee_code: event.target.value }))}
                required
              />
              <input
                type="password"
                placeholder="Nueva contrasena (opcional)"
                value={editProfessorForm.password}
                onChange={(event) => setEditProfessorForm((prev) => ({ ...prev, password: event.target.value }))}
              />
              <div className="confirm-actions">
                <button type="button" className="ghost-btn" onClick={closeEditProfessor}>Cancelar</button>
                <button type="submit">Guardar cambios</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {assigningProfessor ? (
        <div className="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="assign-course-title">
          <div className="confirm-modal form-modal">
            <button type="button" className="confirm-close" onClick={closeAssignCourse} aria-label="Cerrar asignacion">
              <X size={15} />
            </button>
            <p className="confirm-kicker">Gestion integral de cursos</p>
            <h3 id="assign-course-title">Cursos de {assigningProfessor.full_name}</h3>
            <form onSubmit={submitAssignCourse}>
              <input
                placeholder="Nombre del curso"
                value={assignCourseForm.course_name}
                onChange={(event) => setAssignCourseForm((prev) => ({ ...prev, course_name: event.target.value }))}
                required
              />
              <input
                placeholder="Paralelo"
                value={assignCourseForm.course_parallel}
                onChange={(event) => setAssignCourseForm((prev) => ({ ...prev, course_parallel: event.target.value }))}
                required
              />
              <div className="confirm-actions">
                <button type="button" className="ghost-btn" onClick={closeAssignCourse}>Cerrar</button>
                <button type="submit">Agregar curso</button>
              </div>
            </form>

            {assigningProfessor.assigned_courses?.length > 0 ? (
              <div className="assigned-courses-manager">
                <h4>Cursos asignados actualmente</h4>
                <div className="assigned-courses-toolbar">
                  <input
                    className="assigned-courses-search"
                    placeholder="Buscar curso o paralelo"
                    value={assignCourseSearchInput}
                    onChange={(event) => {
                      setAssignCourseSearchInput(event.target.value)
                      setAssignCoursePage(1)
                    }}
                  />
                  <select
                    className="assigned-courses-sort"
                    value={assignCourseSortBy}
                    onChange={(event) => {
                      setAssignCourseSortBy(event.target.value)
                      setAssignCoursePage(1)
                    }}
                  >
                    <option value="name-asc">Nombre A-Z</option>
                    <option value="name-desc">Nombre Z-A</option>
                    <option value="parallel-asc">Paralelo A-Z</option>
                    <option value="parallel-desc">Paralelo Z-A</option>
                    <option value="recent">Mas recientes</option>
                  </select>
                </div>
                <small className="assigned-courses-meta">
                  {filteredAssignedCourses.length} curso(s) encontrados
                </small>
                <div className="students-table-wrap">
                  <table className="students-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Curso</th>
                        <th>Paralelo</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedAssignedCourses.map((course) => (
                        assignCourseEditingId === course.id ? (
                          <tr key={`manage-course-edit-${course.id}`}>
                            <td>{course.id}</td>
                            <td>
                              <input
                                value={assignCourseEditForm.course_name}
                                onChange={(event) =>
                                  setAssignCourseEditForm((prev) => ({ ...prev, course_name: event.target.value }))
                                }
                                required
                              />
                            </td>
                            <td>
                              <input
                                value={assignCourseEditForm.course_parallel}
                                onChange={(event) =>
                                  setAssignCourseEditForm((prev) => ({ ...prev, course_parallel: event.target.value }))
                                }
                                required
                              />
                            </td>
                            <td>
                              <div className="row-actions row-actions-static">
                                <button type="button" className="inline-action-btn" onClick={submitEditAssignedCourse}>
                                  Guardar
                                </button>
                                <button type="button" className="ghost-btn inline-action-btn" onClick={cancelEditAssignedCourse}>
                                  Cancelar
                                </button>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          <tr key={`manage-course-${course.id}`}>
                            <td>{course.id}</td>
                            <td>{highlightSearchMatch(course.name)}</td>
                            <td>{highlightSearchMatch(course.parallel)}</td>
                            <td className="row-actions-cell">
                              <div className="row-actions">
                                <button
                                  type="button"
                                  className="action-icon-btn"
                                  title="Editar curso"
                                  aria-label="Editar curso"
                                  onClick={() => startEditAssignedCourse(course)}
                                >
                                  <SquarePen size={15} />
                                </button>
                                <button
                                  type="button"
                                  className="action-icon-btn danger"
                                  title="Eliminar curso"
                                  aria-label="Eliminar curso"
                                  onClick={() => deleteAssignedCourse(course)}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredAssignedCourses.length > assignedCoursesPageSize ? (
                  <div className="assigned-courses-pagination">
                    <button
                      type="button"
                      className="ghost-btn inline-action-btn"
                      onClick={() => setAssignCoursePage((prev) => Math.max(1, prev - 1))}
                      disabled={assignCourseSafePage <= 1}
                    >
                      Anterior
                    </button>
                    <span>Pagina {assignCourseSafePage} de {assignCourseTotalPages}</span>
                    <button
                      type="button"
                      className="ghost-btn inline-action-btn"
                      onClick={() => setAssignCoursePage((prev) => Math.min(assignCourseTotalPages, prev + 1))}
                      disabled={assignCourseSafePage >= assignCourseTotalPages}
                    >
                      Siguiente
                    </button>
                  </div>
                ) : null}
                {filteredAssignedCourses.length === 0 ? <p>No hay cursos que coincidan con la busqueda.</p> : null}
              </div>
            ) : (
              <p>Este profesor aun no tiene cursos asignados.</p>
            )}
          </div>
        </div>
      ) : null}

      {pendingDeleteAssignedCourse ? (
        <div className="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-assigned-course-title">
          <div className="confirm-modal">
            <button
              type="button"
              className="confirm-close"
              onClick={cancelDeleteAssignedCourse}
              aria-label="Cerrar confirmacion"
            >
              <X size={15} />
            </button>
            <p className="confirm-kicker">Confirmar eliminacion</p>
            <h3 id="delete-assigned-course-title">Eliminar curso asignado</h3>
            <p>
              Se eliminara el curso <strong>{pendingDeleteAssignedCourse.label}</strong> del profesor{' '}
              <strong>{assigningProfessor?.full_name}</strong>.
            </p>
            <div className="confirm-actions">
              <button type="button" className="ghost-btn" onClick={cancelDeleteAssignedCourse}>
                Cancelar
              </button>
              <button type="button" className="danger-btn" onClick={confirmDeleteAssignedCourse}>
                Eliminar curso
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingDeleteAdminCourse ? (
        <div className="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-admin-course-title">
          <div className="confirm-modal">
            <button
              type="button"
              className="confirm-close"
              onClick={cancelDeleteAdminCourse}
              aria-label="Cerrar confirmacion"
            >
              <X size={15} />
            </button>
            <p className="confirm-kicker">Accion irreversible</p>
            <h3 id="delete-admin-course-title">Eliminar curso institucional</h3>
            <p>
              Se eliminara el curso <strong>{pendingDeleteAdminCourse.label}</strong> del sistema.
            </p>
            <div className="confirm-actions">
              <button type="button" className="ghost-btn" onClick={cancelDeleteAdminCourse}>
                Cancelar
              </button>
              <button type="button" className="danger-btn" onClick={confirmDeleteAdminCourse}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ...existing code... */}
      {pendingCourseSwitch ? (
        <div className="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="switch-course-title">
          <div className="confirm-modal">
            <button
              type="button"
              className="confirm-close"
              onClick={closeCourseSwitchModal}
              aria-label="Cerrar cambio de curso"
            >
              <X size={15} />
            </button>
            <p className="confirm-kicker">Cambio de contexto</p>
            <h3 id="switch-course-title">Cambiar curso activo</h3>
            <p>
              Cambiaras de <strong>{pendingCourseSwitch.currentLabel}</strong> a{' '}
              <strong>{pendingCourseSwitch.nextLabel}</strong>.
            </p>
            <div className="confirm-actions">
              <button type="button" className="ghost-btn" onClick={closeCourseSwitchModal}>
                Cancelar
              </button>
              <button type="button" className="ghost-btn" onClick={() => confirmCourseSwitch({ resetDraft: false })}>
                Cambiar y conservar
              </button>
              <button type="button" onClick={() => confirmCourseSwitch({ resetDraft: true })}>
                Cambiar y limpiar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal para eliminar periodos/turnos */}
      {modalDeleteShift.open && modalDeleteShift.shift ? (
        <div className="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-shift-title">
          <div className="confirm-modal">
            <button
              type="button"
              className="confirm-close"
              onClick={handleModalDeleteCancel}
              aria-label="Cerrar confirmación"
            >
              <X size={15} />
            </button>
            <p className="confirm-kicker">Confirmar eliminación</p>
            <h3 id="delete-shift-title">Eliminar periodo</h3>
            <p>
              ¿Seguro que deseas eliminar el periodo <strong>{modalDeleteShift.shift.shift_type_display || modalDeleteShift.shift.shift_type}</strong>?
            </p>
            <div className="confirm-actions">
              <button type="button" className="ghost-btn" onClick={handleModalDeleteCancel}>
                Cancelar
              </button>
              <button type="button" className="danger-btn" onClick={handleModalDeleteConfirm}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editingAdminCourse ? (
        <div className="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="edit-admin-course-title">
          <div className="confirm-modal form-modal">
            <button
              type="button"
              className="confirm-close"
              onClick={cancelEditAdminCourse}
              aria-label="Cerrar edicion de curso"
            >
              <X size={15} />
            </button>
            <p className="confirm-kicker">Edicion de curso</p>
            <h3 id="edit-admin-course-title">Editar curso institucional</h3>
            <form onSubmit={submitEditAdminCourse}>
              <input
                placeholder="Nombre del curso"
                value={adminCourseEditForm.name}
                onChange={(event) => setAdminCourseEditForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
              <input
                placeholder="Paralelo"
                value={adminCourseEditForm.parallel}
                onChange={(event) => setAdminCourseEditForm((prev) => ({ ...prev, parallel: event.target.value }))}
                required
              />
              <div className="confirm-actions">
                <button type="button" className="ghost-btn" onClick={cancelEditAdminCourse}>Cancelar</button>
                <button type="submit">Guardar cambios</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {pendingDeleteProfessor ? (
        <div className="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-professor-title">
          <div className="confirm-modal">
            <button
              type="button"
              className="confirm-close"
              onClick={() => setPendingDeleteProfessor(null)}
              aria-label="Cerrar confirmacion"
            >
              <X size={15} />
            </button>
            <p className="confirm-kicker">Accion irreversible</p>
            <h3 id="delete-professor-title">Eliminar profesor</h3>
            <p>
              Se eliminara al profesor <strong>{pendingDeleteProfessor.full_name}</strong> junto a su acceso.
            </p>
            <div className="confirm-actions">
              <button type="button" className="ghost-btn" onClick={() => setPendingDeleteProfessor(null)}>
                Cancelar
              </button>
              <button type="button" className="danger-btn" onClick={confirmDeleteProfessor}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {viewingProfessorCourses ? (
        <div className="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="view-courses-title">
          <div className="confirm-modal form-modal">
            <button
              type="button"
              className="confirm-close"
              onClick={() => setViewingProfessorCourses(null)}
              aria-label="Cerrar cursos"
            >
              <X size={15} />
            </button>
            <p className="confirm-kicker">Cursos asignados</p>
            <h3 id="view-courses-title">{viewingProfessorCourses.full_name}</h3>
            {viewingProfessorCourses.assigned_courses?.length > 0 ? (
              <div className="students-table-wrap">
                <table className="students-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Curso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingProfessorCourses.assigned_courses.map((course) => (
                      <tr key={`prof-course-${course.id}`}>
                        <td>{course.id}</td>
                        <td>{course.label}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>Este profesor aun no tiene cursos asignados.</p>
            )}
            <div className="confirm-actions">
              <button type="button" className="ghost-btn" onClick={() => setViewingProfessorCourses(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {viewingStudent ? (
        <div className="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="view-student-title">
          <div className="confirm-modal form-modal">
            <button
              type="button"
              className="confirm-close"
              onClick={() => setViewingStudent(null)}
              aria-label="Cerrar detalles"
            >
              <X size={15} />
            </button>
            <p className="confirm-kicker">Detalles del estudiante</p>
            <h3 id="view-student-title">{viewingStudent.full_name}</h3>
            <div className="student-details">
              <p><strong>CI:</strong> {viewingStudent.ci}</p>
              <p><strong>Nombre:</strong> {viewingStudent.full_name}</p>
              <p><strong>Curso:</strong> {viewingStudent.course_name || 'No asignado'}</p>
            </div>
            <div className="confirm-actions">
              <button type="button" className="ghost-btn" onClick={() => setViewingStudent(null)}>
                Cerrar
              </button>
              <button type="button" className="inline-action-btn" onClick={() => {
                openEditStudent(viewingStudent)
                setViewingStudent(null)
              }}>
                Editar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editingStudent ? (
        <div className="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="edit-student-title">
          <div className="confirm-modal form-modal">
            <button type="button" className="confirm-close" onClick={closeEditStudent} aria-label="Cerrar edicion">
              <X size={15} />
            </button>
            <p className="confirm-kicker">Gestion de estudiante</p>
            <h3 id="edit-student-title">Editar estudiante</h3>
            <form onSubmit={submitEditStudent}>
              <input
                placeholder="CI"
                value={editStudentForm.ci}
                onChange={(event) => setEditStudentForm((prev) => ({ ...prev, ci: event.target.value }))}
                required
              />
              <input
                placeholder="Nombre completo"
                value={editStudentForm.full_name}
                onChange={(event) => setEditStudentForm((prev) => ({ ...prev, full_name: event.target.value }))}
                required
              />
              <input
                placeholder="Curso"
                value={editStudentForm.course_name}
                onChange={(event) => setEditStudentForm((prev) => ({ ...prev, course_name: event.target.value }))}
                required
              />
              <div className="confirm-actions">
                <button type="button" className="ghost-btn" onClick={closeEditStudent}>Cancelar</button>
                <button type="submit">Guardar cambios</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showStudentSavedModal ? (
        <div className="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="student-saved-title">
          <div className="confirm-modal" style={{textAlign: 'center'}}>
            <button
              type="button"
              className="confirm-close"
              onClick={() => setShowStudentSavedModal(false)}
              aria-label="Cerrar"
            >
              <X size={15} />
            </button>
            <div style={{fontSize: '48px', marginBottom: '10px'}}>✅</div>
            <h3 id="student-saved-title" style={{color: '#16a765'}}>¡Guardado Exitoso!</h3>
            <p style={{margin: '15px 0'}}>
              Los datos del estudiante se han actualizado correctamente.
            </p>
            <div className="confirm-actions">
              <button 
                type="button" 
                className="primary-btn" 
                onClick={() => setShowStudentSavedModal(false)}
                style={{background: '#16a765', width: '100%'}}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingDeleteStudent ? (
        <div className="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-student-title">
          <div className="confirm-modal">
            <button
              type="button"
              className="confirm-close"
              onClick={() => setPendingDeleteStudent(null)}
              aria-label="Cerrar confirmacion"
            >
              <X size={15} />
            </button>
            <p className="confirm-kicker">Accion irreversible</p>
            <h3 id="delete-student-title">Eliminar estudiante</h3>
            <p>
              Se eliminara al estudiante <strong>{pendingDeleteStudent.full_name}</strong> del sistema.
            </p>
            <div className="confirm-actions">
              <button type="button" className="ghost-btn" onClick={() => setPendingDeleteStudent(null)}>
                Cancelar
              </button>
              <button type="button" className="danger-btn" onClick={confirmDeleteStudent}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editingShift ? (
        <div className="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="edit-shift-title">
          <div className="confirm-modal">
            <button
              type="button"
              className="confirm-close"
              onClick={() => setEditingShift(null)}
              aria-label="Cerrar edicion"
            >
              <X size={15} />
            </button>
            <p className="confirm-kicker">Configuración de turnos</p>
            <h3 id="edit-shift-title">Editar turno</h3>
            <p>Configuración de turno: {editingShift?.shift_type_display}</p>
            <div className="confirm-actions">
              <button type="button" className="ghost-btn" onClick={() => setEditingShift(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      ) : null}

      {showCredentialsModal ? (
        <div className="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="credentials-success-title">
          <div className="confirm-modal" style={{textAlign: 'center'}}>
            <button
              type="button"
              className="confirm-close"
              onClick={() => setShowCredentialsModal(false)}
              aria-label="Cerrar"
            >
              <X size={15} />
            </button>
            <div style={{fontSize: '48px', marginBottom: '10px'}}>✅</div>
            <h3 id="credentials-success-title" style={{color: '#16a765'}}>¡Descarga Completa!</h3>
            <p style={{margin: '15px 0'}}>
              Las credenciales se han generado exitosamente y la descarga se ha completado.
            </p>
            <p style={{fontSize: '14px', color: '#666'}}>
              Revise su carpeta de descargas para encontrar el archivo PDF.
            </p>
            <div className="confirm-actions">
              <button 
                type="button" 
                className="primary-btn" 
                onClick={() => setShowCredentialsModal(false)}
                style={{background: '#16a765', width: '100%'}}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
    </div>
  )
}
export default App
