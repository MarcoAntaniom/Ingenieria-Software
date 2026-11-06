import { useState } from 'react'
import { Dialog } from './ui/Dialog'
import { Button } from './ui/Button'

export function SyllabusModal({ course, isOpen, onClose }) {
  const [downloading, setDownloading] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)
  const [expandedUnit, setExpandedUnit] = useState(0) // Unidad expandida por defecto

  if (!course) return null

  // Unidades temáticas estructuradas con resultados de aprendizaje y actividades
  const unitsData = [
    {
      unit: 1,
      title: 'Unidad 1: Fundamentos de Ingeniería y Modelado de Software',
      summary: 'Ciclos de vida ágiles, levantamiento de requerimientos y especificación SRS.',
      learningOutcomes: 'Modelar requerimientos funcionales y no funcionales utilizando historias de usuario y diagramas UML/C4.',
      contents: 'Historias de usuario, Criterios de aceptación INVEST, Diagramas de contexto y contenedor C4.',
      activities: 'Taller práctico de historias de usuario y entrega sumativa de SRS.',
    },
    {
      unit: 2,
      title: 'Unidad 2: Arquitectura de Software y Patrones de Diseño',
      summary: 'Patrones arquitectónicos distribuidos, CQRS, Event Sourcing y microservicios.',
      learningOutcomes: 'Diseñar arquitecturas escalables aplicando patrones de diseño GoF y patrones empresariales.',
      contents: 'Arquitecturas desacopladas, API RESTful, gRPC, Message Brokers y Event-Driven Architecture.',
      activities: 'Laboratorio de microservicios con Docker Compose y modelado C4 nivel componente.',
    },
    {
      unit: 3,
      title: 'Unidad 3: Calidad, Testing Automatizado y Despliegue CI/CD',
      summary: 'Estrategias de aseguramiento de calidad, pruebas unitarias y pipelines de entrega continua.',
      learningOutcomes: 'Implementar suites de pruebas automatizadas y pipelines de despliegue continuo con GitHub Actions.',
      contents: 'TDD, Testing de integración, Contratos de API, Análisis estático con SonarQube, Pipelines de CI/CD.',
      activities: 'Defensa de proyecto integrador y demostración de pipeline automatizado.',
    },
  ]

  // Ponderaciones compactas
  const gradingScheme = [
    { name: 'Sprint Reviews y Entregas Parciales', weight: 50, color: 'bg-[#075477]' },
    { name: 'Documentación Técnica y Modelado C4', weight: 20, color: 'bg-[#14b8a6]' },
    { name: 'Defensa Final de Proyecto Capstone', weight: 30, color: 'bg-[#b7791f]' },
  ]

  function handleDownloadPDF() {
    setDownloading(true)
    setDownloadSuccess(false)
    setTimeout(() => {
      setDownloading(false)
      setDownloadSuccess(true)
      setTimeout(() => setDownloadSuccess(false), 4000)
    }, 1200)
  }

  return (
    <Dialog
      description={`Profesor: ${course.teacher} · Régimen Semestral Presencial · 6 Créditos SCT`}
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2">
            <Button
              disabled={downloading}
              iconLeading={downloading ? 'sync' : 'picture_as_pdf'}
              onClick={handleDownloadPDF}
              size="sm"
              variant="secondary"
            >
              {downloading
                ? 'Descargando...'
                : 'Descargar syllabus oficial · PDF · 1.2 MB'}
            </Button>
            {downloadSuccess && (
              <span className="text-[11px] font-bold text-[#16856a] flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Descargado con éxito
              </span>
            )}
          </div>

          <Button onClick={onClose} size="sm" variant="primary">
            Entendido
          </Button>
        </div>
      }
      onClose={onClose}
      open={isOpen}
      size="lg"
      subtitle={`${course.code} ${course.section ? `· Sección ${course.section}` : ''}`}
      title="Programa de Asignatura y Syllabus Oficial"
    >
      <div className="space-y-5">
        {/* Régimen de Calificaciones Compacto (Recomendación 6) */}
        <div className="rounded-[10px] border border-[#dbe3ec] bg-[#f8fafc] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#172033]">
              Ponderación y Régimen de Calificaciones
            </h3>
            <span className="text-[11px] font-bold text-[#075477]">Escala 1.0 - 7.0 (Aprobación: 4.0)</span>
          </div>

          {/* Barra segmentada horizontal */}
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[#e2e8f0]">
            {gradingScheme.map((g, idx) => (
              <div
                className={`${g.color} transition-all duration-300`}
                key={idx}
                style={{ width: `${g.weight}%` }}
                title={`${g.name}: ${g.weight}%`}
              />
            ))}
          </div>

          {/* Desglose compacto en lista */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
            {gradingScheme.map((item, idx) => (
              <div className="flex items-center justify-between rounded-[8px] border border-[#dbe3ec] bg-white px-2.5 py-1.5" key={idx}>
                <span className="truncate pr-2 font-medium text-[#172033]">{item.name}</span>
                <span className="font-extrabold text-[#075477] shrink-0">{item.weight}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Acordeones para Unidades Temáticas (Recomendación 6) */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#172033]">
            Unidades de Aprendizaje y Contenidos
          </h3>

          <div className="space-y-2">
            {unitsData.map((u, idx) => {
              const isExpanded = expandedUnit === idx

              return (
                <div
                  className="rounded-[10px] border border-[#dbe3ec] bg-white transition-all overflow-hidden"
                  key={u.unit}
                >
                  <button
                    aria-expanded={isExpanded}
                    className="flex w-full items-center justify-between p-3.5 text-left hover:bg-[#f8fafc] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#075477]"
                    onClick={() => setExpandedUnit(isExpanded ? null : idx)}
                    type="button"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <span className="grid size-6 place-items-center rounded-full bg-[#E8F3F8] text-[11px] font-extrabold text-[#075477] shrink-0">
                        {u.unit}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-[#172033] truncate">{u.title}</h4>
                        <p className="text-[11px] text-[#64748b] truncate mt-0.5">{u.summary}</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-lg text-[#64748b] transition-transform duration-200 shrink-0">
                      {isExpanded ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>

                  {/* Detalle expandible del acordeón */}
                  {isExpanded && (
                    <div className="border-t border-[#dbe3ec] bg-[#f8fafc] p-3.5 space-y-2.5 text-xs">
                      <div>
                        <span className="font-bold text-[#075477] block text-[11px] uppercase tracking-wide">
                          Resultados de Aprendizaje
                        </span>
                        <p className="text-[#172033] mt-0.5 leading-relaxed">{u.learningOutcomes}</p>
                      </div>

                      <div>
                        <span className="font-bold text-[#075477] block text-[11px] uppercase tracking-wide">
                          Contenidos Principales
                        </span>
                        <p className="text-[#64748b] mt-0.5 leading-relaxed">{u.contents}</p>
                      </div>

                      <div>
                        <span className="font-bold text-[#075477] block text-[11px] uppercase tracking-wide">
                          Actividades Evaluativas Asociadas
                        </span>
                        <p className="text-[#64748b] mt-0.5 leading-relaxed">{u.activities}</p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Metadatos Curriculares */}
        <div className="flex flex-wrap items-center justify-between rounded-[8px] border border-[#dbe3ec] bg-white p-3 text-xs text-[#64748b]">
          <span>Requisito previo curricular: <strong className="text-[#172033]">INF-204 Estructuras de Datos</strong></span>
          <span>Créditos SCT: <strong className="text-[#172033]">6 Créditos</strong></span>
        </div>
      </div>
    </Dialog>
  )
}
