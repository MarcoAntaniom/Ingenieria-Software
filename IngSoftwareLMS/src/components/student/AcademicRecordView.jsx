import { useState } from 'react'
import { ACADEMIC_EXPEDIENTE } from '../../data/mockData'
import { Badge } from '../ui/Badge'
import { ProgressBar } from '../ui/ProgressBar'

export function AcademicRecordView({ onBackToDashboard }) {
  const [activeTab, setActiveTab] = useState('current') // 'current' | 'history' | 'summary'
  const [downloadingCert, setDownloadingCert] = useState(false)
  const [certModalOpen, setCertModalOpen] = useState(false)
  const [certDownloaded, setCertDownloaded] = useState(false)
  const [selectedCourseForDetail, setSelectedCourseForDetail] = useState(null)

  const expediente = ACADEMIC_EXPEDIENTE

  function handleDownloadCertificate() {
    setDownloadingCert(true)
    setTimeout(() => {
      setDownloadingCert(false)
      setCertModalOpen(true)
    }, 800)
  }

  function handleSaveCertificateFile() {
    const certText = `UNIVERSIDAD - DIRECCIÓN DE REGISTRO ACADÉMICO
CERTIFICADO OFICIAL DE CONCENTRACIÓN DE NOTAS

Estudiante: Esteban Morales Sepúlveda
RUT: 20.123.456-7
Carrera: ${expediente.career}
Plan: Plan de Estudios 2022
Periodo Académico: Semestre Otoño 2026

RÉCORD ACADÉMICO:
- Promedio Ponderado Acumulado (PPA): ${expediente.gpa}
- Créditos Aprobados: ${expediente.creditsApproved} / ${expediente.totalCredits} SCT (${expediente.progressPercentage}%)
- Total Asignaturas Aprobadas: ${expediente.coursesPassed}
- Estado Académico: Alumno Regular Activo (Sin observaciones)

DOCUMENTO OFICIAL VERIFICADO DIGITALMENTE
Firma Digital: Campus Virtual LMS - Sistema de Registro Curricular
Código de Verificación QR: SEC-2026-F89A-001
Fecha de Emisión: ${new Date().toLocaleDateString('es-CL')}
`
    const blob = new Blob([certText], { type: 'text/plain;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'Certificado_Notas_Oficial_Morales.txt')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setCertDownloaded(true)
    setTimeout(() => {
      setCertDownloaded(false)
      setCertModalOpen(false)
    }, 1500)
  }

  return (
    <div className="space-y-6">
      {/* 1. Encabezado del Expediente y Resumen Curricular */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[#0B4F6C]">
            <span className="material-symbols-outlined text-lg">history_edu</span>
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Registro Curricular y Calificaciones Oficiales
            </span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-[26px] font-extrabold tracking-tight text-[#1F2937]">
            Expediente Académico del Estudiante
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#4B5563]">
            {expediente.career} · Estudiante:{' '}
            <strong className="text-[#1F2937]">Esteban Morales Sepúlveda</strong> (RUT 20.123.456-7)
          </p>
        </div>

        {/* Acciones principales */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onBackToDashboard && (
            <button
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2 text-xs font-bold text-[#4B5563] hover:bg-[#F1F5F9] hover:text-[#1F2937] transition"
              onClick={onBackToDashboard}
              type="button"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Volver al panel
            </button>
          )}

          <button
            className="inline-flex items-center gap-2 rounded-xl bg-[#0B4F6C] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#083C53] transition disabled:opacity-60"
            disabled={downloadingCert}
            onClick={handleDownloadCertificate}
            type="button"
          >
            <span className="material-symbols-outlined text-base">
              {downloadingCert ? 'sync' : 'download'}
            </span>
            <span>
              {downloadingCert ? 'Generando certificado...' : 'Descargar Certificado Oficial (PDF)'}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Tarjetas de Métricas de Rendimiento (PGA, Avance en Créditos, Semestre) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* PGA */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-bold uppercase tracking-wider">Promedio Acumulado</span>
            <span className="material-symbols-outlined text-xl text-[#0B4F6C]">grade</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#0B4F6C]">{expediente.pga}</span>
            <span className="text-xs font-semibold text-[#64748B]">/ 7.0</span>
          </div>
          <div className="mt-2">
            <Badge variant="success">Rendimiento Sobresaliente</Badge>
          </div>
        </div>

        {/* Avance Curricular */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-bold uppercase tracking-wider">Avance Curricular</span>
            <span className="material-symbols-outlined text-xl text-[#16856A]">trending_up</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#1F2937]">
              {expediente.progressPercentage}%
            </span>
            <span className="text-xs text-[#64748B]">completado</span>
          </div>
          <div className="mt-3">
            <ProgressBar value={expediente.progressPercentage} variant="success" />
          </div>
        </div>

        {/* Créditos SCT */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-bold uppercase tracking-wider">Créditos Aprobados</span>
            <span className="material-symbols-outlined text-xl text-[#B7791F]">verified</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#1F2937]">
              {expediente.completedCredits}
            </span>
            <span className="text-xs font-semibold text-[#64748B]">
              / {expediente.totalCredits} SCT
            </span>
          </div>
          <p className="mt-2 text-[11px] text-[#64748B]">
            Restan {expediente.totalCredits - expediente.completedCredits} créditos para egreso
          </p>
        </div>

        {/* Estado Académico */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-bold uppercase tracking-wider">Estado Matrícula</span>
            <span className="material-symbols-outlined text-xl text-[#16856A]">check_circle</span>
          </div>
          <div className="mt-2">
            <span className="text-lg font-extrabold text-[#16856A]">Alumno Regular Activo</span>
          </div>
          <p className="mt-2 text-[11px] text-[#4B5563]">
            {expediente.currentTerm.courses.length} asignaturas inscritas en {expediente.currentTerm.period}
          </p>
        </div>
      </div>

      {/* 3. Selector de Pestañas de la Vista */}
      <div className="flex items-center gap-1.5 border-b border-[#E2E8F0] pb-2">
        <button
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'current'
              ? 'bg-[#0B4F6C] text-white shadow-xs'
              : 'text-[#4B5563] hover:bg-[#F1F5F9] hover:text-[#1F2937]'
          }`}
          onClick={() => setActiveTab('current')}
          type="button"
        >
          <span className="material-symbols-outlined text-base">fact_check</span>
          <span>Semestre en Curso ({expediente.currentTerm.period})</span>
        </button>

        <button
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'history'
              ? 'bg-[#0B4F6C] text-white shadow-xs'
              : 'text-[#4B5563] hover:bg-[#F1F5F9] hover:text-[#1F2937]'
          }`}
          onClick={() => setActiveTab('history')}
          type="button"
        >
          <span className="material-symbols-outlined text-base">history</span>
          <span>Historial de Semestres y Actas Cerradas</span>
        </button>
      </div>

      {/* 4. Contenido Pestaña 1: Semestre en Curso con Calificaciones Parciales */}
      {activeTab === 'current' && (
        <div className="space-y-5">
          <div className="rounded-xl border border-[#BAE6FD] bg-[#F0F9FF] p-4 text-xs text-[#0369A1] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-xl">info</span>
              <div>
                <strong>Acta en estado Abierta:</strong> Las calificaciones parciales son
                actualizadas por los docentes responsables. El promedio final será acreditado al
                término del periodo académico.
              </div>
            </div>
            <span className="text-[11px] font-bold text-[#0B4F6C]">Cierre: Julio 2026</span>
          </div>

          <div className="space-y-4">
            {expediente.currentTerm.courses.map((course) => (
              <div
                className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs transition hover:border-[#CBD5E1]"
                key={course.code}
              >
                {/* Cabecera del ramo */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-[#0B4F6C] bg-[#E8F3F8] px-2 py-0.5 rounded-md">
                        {course.code} · Sec. {course.section}
                      </span>
                      <span className="text-xs text-[#64748B] font-semibold">
                        {course.credits} Créditos SCT
                      </span>
                    </div>
                    <h3 className="mt-1 text-base sm:text-lg font-bold text-[#1F2937]">
                      {course.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="block text-[10px] font-bold uppercase text-[#64748B]">
                        Promedio Parcial
                      </span>
                      <span className="text-lg font-extrabold text-[#0B4F6C]">
                        {course.provisionalAverage}
                      </span>
                    </div>

                    <div className="border-l border-[#E2E8F0] pl-3 text-right">
                      <span className="block text-[10px] font-bold uppercase text-[#64748B]">
                        Asistencia
                      </span>
                      <span className="text-lg font-extrabold text-[#16856A]">
                        {course.attendance}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tabla de Evaluaciones Parciales */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] text-[#64748B] uppercase text-[10px] tracking-wider">
                        <th className="pb-2 font-bold">Actividad Evaluativa</th>
                        <th className="pb-2 font-bold text-center">Ponderación</th>
                        <th className="pb-2 font-bold text-right">Calificación</th>
                        <th className="pb-2 font-bold text-right">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {course.partialGrades.map((g, idx) => {
                        const isPending = g.grade === 'Pendiente'
                        return (
                          <tr className="hover:bg-[#F8FAFC]" key={idx}>
                            <td className="py-2.5 font-medium text-[#1F2937]">{g.name}</td>
                            <td className="py-2.5 text-center font-semibold text-[#64748B]">
                              {g.weight}
                            </td>
                            <td className="py-2.5 text-right font-extrabold text-[#1F2937]">
                              {g.grade}
                            </td>
                            <td className="py-2.5 text-right">
                              {isPending ? (
                                <Badge size="sm" variant="warning">
                                  Por Rendir
                                </Badge>
                              ) : (
                                <Badge size="sm" variant="success">
                                  Registrada
                                </Badge>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Footer del Ramo */}
                <div className="mt-3 flex items-center justify-between pt-3 border-t border-[#F1F5F9] text-xs text-[#64748B]">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-[#17B6A4]" />
                    {course.actaStatus}
                  </span>

                  <button
                    className="font-bold text-[#0B4F6C] hover:underline"
                    onClick={() => setSelectedCourseForDetail(course)}
                    type="button"
                  >
                    Ver desglose de ponderaciones y syllabus &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Contenido Pestaña 2: Historial de Semestres y Actas Cerradas */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {expediente.pastTerms.map((term, tIdx) => (
            <div
              className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-xs"
              key={tIdx}
            >
              {/* Cabecera del Semestre Histórico */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3 mb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#16856A]">
                    Periodo Académico Completado
                  </span>
                  <h3 className="text-lg font-extrabold text-[#1F2937]">{term.period}</h3>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-[#64748B]">
                    <span>Acta Oficial: <strong className="font-mono text-[#1F2937]">{term.actaNumber}</strong></span>
                    <span>·</span>
                    <span>Cierre: {term.closedDate}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-2 text-right">
                    <span className="block text-[10px] font-bold uppercase text-[#166534]">
                      Promedio del Periodo
                    </span>
                    <span className="text-xl font-black text-[#166534]">{term.termAverage}</span>
                  </div>
                </div>
              </div>

              {/* Tabla de Asignaturas del Semestre Histórico */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] text-[#64748B] uppercase text-[10px] tracking-wider">
                      <th className="pb-2 font-bold">Código</th>
                      <th className="pb-2 font-bold">Asignatura</th>
                      <th className="pb-2 font-bold text-center">Créditos</th>
                      <th className="pb-2 font-bold text-center">Nota Final</th>
                      <th className="pb-2 font-bold text-right">Condición</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {term.courses.map((c) => (
                      <tr className="hover:bg-[#F8FAFC]" key={c.code}>
                        <td className="py-2.5 font-mono font-bold text-[#0B4F6C]">{c.code}</td>
                        <td className="py-2.5 font-semibold text-[#1F2937]">{c.name}</td>
                        <td className="py-2.5 text-center text-[#64748B]">{c.credits} SCT</td>
                        <td className="py-2.5 text-center font-extrabold text-sm text-[#1F2937]">
                          {c.grade}
                        </td>
                        <td className="py-2.5 text-right">
                          <Badge
                            size="sm"
                            variant={c.status.includes('distinción') ? 'accent' : 'success'}
                          >
                            {c.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Certificado Oficial Generado */}
      {certModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-2xl">
            <button
              aria-label="Cerrar modal"
              className="absolute right-4 top-4 rounded-full p-1 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1F2937]"
              onClick={() => setCertModalOpen(false)}
              type="button"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="text-center">
              <span className="grid size-12 mx-auto place-items-center rounded-2xl bg-[#F0FDF4] text-[#16856A]">
                <span className="material-symbols-outlined text-2xl">verified</span>
              </span>
              <h3 className="mt-3 text-lg font-bold text-[#1F2937]">
                Certificado Oficial de Calificaciones
              </h3>
              <p className="mt-1 text-xs text-[#4B5563]">
                Documento acreditado por la Dirección de Registro Académico Institucional.
              </p>
            </div>

            <div className="my-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Folio de verificación:</span>
                <span className="font-mono font-bold text-[#0B4F6C]">CERT-2026-X8921B</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Estudiante:</span>
                <span className="font-semibold text-[#1F2937]">Esteban Morales Sepúlveda</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">PGA Acumulado:</span>
                <span className="font-bold text-[#16856A]">{expediente.pga}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Firma Digital:</span>
                <span className="font-mono text-[10px] text-[#64748B]">SHA256: 9b2d...4a1f (Válido)</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-xs font-bold text-[#4B5563] hover:bg-[#F8FAFC]"
                onClick={() => setCertModalOpen(false)}
                type="button"
              >
                Cerrar
              </button>
              <button
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
                  certDownloaded
                    ? 'bg-[#16856A] text-white'
                    : 'bg-[#0B4F6C] text-white hover:bg-[#083C53]'
                }`}
                onClick={handleSaveCertificateFile}
                type="button"
              >
                <span className="material-symbols-outlined text-sm">
                  {certDownloaded ? 'check' : 'download'}
                </span>
                <span>{certDownloaded ? '¡Descargado!' : 'Guardar archivo'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalle de Asignatura */}
      {selectedCourseForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-2xl">
            <button
              aria-label="Cerrar modal"
              className="absolute right-4 top-4 rounded-full p-1 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1F2937]"
              onClick={() => setSelectedCourseForDetail(null)}
              type="button"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <span className="font-mono text-xs font-bold text-[#0B4F6C]">
              {selectedCourseForDetail.code} · Sección {selectedCourseForDetail.section}
            </span>
            <h3 className="mt-1 text-base font-bold text-[#1F2937]">
              {selectedCourseForDetail.name}
            </h3>

            <div className="my-4 space-y-2 text-xs">
              <div className="flex justify-between border-b border-[#E2E8F0] pb-2">
                <span className="text-[#64748B]">Créditos SCT:</span>
                <span className="font-bold text-[#1F2937]">{selectedCourseForDetail.credits}</span>
              </div>
              <div className="flex justify-between border-b border-[#E2E8F0] pb-2">
                <span className="text-[#64748B]">Porcentaje de Asistencia:</span>
                <span className="font-bold text-[#16856A]">{selectedCourseForDetail.attendance}</span>
              </div>
              <div className="flex justify-between border-b border-[#E2E8F0] pb-2">
                <span className="text-[#64748B]">Estado de la Sección:</span>
                <Badge size="sm" variant="primary">{selectedCourseForDetail.actaStatus}</Badge>
              </div>
            </div>

            <button
              className="w-full rounded-xl bg-[#0B4F6C] py-2 text-xs font-bold text-white hover:bg-[#083C53]"
              onClick={() => setSelectedCourseForDetail(null)}
              type="button"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
