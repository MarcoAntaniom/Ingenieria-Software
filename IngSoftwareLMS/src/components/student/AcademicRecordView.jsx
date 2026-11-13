import { useState } from 'react'
import { ACADEMIC_EXPEDIENTE } from '../../data/mockData'
import { Badge } from '../ui/Badge'
import { ProgressBar } from '../ui/ProgressBar'
import { useLanguage } from '../../contexts/LanguageContext'

export function AcademicRecordView({ onBackToDashboard }) {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState('current') // 'current' | 'history'
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
- Promedio Ponderado Acumulado (PPA): ${expediente.pga}
- Créditos Aprobados: ${expediente.completedCredits} / ${expediente.totalCredits} SCT (${expediente.progressPercentage}%)
- Total Asignaturas Aprobadas: ${expediente.completedCredits / 6}
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
      {/* 1. Encabezado del Expediente y Acciones */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-white bg-white dark:bg-[#111B2E] [data-theme=contrast]_&:bg-[#0D0D0D] p-5 sm:p-6 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[#0B5575] dark:text-[#67E8F9] [data-theme=contrast]_&:text-[#00B7FF]">
            <span className="material-symbols-outlined text-lg">history_edu</span>
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {t('expediente.badge')}
            </span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-[26px] font-extrabold tracking-tight text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white">
            {t('expediente.title')}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#475569] dark:text-[#CBD5E1] [data-theme=contrast]_&:text-[#F2F2F2]">
            {expediente.career} · Estudiante:{' '}
            <strong className="text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white">{t('expediente.student_name')}</strong> (RUT 20.123.456-7)
          </p>
        </div>

        {/* Acciones principales */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onBackToDashboard && (
            <button
              className="btn-secondary inline-flex items-center gap-1.5 rounded-xl border border-[#CBD5E1] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-[#F8FAFC] dark:bg-[#16243A] [data-theme=contrast]_&:bg-black px-3.5 py-2 text-xs font-bold text-[#475569] dark:text-[#CBD5E1] [data-theme=contrast]_&:text-white hover:bg-[#F1F5F9] dark:hover:bg-[#1D2F46] [data-theme=contrast]_&:hover:bg-[#262626] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5575] dark:focus-visible:ring-[#67E8F9] [data-theme=contrast]_&:focus-visible:ring-[#FFD400]"
              onClick={onBackToDashboard}
              type="button"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              {t('expediente.back_to_dashboard')}
            </button>
          )}

          <button
            className="btn-primary inline-flex items-center gap-2 rounded-xl bg-[#0B5575] hover:bg-[#074968] dark:bg-[#0E7490] dark:hover:bg-[#155E75] [data-theme=contrast]_&:bg-white [data-theme=contrast]_&:text-black [data-theme=contrast]_&:hover:bg-[#FFD400] px-4 py-2 text-xs font-bold text-white shadow-xs transition disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5575] dark:focus-visible:ring-[#67E8F9] [data-theme=contrast]_&:focus-visible:ring-[#FFD400]"
            disabled={downloadingCert}
            onClick={handleDownloadCertificate}
            type="button"
          >
            <span className="material-symbols-outlined text-base">
              {downloadingCert ? 'sync' : 'download'}
            </span>
            <span>
              {downloadingCert
                ? t('expediente.downloading')
                : t('expediente.download_certificate')}
            </span>
          </button>
        </div>
      </div>

      {/* 2. KPI Cards: Altura mínima 132px, padding 20px, valor numérico dominante 28-32px */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Promedio PPA - Destacado #F8FAFC en modo oscuro, blanco en alto contraste */}
        <div className="min-h-[132px] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-white dark:bg-[#111B2E] [data-theme=contrast]_&:bg-[#0D0D0D] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">
            <span className="text-xs font-bold uppercase tracking-wider">
              {t('expediente.kpi_gpa')}
            </span>
            <span className="material-symbols-outlined text-xl text-[#0B5575] dark:text-[#67E8F9] [data-theme=contrast]_&:text-[#00B7FF]">
              grade
            </span>
          </div>
          <div className="my-1.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tabular-nums text-[#0B5575] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white">
              {expediente.pga}
            </span>
            <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">
              / 7.0
            </span>
          </div>
          <div>
            <Badge size="sm" variant="success">
              {t('expediente.kpi_outstanding')}
            </Badge>
          </div>
        </div>

        {/* KPI 2: Avance Curricular */}
        <div className="min-h-[132px] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-white dark:bg-[#111B2E] [data-theme=contrast]_&:bg-[#0D0D0D] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">
            <span className="text-xs font-bold uppercase tracking-wider">{t('expediente.curricular_progress')}</span>
            <span className="material-symbols-outlined text-xl text-[#067647] dark:text-[#6EE7B7] [data-theme=contrast]_&:text-[#00F084]">
              trending_up
            </span>
          </div>
          <div className="my-1.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tabular-nums text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white">
              {expediente.progressPercentage}%
            </span>
            <span className="text-xs text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">{t('expediente.completed')}</span>
          </div>
          <div>
            <ProgressBar showLabel={false} value={expediente.progressPercentage} />
          </div>
        </div>

        {/* KPI 3: Créditos SCT - Destacar 126 y reducir peso visual del total / 240 SCT */}
        <div className="min-h-[132px] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-white dark:bg-[#111B2E] [data-theme=contrast]_&:bg-[#0D0D0D] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">
            <span className="text-xs font-bold uppercase tracking-wider">
              {t('expediente.kpi_credits')}
            </span>
            <span className="material-symbols-outlined text-xl text-[#B54708] dark:text-[#FCD34D] [data-theme=contrast]_&:text-[#FFE600]">
              verified
            </span>
          </div>
          <div className="my-1.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tabular-nums text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white">
              {expediente.completedCredits}
            </span>
            <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">
              / {expediente.totalCredits} SCT
            </span>
          </div>
          <div>
            <Badge size="sm" variant="primary">
              {t('expediente.kpi_credits_badge', { percent: expediente.progressPercentage })}
            </Badge>
          </div>
        </div>

        {/* KPI 4: Estado Académico */}
        <div className="min-h-[132px] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-white dark:bg-[#11182E] [data-theme=contrast]_&:bg-[#0D0D0D] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">
            <span className="text-xs font-bold uppercase tracking-wider">
              {t('expediente.kpi_status')}
            </span>
            <span className="material-symbols-outlined text-xl text-[#067647] dark:text-[#6EE7B7] [data-theme=contrast]_&:text-[#00F084]">
              check_circle
            </span>
          </div>
          <div className="my-1.5">
            <span className="text-base sm:text-lg font-extrabold text-[#067647] dark:text-[#6EE7B7] [data-theme=contrast]_&:text-[#00F084]">
              {t('expediente.kpi_status_val')}
            </span>
          </div>
          <div>
            <Badge size="sm" variant="success">
              {t('expediente.kpi_status_desc')}
            </Badge>
          </div>
        </div>
      </div>

      {/* 3. Selector de Pestañas Contenidas con fondo neutro y tab activa sólida */}
      <div className="inline-flex rounded-xl bg-[#F1F5F9] dark:bg-[#16243A] [data-theme=contrast]_&:bg-black p-1 border border-[#CBD5E1] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6]">
        <button
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5575] dark:focus-visible:ring-[#67E8F9] [data-theme=contrast]_&:focus-visible:ring-[#FFD400] ${
            activeTab === 'current'
              ? 'bg-[#0B5575] text-white dark:bg-[#0E7490] [data-theme=contrast]_&:bg-white [data-theme=contrast]_&:text-black shadow-xs'
              : 'text-[#475569] dark:text-[#CBD5E1] [data-theme=contrast]_&:text-white hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
          }`}
          onClick={() => setActiveTab('current')}
          type="button"
        >
          <span className="material-symbols-outlined text-base">fact_check</span>
          <span>{t('expediente.tab_current')}</span>
        </button>

        <button
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5575] dark:focus-visible:ring-[#67E8F9] [data-theme=contrast]_&:focus-visible:ring-[#FFD400] ${
            activeTab === 'history'
              ? 'bg-[#0B5575] text-white dark:bg-[#0E7490] [data-theme=contrast]_&:bg-white [data-theme=contrast]_&:text-black shadow-xs'
              : 'text-[#475569] dark:text-[#CBD5E1] [data-theme=contrast]_&:text-white hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
          }`}
          onClick={() => setActiveTab('history')}
          type="button"
        >
          <span className="material-symbols-outlined text-base">history</span>
          <span>{t('expediente.tab_history')}</span>
        </button>
      </div>

      {/* 4. Contenido Pestaña 1: Semestre en Curso con Calificaciones */}
      {activeTab === 'current' && (
        <div className="space-y-5">
          {/* Banner de Acta Abierta: Fondo suave #102F46, icono #7DD3FC en oscuro; borde cian en alto contraste */}
          <div className="rounded-xl border border-[#BAE6FD] dark:border-[#155E75] [data-theme=contrast]_&:border-[#66D9FF] bg-[#EFF8FB] dark:bg-[#102F46] [data-theme=contrast]_&:bg-[#0D0D0D] p-4 text-xs text-[#0B5575] dark:text-[#7DD3FC] [data-theme=contrast]_&:text-[#66D9FF] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-xl shrink-0 text-[#0B5575] dark:text-[#7DD3FC] [data-theme=contrast]_&:text-[#66D9FF]">
                info
              </span>
              <div>
                <strong>{t('expediente.acta_open_title')}</strong> {t('expediente.open_report_banner')}
              </div>
            </div>
            <span className="text-[11px] font-bold text-[#0B5575] dark:text-[#7DD3FC] [data-theme=contrast]_&:text-[#66D9FF] shrink-0">
              {t('expediente.close_date_prefix')}
            </span>
          </div>

          <div className="space-y-4">
            {expediente.currentTerm.courses.map((course) => (
              <div
                className="rounded-2xl border border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-white dark:bg-[#111B2E] [data-theme=contrast]_&:bg-[#0D0D0D] p-5 shadow-xs transition hover:border-[#CBD5E1] dark:hover:border-[#5D718B]"
                key={course.code}
              >
                {/* Encabezado del desglose: Asignatura a la izq, Promedio y Asistencia a la der */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] pb-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-[#0B5575] dark:text-[#67E8F9] [data-theme=contrast]_&:text-[#00B7FF] bg-[#EFF8FB] dark:bg-[#123B49] [data-theme=contrast]_&:bg-black [data-theme=contrast]_&:border [data-theme=contrast]_&:border-[#00B7FF] px-2 py-0.5 rounded-md">
                        {course.code} · Sec. {course.section}
                      </span>
                      <span className="text-xs text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9] font-semibold">
                        {t('expediente.credits_label', { credits: course.credits })}
                      </span>
                    </div>
                    <h3 className="mt-1 text-base sm:text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white">
                      {course.name}
                    </h3>
                  </div>

                  {/* Agrupación a la derecha */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="block text-[10px] font-bold uppercase text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">
                        {t('expediente.gpa_average')}
                      </span>
                      <span className="text-lg font-extrabold tabular-nums text-[#0B5575] dark:text-[#67E8F9] [data-theme=contrast]_&:text-[#00B7FF]">
                        {course.provisionalAverage}
                      </span>
                    </div>

                    <div className="border-l border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] pl-4 text-right">
                      <span className="block text-[10px] font-bold uppercase text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">
                        {t('expediente.attendance_label')}
                      </span>
                      <span className="text-lg font-extrabold tabular-nums text-[#067647] dark:text-[#6EE7B7] [data-theme=contrast]_&:text-[#00F084]">
                        {course.attendance}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tabla de Calificaciones: filas 44-48px, alineación tabular-nums estricta a la derecha */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9] uppercase text-[10px] tracking-wider">
                        <th className="pb-2.5 font-bold text-left">{t('grades.evaluation')}</th>
                        <th className="pb-2.5 font-bold text-right tabular-nums">{t('grades.weight')}</th>
                        <th className="pb-2.5 font-bold text-right tabular-nums">{t('grades.grade')}</th>
                        <th className="pb-2.5 font-bold text-right">{t('grades.status')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9] dark:divide-[#2A3A52] [data-theme=contrast]_&:divide-[#A6A6A6]">
                      {course.partialGrades.map((g, idx) => {
                        const isPending = g.grade === 'Pendiente'
                        return (
                          <tr
                            className="hover:bg-[#F8FAFC] dark:hover:bg-[#16243A] [data-theme=contrast]_&:hover:bg-[#262626] transition h-11 min-h-[44px]"
                            key={idx}
                          >
                            <td className="py-2.5 font-medium text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white text-left">
                              {g.name}
                            </td>
                            {/* Alineación numérica estricta a la derecha para ponderaciones y notas */}
                            <td className="py-2.5 text-right font-semibold tabular-nums text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">
                              {g.weight}
                            </td>
                            <td className={`py-2.5 text-right font-extrabold tabular-nums ${
                              isPending
                                ? 'text-[#B54708] dark:text-[#FCD34D] [data-theme=contrast]_&:text-[#FFE600]'
                                : 'text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white'
                            }`}>
                              {g.grade}
                            </td>
                            {/* Badges de estado textuales y accesibles: Aprobada / Por rendir */}
                            <td className="py-2.5 text-right">
                              {isPending ? (
                                <Badge size="sm" variant="warning">
                                  {t('expediente.pending_badge')}
                                </Badge>
                              ) : (
                                <Badge size="sm" variant="success">
                                  {t('expediente.approved_badge')}
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
                <div className="mt-3 flex items-center justify-between pt-3 border-t border-[#F1F5F9] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] text-xs text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-[#087F78] dark:bg-[#2DD4BF] [data-theme=contrast]_&:bg-[#00F084]" />
                    {course.actaStatus}
                  </span>

                  <button
                    className="font-bold text-[#0B5575] dark:text-[#67E8F9] [data-theme=contrast]_&:text-[#00B7FF] hover:underline"
                    onClick={() => setSelectedCourseForDetail(course)}
                    type="button"
                  >
                    {t('expediente.view_syllabus_link')}
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
              className="rounded-2xl border border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-white dark:bg-[#111B2E] [data-theme=contrast]_&:bg-[#0D0D0D] p-5 sm:p-6 shadow-xs"
              key={tIdx}
            >
              {/* Cabecera del Semestre Histórico */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] pb-3 mb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#067647] dark:text-[#6EE7B7] [data-theme=contrast]_&:text-[#00F084]">
                    {t('expediente.term_completed')}
                  </span>
                  <h3 className="text-lg font-extrabold text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white">
                    {term.period}
                  </h3>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">
                    <span>
                      {t('expediente.act_official')} <strong className="font-mono text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white">{term.actaNumber}</strong>
                    </span>
                    <span>·</span>
                    <span>Cierre: {term.closedDate}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-xl border border-[#A6F4C5] dark:border-[#0F766E] [data-theme=contrast]_&:border-[#00F084] [data-theme=contrast]_&:border-2 bg-[#ECFDF3] dark:bg-[#123B30] [data-theme=contrast]_&:bg-black px-4 py-2 text-right">
                    <span className="block text-[10px] font-bold uppercase text-[#067647] dark:text-[#6EE7B7] [data-theme=contrast]_&:text-[#00F084]">
                      {t('expediente.term_average')}
                    </span>
                    <span className="text-xl font-black tabular-nums text-[#067647] dark:text-[#6EE7B7] [data-theme=contrast]_&:text-[#00F084]">
                      {term.termAverage}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabla de Asignaturas del Semestre Histórico */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9] uppercase text-[10px] tracking-wider">
                      <th className="pb-2.5 font-bold text-left">Código</th>
                      <th className="pb-2.5 font-bold text-left">Asignatura</th>
                      <th className="pb-2.5 font-bold text-right tabular-nums">Créditos</th>
                      <th className="pb-2.5 font-bold text-right tabular-nums">Nota Final</th>
                      <th className="pb-2.5 font-bold text-right">Condición</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9] dark:divide-[#2A3A52] [data-theme=contrast]_&:divide-[#A6A6A6]">
                    {term.courses.map((c) => (
                      <tr
                        className="hover:bg-[#F8FAFC] dark:hover:bg-[#16243A] [data-theme=contrast]_&:hover:bg-[#262626] transition h-11 min-h-[44px]"
                        key={c.code}
                      >
                        <td className="py-2.5 font-mono font-bold text-[#0B5575] dark:text-[#67E8F9] [data-theme=contrast]_&:text-[#00B7FF] text-left">
                          {c.code}
                        </td>
                        <td className="py-2.5 font-semibold text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white text-left">
                          {c.name}
                        </td>
                        <td className="py-2.5 text-right tabular-nums text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">
                          {c.credits} SCT
                        </td>
                        <td className="py-2.5 text-right font-extrabold tabular-nums text-sm text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl border border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-white bg-white dark:bg-[#1D2F46] [data-theme=contrast]_&:bg-[#0D0D0D] p-6 shadow-2xl">
            <button
              aria-label="Cerrar modal"
              className="absolute right-4 top-4 rounded-lg p-1 text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-white hover:bg-[#F1F5F9] dark:hover:bg-[#223047] [data-theme=contrast]_&:hover:bg-[#262626]"
              onClick={() => setCertModalOpen(false)}
              type="button"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="text-center">
              <span className="grid size-12 mx-auto place-items-center rounded-2xl bg-[#ECFDF3] dark:bg-[#123B30] [data-theme=contrast]_&:bg-black [data-theme=contrast]_&:border [data-theme=contrast]_&:border-[#00F084] text-[#067647] dark:text-[#6EE7B7] [data-theme=contrast]_&:text-[#00F084]">
                <span className="material-symbols-outlined text-2xl">verified</span>
              </span>
              <h3 className="mt-3 text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white">
                Certificado Oficial de Calificaciones
              </h3>
              <p className="mt-1 text-xs text-[#475569] dark:text-[#CBD5E1] [data-theme=contrast]_&:text-[#F2F2F2]">
                Documento acreditado por la Dirección de Registro Académico Institucional.
              </p>
            </div>

            <div className="my-4 rounded-xl border border-[#E2E8F0] dark:border-[#2F4058] [data-theme=contrast]_&:border-white bg-[#F8FAFC] dark:bg-[#111827] [data-theme=contrast]_&:bg-black p-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">Folio de verificación:</span>
                <span className="font-mono font-bold text-[#0B5575] dark:text-[#67E8F9] [data-theme=contrast]_&:text-[#00B7FF]">
                  CERT-2026-X8921B
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">Estudiante:</span>
                <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white">
                  Esteban Morales Sepúlveda
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">PGA Acumulado:</span>
                <span className="font-bold tabular-nums text-[#067647] dark:text-[#6EE7B7] [data-theme=contrast]_&:text-[#00F084]">
                  {expediente.pga}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">Firma Digital:</span>
                <span className="font-mono text-[10px] text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">
                  SHA256: 9b2d...4a1f (Válido)
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                className="btn-secondary rounded-xl border border-[#CBD5E1] dark:border-[#2F4058] [data-theme=contrast]_&:border-white bg-white dark:bg-[#111827] [data-theme=contrast]_&:bg-black px-4 py-2 text-xs font-bold text-[#475569] dark:text-[#CBD5E1] [data-theme=contrast]_&:text-white hover:bg-[#F8FAFC] dark:hover:bg-[#223047] [data-theme=contrast]_&:hover:bg-[#262626]"
                onClick={() => setCertModalOpen(false)}
                type="button"
              >
                Cerrar
              </button>
              <button
                className={`btn-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
                  certDownloaded
                    ? 'bg-[#067647] text-white dark:bg-[#0F766E]'
                    : 'bg-[#0B5575] text-white hover:bg-[#074968] dark:bg-[#0E7490] dark:hover:bg-[#155E75]'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl border border-[#E2E8F0] dark:border-[#2F4058] [data-theme=contrast]_&:border-white bg-white dark:bg-[#182235] [data-theme=contrast]_&:bg-[#1A1A1A] p-6 shadow-2xl">
            <button
              aria-label="Cerrar modal"
              className="absolute right-4 top-4 rounded-lg p-1 text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-white hover:bg-[#F1F5F9] dark:hover:bg-[#223047] [data-theme=contrast]_&:hover:bg-[#262626]"
              onClick={() => setSelectedCourseForDetail(null)}
              type="button"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <span className="font-mono text-xs font-bold text-[#0B5575] dark:text-[#67E8F9] [data-theme=contrast]_&:text-[#00B7FF]">
              {selectedCourseForDetail.code} · Sección {selectedCourseForDetail.section}
            </span>
            <h3 className="mt-1 text-base font-bold text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white">
              {selectedCourseForDetail.name}
            </h3>

            <div className="my-4 space-y-2 text-xs">
              <div className="flex justify-between border-b border-[#E2E8F0] dark:border-[#2F4058] [data-theme=contrast]_&:border-white pb-2">
                <span className="text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">Créditos SCT:</span>
                <span className="font-bold tabular-nums text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white">
                  {selectedCourseForDetail.credits}
                </span>
              </div>
              <div className="flex justify-between border-b border-[#E2E8F0] dark:border-[#2F4058] [data-theme=contrast]_&:border-white pb-2">
                <span className="text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">Porcentaje de Asistencia:</span>
                <span className="font-bold tabular-nums text-[#067647] dark:text-[#6EE7B7] [data-theme=contrast]_&:text-[#00F084]">
                  {selectedCourseForDetail.attendance}
                </span>
              </div>
              <div className="flex justify-between border-b border-[#E2E8F0] dark:border-[#2F4058] [data-theme=contrast]_&:border-white pb-2">
                <span className="text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">Estado de la Sección:</span>
                <Badge size="sm" variant="primary">
                  {selectedCourseForDetail.actaStatus}
                </Badge>
              </div>
            </div>

            <button
              className="btn-primary w-full rounded-xl bg-[#0B5575] hover:bg-[#074968] dark:bg-[#0E7490] dark:hover:bg-[#155E75] py-2.5 text-xs font-bold text-white transition"
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

export default AcademicRecordView
