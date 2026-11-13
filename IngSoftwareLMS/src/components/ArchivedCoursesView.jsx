import { useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'

export function ArchivedCoursesView({
  archivedCourses,
  onOpenSyllabus,
  onOpenMaterials,
}) {
  const { t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState('')

  const filtered = archivedCourses.filter(
    (c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.teacher.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-line [data-theme=contrast]_&:border-white bg-card p-6 shadow-xs md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2 text-secondary">
            <span className="material-symbols-outlined">history_edu</span>
            <span className="text-xs font-bold uppercase tracking-wider">
              {t('archived.badge')}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-ink mt-1">
            {t('archived.title')}
          </h2>
          <p className="text-xs text-muted mt-0.5">
            {t('archived.subtitle')}
          </p>
        </div>

        <div className="relative min-w-64">
          <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted text-base">
            search
          </span>
          <input
            className="w-full rounded-xl border border-line bg-subtle py-2 pl-9 pr-3 text-xs focus:border-primary focus:bg-card focus:ring-0"
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('archived.search_placeholder')}
            type="search"
            value={searchTerm}
          />
        </div>
      </div>

      {/* Grilla de Cursos Archivados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((course) => (
          <div
            className="flex flex-col justify-between rounded-2xl border border-line [data-theme=contrast]_&:border-[#A6A6A6] bg-card p-5 shadow-xs hover:shadow-md transition"
            key={course.id}
          >
            <div>
              <div className="flex items-center justify-between border-b border-line pb-3">
                <span className="rounded-md bg-subtle px-2.5 py-1 text-xs font-mono font-bold text-primary">
                  {course.code} {course.section ? `· Sec. ${course.section}` : ''}
                </span>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                  {t('archived.accredited_badge')}
                </span>
              </div>

              <div className="mt-3">
                <h3 className="text-base font-extrabold text-ink">{course.title}</h3>
                <p className="text-xs text-muted mt-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-secondary">person</span>
                  Docente: {course.teacher}
                </p>
                <p className="text-xs text-muted mt-0.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-muted">date_range</span>
                  {course.period}
                </p>
              </div>

              {/* Registro de Cierre y Acreditación */}
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-xs text-emerald-950 flex items-center justify-between">
                <div>
                  <span className="font-bold block">{t('archived.final_grade_label')}</span>
                  <span className="text-[11px] text-emerald-800">{t('archived.final_grade_desc')}</span>
                </div>
                <span className="text-2xl font-black text-emerald-700">
                  {course.finalGrade || '6.4'}
                </span>
              </div>
            </div>

            {/* Accesos a Recursos Históricos */}
            <div className="mt-5 pt-3 border-t border-line flex items-center justify-between gap-2">
              <button
                className="flex items-center gap-1.5 rounded-lg border border-line bg-subtle px-3 py-1.5 text-xs font-bold text-ink hover:bg-line transition"
                onClick={() => onOpenMaterials?.(course)}
                type="button"
              >
                <span className="material-symbols-outlined text-sm text-secondary">folder</span>
                {t('archived.study_material')}
              </button>
              <button
                className="flex items-center gap-1.5 rounded-lg border border-line bg-subtle px-3 py-1.5 text-xs font-bold text-primary hover:bg-secondary-container hover:text-on-secondary-container transition"
                onClick={() => onOpenSyllabus?.(course)}
                type="button"
              >
                <span className="material-symbols-outlined text-sm">menu_book</span>
                {t('archived.official_syllabus')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
