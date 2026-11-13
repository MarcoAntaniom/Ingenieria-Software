import { useState, useMemo, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { Drawer } from './ui/Drawer'
import { useLanguage } from '../contexts/LanguageContext'

export function CalendarView({
  events = [],
  onNavigateToCourse,
  onNavigateToTasks,
  onNavigateToMaterials,
}) {
  const { t, language } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const [filterType, setFilterType] = useState('all') // 'all' | 'assignment' | 'evaluation' | 'class' | 'institutional'
  const [viewMode, setViewMode] = useState('agenda') // 'agenda' | 'month'

  // Motor de calendario anual 2026: Estado de navegación para los 12 meses
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 10, 1)) // Noviembre 2026 por defecto

  const activeYear = currentDate.getFullYear()
  const activeMonth = currentDate.getMonth() // 0 a 11

  // Nombres de los 12 meses (soporte i18n para es-CL, en-US y arn)
  const monthNames = useMemo(() => {
    return [
      t('calendar.months.0'),
      t('calendar.months.1'),
      t('calendar.months.2'),
      t('calendar.months.3'),
      t('calendar.months.4'),
      t('calendar.months.5'),
      t('calendar.months.6'),
      t('calendar.months.7'),
      t('calendar.months.8'),
      t('calendar.months.9'),
      t('calendar.months.10'),
      t('calendar.months.11'),
    ]
  }, [t])

  const currentMonthName = useMemo(() => {
    const raw = monthNames[activeMonth]
    if (raw && !raw.startsWith('calendar.')) return raw
    return new Date(activeYear, activeMonth, 1).toLocaleDateString(
      language === 'en' ? 'en-US' : 'es-CL',
      { month: 'long' }
    )
  }, [monthNames, activeMonth, activeYear, language])

  // Días de la semana localizados (Lunes a Domingo)
  const weekDays = useMemo(() => {
    return [
      t('calendar.short_days.0') !== 'calendar.short_days.0' ? t('calendar.short_days.0') : 'Lun',
      t('calendar.short_days.1') !== 'calendar.short_days.1' ? t('calendar.short_days.1') : 'Mar',
      t('calendar.short_days.2') !== 'calendar.short_days.2' ? t('calendar.short_days.2') : 'Mié',
      t('calendar.short_days.3') !== 'calendar.short_days.3' ? t('calendar.short_days.3') : 'Jue',
      t('calendar.short_days.4') !== 'calendar.short_days.4' ? t('calendar.short_days.4') : 'Vie',
      t('calendar.short_days.5') !== 'calendar.short_days.5' ? t('calendar.short_days.5') : 'Sáb',
      t('calendar.short_days.6') !== 'calendar.short_days.6' ? t('calendar.short_days.6') : 'Dom',
    ]
  }, [t])

  // Mapeo por ciclo semestral según el mes visualizado:
  // - Semestre Otoño (Marzo a Junio / Mes 2 a 5)
  // - Receso Intersemestral / Vacaciones de Invierno (Julio / Mes 6)
  // - Semestre Primavera (Agosto a Diciembre / Mes 7 a 11)
  // - Periodo de Verano / Cierre Anual (Enero a Febrero / Mes 0 a 1)
  const semesterInfo = useMemo(() => {
    if (activeMonth === 0 || activeMonth === 1) {
      return {
        id: 'summer',
        label: t('calendar.semesters.summer'),
        isCurrent: false,
        badgeStyle:
          'bg-amber-50 dark:bg-[#422C0A] [data-theme=contrast]_&:bg-black text-amber-800 dark:text-[#FCD34D] [data-theme=contrast]_&:text-[#FFE600] border-amber-300 dark:border-[#78350F] [data-theme=contrast]_&:border-[#FFE600]',
        icon: 'sunny',
      }
    }
    if (activeMonth >= 2 && activeMonth <= 5) {
      return {
        id: 'autumn',
        label: t('calendar.semesters.autumn'),
        isCurrent: false,
        badgeStyle:
          'bg-orange-50 dark:bg-[#3D2314] [data-theme=contrast]_&:bg-black text-orange-800 dark:text-[#FDBA74] [data-theme=contrast]_&:text-[#FF8A00] border-orange-300 dark:border-[#9A3412] [data-theme=contrast]_&:border-[#FF8A00]',
        icon: 'eco',
      }
    }
    if (activeMonth === 6) {
      return {
        id: 'winter_recess',
        label: t('calendar.semesters.winter_recess'),
        isCurrent: false,
        badgeStyle:
          'bg-purple-50 dark:bg-[#2E1A47] [data-theme=contrast]_&:bg-black text-purple-800 dark:text-[#D8B4FE] [data-theme=contrast]_&:text-[#D8B4FE] border-purple-300 dark:border-[#6B21A8] [data-theme=contrast]_&:border-[#D8B4FE]',
        icon: 'ac_unit',
      }
    }
    // Semestre Primavera (Agosto a Diciembre)
    const isCurrentActive = activeYear === 2026 && activeMonth === 10 // Noviembre 2026 es el periodo en curso
    return {
      id: 'spring',
      label: t('calendar.semesters.spring'),
      isCurrent: isCurrentActive,
      badgeStyle:
        'bg-sky-50 dark:bg-[#102F46] [data-theme=contrast]_&:bg-black text-[#0B5575] dark:text-[#67E8F9] [data-theme=contrast]_&:text-[#00B7FF] border-sky-300 dark:border-[#155E75] [data-theme=contrast]_&:border-[#00B7FF]',
      icon: 'local_florist',
    }
  }, [activeMonth, activeYear, t])

  // Navegación mensual fluida
  function handlePrevMonth() {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  function handleNextMonth() {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  function handleSelectMonth(e) {
    const monthIndex = Number(e.target.value)
    setCurrentDate(new Date(activeYear, monthIndex, 1))
  }

  function handleToday() {
    setCurrentDate(new Date(2026, 10, 1))
  }

  // El evento seleccionado se sincroniza con la URL: ?vista=calendar&evento=ev-123
  const eventIdParam = searchParams.get('evento')
  const selectedEvent = useMemo(() => {
    return events.find((e) => e.id === eventIdParam) || null
  }, [events, eventIdParam])

  // Guarda referencia del botón disparador para restaurar el foco al cerrar
  const lastTriggerRef = useRef(null)

  function handleOpenEvent(ev, triggerElement) {
    if (triggerElement) {
      lastTriggerRef.current = triggerElement
    }
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('evento', ev.id)
      return next
    })
  }

  function handleCloseEvent() {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('evento')
      return next
    })
    setTimeout(() => {
      if (lastTriggerRef.current?.focus) {
        lastTriggerRef.current.focus()
      }
    }, 50)
  }

  // Filtrado de eventos por tipo y por mes activo
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      // Filtrar por el mes activo
      if (ev.date) {
        const [y, m] = ev.date.split('-').map(Number)
        if (y !== activeYear || m !== activeMonth + 1) {
          return false
        }
      }

      if (filterType === 'all') return true
      if (filterType === 'assignment') return ev.type === 'assignment' || ev.type === 'deadline'
      if (filterType === 'evaluation') return ev.type === 'evaluation' || ev.type === 'milestone'
      return ev.type === filterType
    })
  }, [events, filterType, activeYear, activeMonth])

  // Agrupación de eventos por fecha para la vista de lista
  const groupedEvents = useMemo(() => {
    const groups = {}
    const sorted = [...filteredEvents].sort((a, b) => new Date(a.date) - new Date(b.date))

    sorted.forEach((ev) => {
      if (!groups[ev.date]) {
        groups[ev.date] = []
      }
      groups[ev.date].push(ev)
    })
    return groups
  }, [filteredEvents])

  // Cuadrícula mensual dinámica (días del mes, desfase inicial de lunes y relleno final)
  const { daysInMonth, firstDayOffset, monthDays, trailingBlanks } = useMemo(() => {
    const daysCount = new Date(activeYear, activeMonth + 1, 0).getDate()
    // Lunes = 0, Domingo = 6
    const offset = (new Date(activeYear, activeMonth, 1).getDay() + 6) % 7
    const days = Array.from({ length: daysCount }, (_, i) => i + 1)
    const trailing = (7 - ((offset + daysCount) % 7)) % 7
    return {
      daysInMonth: daysCount,
      firstDayOffset: offset,
      monthDays: days,
      trailingBlanks: trailing,
    }
  }, [activeYear, activeMonth])

  // Estilos accesibles según tipo de evento (WCAG AA - Paletas de color adaptadas)
  function getTypeStyles(type) {
    switch (type) {
      case 'class':
        return {
          label: t('calendar.filter_classes'),
          code: 'CLS',
          bg: 'bg-[#EFF8FB] dark:bg-[#102F46] [data-theme=contrast]_&:bg-[#0D0D0D]',
          border: 'border-[#BAE6FD] dark:border-[#155E75] [data-theme=contrast]_&:border-[#00B7FF]',
          text: 'text-[#0B5575] dark:text-[#67E8F9] [data-theme=contrast]_&:text-[#00B7FF]',
          dot: 'bg-[#0B5575] dark:bg-[#67E8F9] [data-theme=contrast]_&:bg-[#00B7FF]',
          icon: 'school',
        }
      case 'assignment':
        return {
          label: t('calendar.filter_assignments'),
          code: 'ACT',
          bg: 'bg-[#ECFDF3] dark:bg-[#123B30] [data-theme=contrast]_&:bg-[#0D0D0D]',
          border: 'border-[#A6F4C5] dark:border-[#0F766E] [data-theme=contrast]_&:border-[#00F084]',
          text: 'text-[#067647] dark:text-[#5EEAD4] [data-theme=contrast]_&:text-[#00F084]',
          dot: 'bg-[#087F78] dark:bg-[#5EEAD4] [data-theme=contrast]_&:bg-[#00F084]',
          icon: 'assignment',
        }
      case 'evaluation':
      case 'milestone':
        return {
          label: t('calendar.filter_evaluations'),
          code: 'EVL',
          bg: 'bg-[#FFFAEB] dark:bg-[#422C0A] [data-theme=contrast]_&:bg-[#0D0D0D]',
          border: 'border-[#FEDF89] dark:border-[#78350F] [data-theme=contrast]_&:border-[#FFE600]',
          text: 'text-[#B54708] dark:text-[#FCD34D] [data-theme=contrast]_&:text-[#FFE600]',
          dot: 'bg-[#B54708] dark:bg-[#FCD34D] [data-theme=contrast]_&:bg-[#FFE600]',
          icon: 'flag',
        }
      case 'deadline':
        return {
          label: 'Vencimiento',
          code: 'VNC',
          bg: 'bg-[#FEF3F2] dark:bg-[#46191D] [data-theme=contrast]_&:bg-[#0D0D0D]',
          border: 'border-[#FECDCA] dark:border-[#7F1D1D] [data-theme=contrast]_&:border-[#FF5A67]',
          text: 'text-[#B42318] dark:text-[#FCA5A5] [data-theme=contrast]_&:text-[#FF5A67]',
          dot: 'bg-[#B42318] dark:bg-[#FCA5A5] [data-theme=contrast]_&:bg-[#FF5A67]',
          icon: 'assignment_late',
        }
      case 'institutional':
      default:
        return {
          label: t('calendar.filter_institutional'),
          code: 'INS',
          bg: 'bg-[#F8FAFC] dark:bg-[#2E2450] [data-theme=contrast]_&:bg-[#0D0D0D]',
          border: 'border-[#E2E8F0] dark:border-[#5B21B6] [data-theme=contrast]_&:border-[#A6A6A6]',
          text: 'text-[#475569] dark:text-[#C4B5FD] [data-theme=contrast]_&:text-white',
          dot: 'bg-[#64748B] dark:bg-[#C4B5FD] [data-theme=contrast]_&:bg-[#C4B5FD]',
          icon: 'event',
        }
    }
  }

  // Formato de encabezado de fecha agrupado
  function formatGroupDate(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number)
    const dateObj = new Date(year, month - 1, day)
    const locale = language === 'en' ? 'en-US' : 'es-CL'
    const dayName = dateObj.toLocaleDateString(locale, { weekday: 'long' })
    const monthName = dateObj.toLocaleDateString(locale, { month: 'long' })
    return `${day} ${monthName.toUpperCase()} · ${dayName.toUpperCase()}`
  }

  return (
    <div className="space-y-6">
      {/* 1. Encabezado del Calendario y Switcher Independiente */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#E2E8F0] dark:border-[#2F4058] [data-theme=contrast]_&:border-white bg-white dark:bg-[#111827] [data-theme=contrast]_&:bg-[#0D0D0D] p-5 sm:p-6 shadow-xs md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2 text-[#0B5575] dark:text-[#67E8F9] [data-theme=contrast]_&:text-[#00B7FF]">
            <span className="material-symbols-outlined text-lg">calendar_month</span>
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {t('calendar.badge')}
            </span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-[26px] font-extrabold text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white tracking-tight">
            {t('calendar.title')}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#475569] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">
            {t('calendar.subtitle')}
          </p>
        </div>

        {/* Agrupación visual independiente para el switch [Lista] [Mensual] */}
        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
          <div className="inline-flex rounded-xl bg-[#F1F5F9] dark:bg-[#16243A] [data-theme=contrast]_&:bg-black p-1 border border-[#CBD5E1] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6]">
            <button
              aria-pressed={viewMode === 'agenda'}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5575] dark:focus-visible:ring-[#67E8F9] [data-theme=contrast]_&:focus-visible:ring-[#FFD400] ${
                viewMode === 'agenda'
                  ? 'bg-white dark:bg-[#111B2E] [data-theme=contrast]_&:bg-white [data-theme=contrast]_&:text-black text-[#0B5575] dark:text-[#67E8F9] shadow-xs'
                  : 'text-[#475569] dark:text-[#CBD5E1] [data-theme=contrast]_&:text-white hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
              }`}
              onClick={() => setViewMode('agenda')}
              type="button"
            >
              <span className="material-symbols-outlined text-base">view_agenda</span>
              {t('calendar.view_agenda')}
            </button>
            <button
              aria-pressed={viewMode === 'month'}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5575] dark:focus-visible:ring-[#67E8F9] [data-theme=contrast]_&:focus-visible:ring-[#FFD400] ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-[#111B2E] [data-theme=contrast]_&:bg-white [data-theme=contrast]_&:text-black text-[#0B5575] dark:text-[#67E8F9] shadow-xs'
                  : 'text-[#475569] dark:text-[#CBD5E1] [data-theme=contrast]_&:text-white hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
              }`}
              onClick={() => setViewMode('month')}
              type="button"
            >
              <span className="material-symbols-outlined text-base">calendar_view_month</span>
              {t('calendar.view_month')}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Barra de Navegación Anual (12 Meses) y Selector de Semestre con Badge Contextual */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-white bg-white dark:bg-[#111B2E] [data-theme=contrast]_&:bg-[#0D0D0D] p-3.5 sm:p-4 shadow-xs">
        {/* Controles de Navegación Anual: Flechas y Selector de Mes */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Botón Mes Anterior */}
          <button
            aria-label={t('calendar.prev_month')}
            className="flex items-center justify-center rounded-xl border border-[#CBD5E1] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-white dark:bg-[#16243A] [data-theme=contrast]_&:bg-black size-9 text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white hover:bg-[#F8FAFC] dark:hover:bg-[#1D2F46] [data-theme=contrast]_&:hover:bg-[#262626] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5575] dark:focus-visible:ring-[#67E8F9]"
            onClick={handlePrevMonth}
            title={t('calendar.prev_month')}
            type="button"
          >
            <span className="material-symbols-outlined text-lg">chevron_left</span>
          </button>

          {/* Selector Desplegable de 12 Meses */}
          <div className="relative">
            <select
              aria-label={t('calendar.select_month_aria')}
              className="appearance-none rounded-xl border border-[#CBD5E1] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-white dark:bg-[#16243A] [data-theme=contrast]_&:bg-black py-2 pl-3 pr-8 text-xs font-extrabold text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white focus:border-[#0B5575] dark:focus:border-[#67E8F9] focus:outline-none cursor-pointer"
              onChange={handleSelectMonth}
              value={activeMonth}
            >
              {monthNames.map((mName, idx) => (
                <option key={idx} value={idx} className="bg-white dark:bg-[#16243A] text-[#0F172A] dark:text-white">
                  {mName} {activeYear}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-base text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-white">
              arrow_drop_down
            </span>
          </div>

          {/* Botón Mes Siguiente */}
          <button
            aria-label={t('calendar.next_month')}
            className="flex items-center justify-center rounded-xl border border-[#CBD5E1] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-white dark:bg-[#16243A] [data-theme=contrast]_&:bg-black size-9 text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white hover:bg-[#F8FAFC] dark:hover:bg-[#1D2F46] [data-theme=contrast]_&:hover:bg-[#262626] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5575] dark:focus-visible:ring-[#67E8F9]"
            onClick={handleNextMonth}
            title={t('calendar.next_month')}
            type="button"
          >
            <span className="material-symbols-outlined text-lg">chevron_right</span>
          </button>

          {/* Botón Hoy (Restablece a Noviembre 2026) */}
          <button
            className="rounded-xl border border-[#CBD5E1] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-[#F8FAFC] dark:bg-[#16243A] [data-theme=contrast]_&:bg-black px-3 py-2 text-xs font-bold text-[#0B5575] dark:text-[#67E8F9] [data-theme=contrast]_&:text-[#00B7FF] hover:bg-[#EFF8FB] dark:hover:bg-[#1D2F46] transition"
            onClick={handleToday}
            type="button"
          >
            Hoy (Nov 2026)
          </button>
        </div>

        {/* Badge Contextual de Semestre */}
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <div
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition shadow-2xs ${semesterInfo.badgeStyle}`}
          >
            <span className="material-symbols-outlined text-base">{semesterInfo.icon}</span>
            <span>
              {semesterInfo.isCurrent
                ? `${semesterInfo.label} · ${t('dashboard.current_semester')}`
                : t('calendar.semesters.viewing_semester', { semester: semesterInfo.label })}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Barra de Filtros de Tipo de Evento (Independiente del Switch de Vista) */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-white bg-white dark:bg-[#111B2E] [data-theme=contrast]_&:bg-[#0D0D0D] p-3 shadow-xs">
        <span className="text-xs font-bold text-[#475569] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9] px-2">
          {t('dashboard.filters')}:
        </span>
        {[
          { id: 'all', label: t('calendar.filter_all') },
          { id: 'assignment', label: t('calendar.filter_assignments') },
          { id: 'evaluation', label: t('calendar.filter_evaluations') },
          { id: 'class', label: t('calendar.filter_classes') },
          { id: 'institutional', label: t('calendar.filter_institutional') },
        ].map((tab) => {
          const isSelected = filterType === tab.id
          return (
            <button
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5575] dark:focus-visible:ring-[#67E8F9] [data-theme=contrast]_&:focus-visible:ring-[#FFD400] ${
                isSelected
                  ? 'bg-[#0B5575] text-white dark:bg-[#0E7490] [data-theme=contrast]_&:bg-white [data-theme=contrast]_&:text-black shadow-xs'
                  : 'bg-[#F8FAFC] dark:bg-[#16243A] [data-theme=contrast]_&:bg-black text-[#475569] dark:text-[#CBD5E1] [data-theme=contrast]_&:text-white border border-[#CBD5E1] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] hover:bg-[#F1F5F9] dark:hover:bg-[#1D2F46] hover:text-[#0F172A] dark:hover:text-white'
              }`}
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* 3. VISTA DE LISTA / TIMELINE */}
      {viewMode === 'agenda' ? (
        <div className="space-y-6">
          {Object.keys(groupedEvents).length > 0 ? (
            Object.entries(groupedEvents).map(([dateStr, dayEvents]) => (
              <div key={dateStr} className="space-y-3">
                {/* Encabezado del día agrupado */}
                <div className="flex items-center gap-3 pt-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#0B5575] dark:text-[#67E8F9] [data-theme=contrast]_&:text-[#00B7FF]">
                    {formatGroupDate(dateStr)}
                  </span>
                  <span className="h-px flex-1 bg-[#E2E8F0] dark:bg-[#2A3A52] [data-theme=contrast]_&:bg-[#A6A6A6]" />
                  <span className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">
                    {dayEvents.length} {dayEvents.length === 1 ? 'evento' : 'eventos'}
                  </span>
                </div>

                {/* Eventos del día con línea de tiempo */}
                <div className="relative pl-5 space-y-3 before:absolute before:left-2 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#E2E8F0] dark:before:bg-[#2A3A52] [data-theme=contrast]_&:before:bg-[#A6A6A6]">
                  {dayEvents.map((ev) => {
                    const typeStyle = getTypeStyles(ev.type)

                    return (
                      <div
                        className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-white dark:bg-[#111B2E] [data-theme=contrast]_&:bg-[#0D0D0D] p-4 shadow-xs hover:border-[#0B5575]/50 dark:hover:border-[#5D718B] [data-theme=contrast]_&:hover:border-white hover:shadow-md transition-all cursor-pointer"
                        key={ev.id}
                        onClick={(e) => handleOpenEvent(ev, e.currentTarget)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            handleOpenEvent(ev, e.currentTarget)
                          }
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        {/* Punto conector en la línea de tiempo */}
                        <span
                          aria-hidden="true"
                          className={`absolute -left-[23px] top-5 size-3 rounded-full ring-4 ring-white dark:ring-[#0B1220] [data-theme=contrast]_&:ring-black ${typeStyle.dot}`}
                        />

                        <div className="flex items-start gap-4 min-w-0">
                          {/* Columna horaria fija de 112px */}
                          <div className="flex flex-col w-28 min-w-[112px] text-left shrink-0">
                            <span className="text-xs font-extrabold tabular-nums text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm text-[#0B5575] dark:text-[#67E8F9] [data-theme=contrast]_&:text-[#00B7FF]">
                                schedule
                              </span>
                              {ev.time}
                            </span>
                            <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9] truncate mt-0.5">
                              {ev.location || 'Aula virtual'}
                            </span>
                          </div>

                          {/* Bloque descriptivo */}
                          <div className="space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}
                              >
                                <span className="material-symbols-outlined text-xs">
                                  {typeStyle.icon}
                                </span>
                                <span>[{typeStyle.code}]</span>
                                {typeStyle.label}
                              </span>

                              {ev.courseCode && (
                                <span className="font-mono text-[11px] font-bold text-[#0B5575] dark:text-[#67E8F9] [data-theme=contrast]_&:text-[#00B7FF]">
                                  {ev.courseCode}
                                </span>
                              )}
                            </div>

                            <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white group-hover:text-[#0B5575] dark:group-hover:text-[#67E8F9] transition truncate">
                              {ev.title}
                            </h3>

                            <p className="text-xs text-[#475569] dark:text-[#CBD5E1] [data-theme=contrast]_&:text-[#F2F2F2] truncate max-w-xl">
                              {ev.courseTitle ? `${ev.courseTitle} · ` : ''}
                              {ev.teacher || ev.description}
                            </p>
                          </div>
                        </div>

                        {/* Botón 'Ver detalles' */}
                        <div className="self-end sm:self-center shrink-0">
                          <button
                            aria-label={`${t('calendar.view_details')} - ${ev.title}`}
                            className="btn-secondary rounded-lg border border-[#CBD5E1] dark:border-[#2A3A52] [data-theme=contrast]_&:border-white bg-white dark:bg-[#16243A] [data-theme=contrast]_&:bg-black px-3 py-1.5 text-xs font-bold text-[#0B5575] dark:text-[#67E8F9] [data-theme=contrast]_&:text-white hover:bg-[#EFF8FB] dark:hover:bg-[#1D2F46] [data-theme=contrast]_&:hover:bg-[#262626] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5575] dark:focus-visible:ring-[#67E8F9] [data-theme=contrast]_&:focus-visible:ring-[#FFD400]"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenEvent(ev, e.currentTarget)
                            }}
                            type="button"
                          >
                            {t('calendar.view_details')}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-white bg-white dark:bg-[#111827] [data-theme=contrast]_&:bg-[#0D0D0D] p-8 text-center">
              <span className="material-symbols-outlined text-3xl text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">
                event_busy
              </span>
              <p className="mt-2 text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white">
                No hay eventos para {currentMonthName} {activeYear} con el filtro seleccionado
              </p>
              <div className="mt-3 flex items-center justify-center gap-3">
                <button
                  className="text-xs font-bold text-[#0B5575] dark:text-[#67E8F9] [data-theme=contrast]_&:text-[#00B7FF] hover:underline"
                  onClick={() => setFilterType('all')}
                  type="button"
                >
                  Limpiar filtros
                </button>
                <span className="text-[#CBD5E1] dark:text-[#334155]">·</span>
                <button
                  className="text-xs font-bold text-[#0B5575] dark:text-[#67E8F9] [data-theme=contrast]_&:text-[#00B7FF] hover:underline"
                  onClick={handleToday}
                  type="button"
                >
                  Ir a Noviembre 2026
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* 4. VISTA MENSUAL (Grid: celdas de 96–120px en escritorio, día actual resaltado y cálculo dinámico de 12 meses) */
        <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-white bg-white dark:bg-[#111B2E] [data-theme=contrast]_&:bg-[#0D0D0D] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] pb-3">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white capitalize">
                {currentMonthName} {activeYear}
              </h2>
              <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">
                Ciclo lectivo · {semesterInfo.label}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold ${semesterInfo.badgeStyle}`}
              >
                <span className="material-symbols-outlined text-sm">{semesterInfo.icon}</span>
                {semesterInfo.label}
              </span>
            </div>
          </div>

          {/* Días de la semana localizados (Lunes a Domingo) */}
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-white">
            {weekDays.map((dayName, idx) => (
              <span className="py-1 uppercase tracking-wider text-[11px]" key={idx}>
                {dayName}
              </span>
            ))}
          </div>

          {/* Celdas del mes: mín 96px de alto, truncamiento line-clamp-1 y contadores numéricos */}
          <div className="grid grid-cols-7 gap-1.5 text-xs">
            {/* Celdas vacías de desfase inicial del mes (Lunes-based) */}
            {Array.from({ length: firstDayOffset }).map((_, i) => (
              <div
                className="min-h-[96px] lg:min-h-[110px] rounded-xl border border-dashed border-[#E2E8F0]/50 dark:border-[#2A3A52]/40 [data-theme=contrast]_&:border-[#333] bg-[#F8FAFC]/30 dark:bg-[#111B2E]/30 [data-theme=contrast]_&:bg-black/30 opacity-40 select-none"
                key={`offset-${i}`}
              />
            ))}

            {/* Días del mes activo */}
            {monthDays.map((day) => {
              const dayStr = `${activeYear}-${String(activeMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const isToday = activeYear === 2026 && activeMonth === 10 && day === 6 // 6 de Noviembre 2026
              const dayEvents = events.filter((e) => e.date === dayStr)
              const visibleEvents = dayEvents.slice(0, 2)
              const extraCount = dayEvents.length - 2

              return (
                <div
                  className={`min-h-[96px] lg:min-h-[110px] rounded-xl border p-2 flex flex-col justify-between transition ${
                    isToday
                      ? 'border-[#0B5575] dark:border-[#67E8F9] [data-theme=contrast]_&:border-white [data-theme=contrast]_&:border-2 bg-[#EFF8FB]/70 dark:bg-[#123B49]/80 [data-theme=contrast]_&:bg-[#1A1A1A] ring-1 ring-[#0B5575] dark:ring-[#67E8F9]'
                      : dayEvents.length > 0
                      ? 'border-[#BAE6FD] dark:border-[#155E75] [data-theme=contrast]_&:border-[#A6A6A6] bg-[#EFF8FB]/30 dark:bg-[#102F46]/40 [data-theme=contrast]_&:bg-[#0D0D0D] hover:bg-[#EFF8FB] dark:hover:bg-[#102F46]'
                      : 'border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-white dark:bg-[#111B2E] [data-theme=contrast]_&:bg-[#0D0D0D] hover:bg-[#F8FAFC] dark:hover:bg-[#16243A]'
                  }`}
                  key={day}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold tabular-nums ${
                        isToday
                          ? 'grid size-5 place-items-center rounded-full bg-[#0B5575] dark:bg-[#0E7490] [data-theme=contrast]_&:bg-[#FFD400] [data-theme=contrast]_&:text-black text-white'
                          : 'text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white'
                      }`}
                    >
                      {day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="size-1.5 rounded-full bg-[#0B5575] dark:bg-[#67E8F9] [data-theme=contrast]_&:bg-[#00B7FF]" />
                    )}
                  </div>

                  <div className="space-y-1 my-1">
                    {visibleEvents.map((ev) => {
                      const typeStyle = getTypeStyles(ev.type)
                      return (
                        <button
                          className={`w-full block truncate rounded px-1.5 py-0.5 text-[10px] font-bold text-left border line-clamp-1 transition ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}
                          key={ev.id}
                          onClick={() => handleOpenEvent(ev)}
                          title={`${ev.time} - [${typeStyle.code}] ${ev.title}`}
                          type="button"
                        >
                          [{typeStyle.code}] {ev.title}
                        </button>
                      )
                    })}

                    {extraCount > 0 && (
                      <button
                        className="w-full text-center text-[10px] font-bold text-[#0B5575] dark:text-[#67E8F9] [data-theme=contrast]_&:text-[#00B7FF] hover:underline"
                        onClick={() => handleOpenEvent(dayEvents[0])}
                        type="button"
                      >
                        +{extraCount} {extraCount === 1 ? 'actividad' : 'actividades'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Celdas vacías de relleno final para completar la fila de 7 días */}
            {Array.from({ length: trailingBlanks }).map((_, i) => (
              <div
                className="min-h-[96px] lg:min-h-[110px] rounded-xl border border-dashed border-[#E2E8F0]/50 dark:border-[#2A3A52]/40 [data-theme=contrast]_&:border-[#333] bg-[#F8FAFC]/30 dark:bg-[#111B2E]/30 [data-theme=contrast]_&:bg-black/30 opacity-40 select-none"
                key={`trail-${i}`}
              />
            ))}
          </div>

          {/* Leyenda accesible de tipos */}
          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] text-xs text-[#475569] dark:text-[#CBD5E1] [data-theme=contrast]_&:text-white">
            <span className="font-bold text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white">Leyenda:</span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#0B5575] dark:bg-[#66D9FF] [data-theme=contrast]_&:bg-[#00B7FF]" />
              [CLS] Clase
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#087F78] dark:bg-[#5EEAD4] [data-theme=contrast]_&:bg-[#00F084]" />
              [ACT] Actividad
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#B54708] dark:bg-[#FCD34D] [data-theme=contrast]_&:bg-[#FFE600]" />
              [EVL] Evaluación / Hito
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#B42318] dark:bg-[#FCA5A5] [data-theme=contrast]_&:bg-[#FF4D5A]" />
              [VNC] Vencimiento
            </span>
          </div>
        </div>
      )}

      {/* 5. DRAWER LATERAL DE DETALLE DEL EVENTO */}
      {selectedEvent && (
        <Drawer
          onClose={handleCloseEvent}
          open={Boolean(selectedEvent)}
          subtitle={selectedEvent.courseCode ? `${selectedEvent.courseCode} · Evento` : 'Agenda'}
          title={selectedEvent.title}
          footer={
            <EventActions
              event={selectedEvent}
              onClose={handleCloseEvent}
              onNavigateToClass={() => {
                handleCloseEvent()
                onNavigateToCourse?.(selectedEvent.courseCode)
              }}
              onNavigateToTasks={() => {
                handleCloseEvent()
                onNavigateToTasks?.()
              }}
            />
          }
        >
          <div className="space-y-4">
            {/* Estado y tipo */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">Tipo:</span>
                <Badge variant={selectedEvent.type === 'deadline' ? 'danger' : 'primary'}>
                  [{getTypeStyles(selectedEvent.type).code}] {getTypeStyles(selectedEvent.type).label}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">Estado:</span>
                <Badge variant={selectedEvent.status === 'pending' ? 'warning' : 'success'}>
                  {selectedEvent.status === 'pending' ? 'Pendiente' : 'Programado'}
                </Badge>
              </div>
            </div>

            {/* Fecha, Horario y Ubicación */}
            <div className="rounded-xl border border-[#E2E8F0] dark:border-[#2F4058] [data-theme=contrast]_&:border-white bg-[#F8FAFC] dark:bg-[#182235] [data-theme=contrast]_&:bg-black p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="material-symbols-outlined text-base text-[#0B5575] dark:text-[#67E8F9] [data-theme=contrast]_&:text-[#00B7FF]">
                  calendar_today
                </span>
                <span className="font-bold text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white">
                  {formatGroupDate(selectedEvent.date)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="material-symbols-outlined text-base text-[#0B5575] dark:text-[#67E8F9] [data-theme=contrast]_&:text-[#00B7FF]">
                  schedule
                </span>
                <span className="font-semibold tabular-nums text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white">
                  {selectedEvent.time}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="material-symbols-outlined text-base text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">
                  room
                </span>
                <span className="text-[#64748B] dark:text-[#CBD5E1] [data-theme=contrast]_&:text-[#F2F2F2]">
                  {selectedEvent.location || 'Aula virtual'}
                </span>
              </div>
            </div>

            {/* Asignatura y Docente */}
            <div className="space-y-2 border-t border-[#E2E8F0] dark:border-[#2F4058] [data-theme=contrast]_&:border-white pt-3">
              <div>
                <span className="block text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9] uppercase">
                  {t('calendar.field_subject')}
                </span>
                <p className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white">
                  {selectedEvent.courseCode} · {selectedEvent.courseTitle || 'Ingeniería de Software'}
                </p>
              </div>

              {selectedEvent.teacher && (
                <div>
                  <span className="block text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9] uppercase">
                    Docente Responsable
                  </span>
                  <p className="text-xs font-semibold text-[#0F172A] dark:text-[#CBD5E1] [data-theme=contrast]_&:text-white">
                    {selectedEvent.teacher}
                  </p>
                </div>
              )}

              {selectedEvent.modality && (
                <div>
                  <span className="block text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9] uppercase">
                    {t('calendar.field_modality')}
                  </span>
                  <p className="text-xs text-[#0F172A] dark:text-[#CBD5E1] [data-theme=contrast]_&:text-white">
                    {selectedEvent.modality}
                  </p>
                </div>
              )}
            </div>

            {/* Descripción detallada */}
            <div className="space-y-1 border-t border-[#E2E8F0] dark:border-[#2F4058] [data-theme=contrast]_&:border-white pt-3">
              <span className="block text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9] uppercase">
                {t('calendar.field_description')}
              </span>
              <p className="text-xs text-[#0F172A] dark:text-[#CBD5E1] [data-theme=contrast]_&:text-white leading-relaxed">
                {selectedEvent.description}
              </p>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  )
}

function EventActions({ event, onClose, onNavigateToClass, onNavigateToTasks }) {
  const { t } = useLanguage()

  switch (event.type) {
    case 'assignment':
      return (
        <div className="flex items-center justify-between gap-2 w-full">
          <Button onClick={onClose} size="sm" variant="tertiary">
            {t('calendar.close')}
          </Button>
          <div className="flex items-center gap-2">
            <Button onClick={onNavigateToClass} size="sm" variant="secondary">
              {t('calendar.action_go_class')}
            </Button>
            <Button onClick={onNavigateToTasks} size="sm" variant="primary">
              {t('calendar.action_go_tasks')}
            </Button>
          </div>
        </div>
      )

    case 'evaluation':
    case 'deadline':
      return (
        <div className="flex items-center justify-between gap-2 w-full">
          <Button onClick={onClose} size="sm" variant="tertiary">
            {t('calendar.close')}
          </Button>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                onNavigateToTasks?.()
                onClose?.()
              }}
              size="sm"
              variant="secondary"
            >
              Instrucciones
            </Button>
            <Button
              onClick={() => {
                onNavigateToTasks?.()
                onClose?.()
              }}
              size="sm"
              variant="primary"
            >
              Ver evaluación
            </Button>
          </div>
        </div>
      )

    case 'class':
      return (
        <div className="flex items-center justify-between gap-2 w-full">
          <Button onClick={onClose} size="sm" variant="tertiary">
            {t('calendar.close')}
          </Button>
          <div className="flex items-center gap-2">
            <Button onClick={onNavigateToClass} size="sm" variant="secondary">
              Material didáctico
            </Button>
            <Button onClick={onNavigateToClass} size="sm" variant="primary">
              {t('calendar.action_go_class')}
            </Button>
          </div>
        </div>
      )

    case 'institutional':
    default:
      return (
        <div className="flex items-center justify-between gap-2 w-full">
          <Button onClick={onClose} size="sm" variant="tertiary">
            {t('calendar.close')}
          </Button>
          <Button
            onClick={() => {
              onNavigateToClass?.()
              onClose?.()
            }}
            size="sm"
            variant="primary"
          >
            Ver asignaturas
          </Button>
        </div>
      )
  }
}

export default CalendarView
