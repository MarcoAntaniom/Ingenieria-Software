import { useState, useMemo, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { Drawer } from './ui/Drawer'

export function CalendarView({
  events = [],
  onNavigateToCourse,
  onNavigateToTasks,
  onNavigateToMaterials,
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filterType, setFilterType] = useState('all') // 'all' | 'assignment' | 'evaluation' | 'class' | 'institutional'
  const [viewMode, setViewMode] = useState('agenda') // 'agenda' | 'month'

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

  // Filtrado de eventos
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (filterType === 'all') return true
      if (filterType === 'assignment') return ev.type === 'assignment' || ev.type === 'deadline'
      if (filterType === 'evaluation') return ev.type === 'evaluation' || ev.type === 'milestone'
      return ev.type === filterType
    })
  }, [events, filterType])

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

  // Estilos de color suaves y sobrios según tipo (Recomendación 4)
  function getTypeStyles(type) {
    switch (type) {
      case 'class':
        return {
          label: 'Clase',
          bg: 'bg-[#F0F9FF]',
          border: 'border-[#BAE6FD]',
          text: 'text-[#075477]',
          dot: 'bg-[#075477]',
          icon: 'school',
        }
      case 'assignment':
        return {
          label: 'Actividad / Taller',
          bg: 'bg-[#F0FDFA]',
          border: 'border-[#99F6E4]',
          text: 'text-[#0F766E]',
          dot: 'bg-[#14B8A6]',
          icon: 'assignment',
        }
      case 'evaluation':
      case 'milestone':
        return {
          label: 'Evaluación / Hito',
          bg: 'bg-[#FEFCE8]',
          border: 'border-[#FEF08A]',
          text: 'text-[#854D0E]',
          dot: 'bg-[#B7791F]',
          icon: 'flag',
        }
      case 'deadline':
        return {
          label: 'Fecha Límite',
          bg: 'bg-[#FEF2F2]',
          border: 'border-[#FECACA]',
          text: 'text-[#991B1B]',
          dot: 'bg-[#C53030]',
          icon: 'assignment_late',
        }
      case 'institutional':
      default:
        return {
          label: 'Institucional',
          bg: 'bg-[#F8FAFC]',
          border: 'border-[#E2E8F0]',
          text: 'text-[#475569]',
          dot: 'bg-[#64748B]',
          icon: 'event',
        }
    }
  }

  // Formato de encabezado de fecha agrupado
  function formatGroupDate(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number)
    const dateObj = new Date(year, month - 1, day)
    const dayName = dateObj.toLocaleDateString('es-CL', { weekday: 'long' })
    const monthName = dateObj.toLocaleDateString('es-CL', { month: 'long' })
    return `${day} ${monthName.toUpperCase()} · ${dayName.toUpperCase()}`
  }

  return (
    <div className="space-y-6">
      {/* 1. Encabezado del Calendario */}
      <div className="flex flex-col justify-between gap-4 rounded-[14px] border border-[#dbe3ec] bg-white p-5 sm:p-6 shadow-[0_3px_12px_rgba(15,23,42,0.06)] md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2 text-[#075477]">
            <span className="material-symbols-outlined text-lg">calendar_month</span>
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Agenda y Cronograma Oficial
            </span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-[26px] font-extrabold text-[#172033] tracking-tight">
            Calendario Académico Integrado
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#64748b]">
            Monitorea cronológicamente tus clases, hitos de proyecto, evaluaciones y fechas límite del periodo.
          </p>
        </div>

        {/* Selector de Modo: Agenda (Lista) vs Mes */}
        <div className="flex items-center gap-2 self-start md:self-center">
          <div className="inline-flex rounded-[10px] bg-[#f1f5f9] p-1 border border-[#dbe3ec]">
            <button
              aria-pressed={viewMode === 'agenda'}
              className={`flex items-center gap-1.5 rounded-[8px] px-3.5 py-1.5 text-xs font-bold transition ${
                viewMode === 'agenda'
                  ? 'bg-white text-[#075477] shadow-xs'
                  : 'text-[#64748b] hover:text-[#172033]'
              }`}
              onClick={() => setViewMode('agenda')}
              type="button"
            >
              <span className="material-symbols-outlined text-base">view_agenda</span>
              Lista
            </button>
            <button
              aria-pressed={viewMode === 'month'}
              className={`flex items-center gap-1.5 rounded-[8px] px-3.5 py-1.5 text-xs font-bold transition ${
                viewMode === 'month'
                  ? 'bg-white text-[#075477] shadow-xs'
                  : 'text-[#64748b] hover:text-[#172033]'
              }`}
              onClick={() => setViewMode('month')}
              type="button"
            >
              <span className="material-symbols-outlined text-base">calendar_view_month</span>
              Mensual
            </button>
          </div>
        </div>
      </div>

      {/* 2. Barra de Filtros con Colores y Contadores */}
      <div className="flex flex-wrap items-center gap-2 rounded-[14px] border border-[#dbe3ec] bg-white p-3 shadow-xs">
        <span className="text-xs font-bold text-[#64748b] px-2">Filtrar:</span>
        {[
          { id: 'all', label: 'Todos los eventos' },
          { id: 'assignment', label: 'Actividades y talleres' },
          { id: 'evaluation', label: 'Evaluaciones e hitos' },
          { id: 'class', label: 'Clases' },
          { id: 'institutional', label: 'Institucionales' },
        ].map((tab) => {
          const isSelected = filterType === tab.id
          return (
            <button
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                isSelected
                  ? 'bg-[#075477] text-white shadow-xs'
                  : 'bg-[#f8fafc] text-[#64748b] border border-[#dbe3ec] hover:bg-[#f1f5f9] hover:text-[#172033]'
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

      {/* 3. VISTA DE LISTA (Agrupada por día con línea de tiempo clara) */}
      {viewMode === 'agenda' ? (
        <div className="space-y-6">
          {Object.keys(groupedEvents).length > 0 ? (
            Object.entries(groupedEvents).map(([dateStr, dayEvents]) => (
              <div key={dateStr} className="space-y-3">
                {/* Encabezado del día agrupado */}
                <div className="flex items-center gap-3 pt-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#075477]">
                    {formatGroupDate(dateStr)}
                  </span>
                  <span className="h-px flex-1 bg-[#dbe3ec]" />
                  <span className="text-[11px] font-semibold text-[#64748b]">
                    {dayEvents.length} {dayEvents.length === 1 ? 'actividad' : 'actividades'}
                  </span>
                </div>

                {/* Eventos del día con línea de tiempo */}
                <div className="relative pl-4 space-y-3 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#dbe3ec]">
                  {dayEvents.map((ev) => {
                    const typeStyle = getTypeStyles(ev.type)

                    return (
                      <div
                        className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-[12px] border border-[#dbe3ec] bg-white p-4 shadow-xs hover:border-[#075477]/40 hover:shadow-md transition-all cursor-pointer"
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
                        {/* Indicador de punto en la línea de tiempo */}
                        <span
                          aria-hidden="true"
                          className={`absolute -left-[19px] top-5 size-2.5 rounded-full ring-4 ring-white ${typeStyle.dot}`}
                        />

                        <div className="flex items-start gap-3.5 min-w-0">
                          {/* Horario */}
                          <div className="flex flex-col min-w-28 text-left">
                            <span className="text-xs font-extrabold text-[#172033] flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm text-[#075477]">
                                schedule
                              </span>
                              {ev.time}
                            </span>
                            <span className="text-[11px] text-[#64748b] truncate mt-0.5">
                              {ev.location || 'Aula virtual'}
                            </span>
                          </div>

                          {/* Título y metadatos */}
                          <div className="space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}
                              >
                                <span className="material-symbols-outlined text-xs">
                                  {typeStyle.icon}
                                </span>
                                {typeStyle.label}
                              </span>

                              {ev.courseCode && (
                                <span className="font-mono text-[11px] font-bold text-[#075477]">
                                  {ev.courseCode}
                                </span>
                              )}
                            </div>

                            <h3 className="text-sm font-bold text-[#172033] group-hover:text-[#075477] transition truncate">
                              {ev.title}
                            </h3>

                            <p className="text-xs text-[#64748b] truncate max-w-xl">
                              {ev.courseTitle ? `${ev.courseTitle} · ` : ''}
                              {ev.teacher || ev.description}
                            </p>
                          </div>
                        </div>

                        {/* Botón de acción explícita para accesibilidad */}
                        <div className="self-end sm:self-center shrink-0">
                          <button
                            aria-label={`Ver detalles de ${ev.title}`}
                            className="rounded-[8px] border border-[#dbe3ec] bg-white px-3 py-1.5 text-xs font-bold text-[#075477] hover:bg-[#f5f7fb] hover:border-[#cbd5e1] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#075477]"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenEvent(ev, e.currentTarget)
                            }}
                            type="button"
                          >
                            Ver detalles
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[14px] border border-[#dbe3ec] bg-white p-8 text-center">
              <span className="material-symbols-outlined text-3xl text-[#64748b]">event_busy</span>
              <p className="mt-2 text-sm font-bold text-[#172033]">
                No hay eventos para el filtro seleccionado
              </p>
              <button
                className="mt-3 text-xs font-bold text-[#075477] hover:underline"
                onClick={() => setFilterType('all')}
                type="button"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      ) : (
        /* 4. VISTA MENSUAL (Limpia, con colores suaves y límites por día) */
        <div className="rounded-[14px] border border-[#dbe3ec] bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#dbe3ec] pb-3">
            <h2 className="text-base font-extrabold text-[#172033]">Noviembre 2026</h2>
            <span className="text-xs font-semibold text-[#64748b]">Periodo Lectivo Regular</span>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-[#64748b]">
            <span>Lun</span>
            <span>Mar</span>
            <span>Mié</span>
            <span>Jue</span>
            <span>Vie</span>
            <span>Sáb</span>
            <span>Dom</span>
          </div>

          {/* Celdas del mes */}
          <div className="grid grid-cols-7 gap-1.5 text-xs">
            {Array.from({ length: 30 }).map((_, i) => {
              const day = i + 1
              const dayStr = `2026-11-${day < 10 ? '0' + day : day}`
              const dayEvents = events.filter((e) => e.date === dayStr)
              const visibleEvents = dayEvents.slice(0, 2)
              const extraCount = dayEvents.length - 2

              return (
                <div
                  className={`min-h-[88px] rounded-[10px] border p-1.5 flex flex-col justify-between transition ${
                    dayEvents.length > 0
                      ? 'border-[#BAE6FD] bg-[#F0F9FF]/40 hover:bg-[#F0F9FF]'
                      : 'border-[#dbe3ec]/60 bg-white hover:bg-[#f8fafc]'
                  }`}
                  key={day}
                >
                  <span className="font-bold text-[#172033] text-[11px]">{day}</span>

                  <div className="space-y-1 my-1">
                    {visibleEvents.map((ev) => {
                      const typeStyle = getTypeStyles(ev.type)
                      return (
                        <button
                          className={`w-full block truncate rounded-[4px] px-1 py-0.5 text-[10px] font-bold text-left border transition ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}
                          key={ev.id}
                          onClick={() => handleOpenEvent(ev)}
                          title={`${ev.time} - ${ev.title}`}
                          type="button"
                        >
                          {ev.title}
                        </button>
                      )
                    })}

                    {extraCount > 0 && (
                      <button
                        className="w-full text-center text-[10px] font-bold text-[#075477] hover:underline"
                        onClick={() => handleOpenEvent(dayEvents[0])}
                        type="button"
                      >
                        +{extraCount} más
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Leyenda sobria de tipos */}
          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-[#dbe3ec] text-xs text-[#64748b]">
            <span className="font-bold text-[#172033]">Leyenda:</span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#075477]" />
              Clase
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#14B8A6]" />
              Actividad
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#B7791F]" />
              Evaluación / Hito
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#C53030]" />
              Vencimiento
            </span>
          </div>
        </div>
      )}

      {/* 5. DRAWER CONTEXTUAL DE DETALLE DEL EVENTO ("Ver detalles") */}
      {selectedEvent && (
        <Drawer
          onClose={handleCloseEvent}
          open={Boolean(selectedEvent)}
          subtitle={selectedEvent.courseCode ? `${selectedEvent.courseCode} · Evento Académico` : 'Agenda'}
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
                <span className="font-semibold text-[#64748b]">Tipo:</span>
                <Badge variant={selectedEvent.type === 'deadline' ? 'danger' : 'primary'}>
                  {getTypeStyles(selectedEvent.type).label}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#64748b]">Estado:</span>
                <Badge variant={selectedEvent.status === 'pending' ? 'warning' : 'success'}>
                  {selectedEvent.status === 'pending' ? 'Pendiente' : 'Programado'}
                </Badge>
              </div>
            </div>

            {/* Fecha y Horario */}
            <div className="rounded-[10px] border border-[#dbe3ec] bg-[#f8fafc] p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="material-symbols-outlined text-base text-[#075477]">calendar_today</span>
                <span className="font-bold text-[#172033]">
                  {formatGroupDate(selectedEvent.date)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="material-symbols-outlined text-base text-[#075477]">schedule</span>
                <span className="font-semibold text-[#172033]">{selectedEvent.time}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="material-symbols-outlined text-base text-[#64748b]">room</span>
                <span className="text-[#64748b]">{selectedEvent.location || 'Laboratorio Virtual'}</span>
              </div>
            </div>

            {/* Asignatura y Docente */}
            <div className="space-y-2 border-t border-[#dbe3ec] pt-3">
              <div>
                <span className="block text-[11px] font-bold text-[#64748b] uppercase">Asignatura</span>
                <p className="text-sm font-bold text-[#172033]">
                  {selectedEvent.courseCode} · {selectedEvent.courseTitle || 'Ingeniería de Software'}
                </p>
              </div>

              {selectedEvent.teacher && (
                <div>
                  <span className="block text-[11px] font-bold text-[#64748b] uppercase">Docente Responsable</span>
                  <p className="text-xs font-semibold text-[#172033]">{selectedEvent.teacher}</p>
                </div>
              )}

              {selectedEvent.modality && (
                <div>
                  <span className="block text-[11px] font-bold text-[#64748b] uppercase">Modalidad</span>
                  <p className="text-xs text-[#172033]">{selectedEvent.modality}</p>
                </div>
              )}
            </div>

            {/* Descripción detallada */}
            <div className="space-y-1 border-t border-[#dbe3ec] pt-3">
              <span className="block text-[11px] font-bold text-[#64748b] uppercase">
                Descripción de la Actividad
              </span>
              <p className="text-xs text-[#172033] leading-relaxed">
                {selectedEvent.description}
              </p>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  )
}

// Subcomponente de acciones dinámicas según tipo de evento (Recomendación 3)
function EventActions({ event, onClose, onNavigateToClass, onNavigateToTasks }) {
  switch (event.type) {
    case 'assignment':
      return (
        <div className="flex items-center justify-between gap-2 w-full">
          <Button onClick={onClose} size="sm" variant="tertiary">
            Cerrar
          </Button>
          <div className="flex items-center gap-2">
            <Button onClick={onNavigateToClass} size="sm" variant="secondary">
              Ver clase
            </Button>
            <Button onClick={onNavigateToTasks} size="sm" variant="primary">
              Ver actividad
            </Button>
          </div>
        </div>
      )

    case 'evaluation':
    case 'deadline':
      return (
        <div className="flex items-center justify-between gap-2 w-full">
          <Button onClick={onClose} size="sm" variant="tertiary">
            Cerrar
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
              Revisar instrucciones
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
            Cerrar
          </Button>
          <div className="flex items-center gap-2">
            <Button onClick={onNavigateToClass} size="sm" variant="secondary">
              Ver materiales
            </Button>
            <Button onClick={onNavigateToClass} size="sm" variant="primary">
              Ir a la clase
            </Button>
          </div>
        </div>
      )

    case 'institutional':
    default:
      return (
        <div className="flex items-center justify-between gap-2 w-full">
          <Button onClick={onClose} size="sm" variant="tertiary">
            Cerrar
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
