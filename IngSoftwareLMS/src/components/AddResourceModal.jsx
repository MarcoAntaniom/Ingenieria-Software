import { useState } from 'react'

export function AddResourceModal({ isOpen, onClose, onCourseEnrolled }) {
  const [tab, setTab] = useState('enroll') // 'enroll' | 'upload'
  const [selectedElective, setSelectedElective] = useState('')
  const [uploadedTitle, setUploadedTitle] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  if (!isOpen) return null

  const availableElectives = [
    { code: 'INF-450', title: 'Seguridad en Aplicaciones Web y Criptografía', teacher: 'Prof. Carlos Pinto', credits: 6 },
    { code: 'INF-480', title: 'Inteligencia Artificial y Aprendizaje Profundo', teacher: 'Prof. Valeria Soto', credits: 6 },
    { code: 'INF-390', title: 'Desarrollo de Aplicaciones Móviles Nativas', teacher: 'Prof. David Araya', credits: 5 },
  ]

  function handleEnroll(e) {
    e.preventDefault()
    if (!selectedElective) return

    const courseFound = availableElectives.find((c) => c.code === selectedElective)
    if (courseFound) {
      setSuccessMsg(`¡Inscripción exitosa en ${courseFound.code}: ${courseFound.title}!`)
      setTimeout(() => {
        onCourseEnrolled?.(courseFound)
        setSuccessMsg('')
        onClose()
      }, 1200)
    }
  }

  function handleUploadResource(e) {
    e.preventDefault()
    if (!uploadedTitle.trim()) return

    setSuccessMsg(`¡Recurso "${uploadedTitle}" cargado a tu biblioteca académica personal!`)
    setTimeout(() => {
      setSuccessMsg('')
      onClose()
    }, 1200)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl border border-line bg-card p-6 shadow-2xl">
        <button
          aria-label="Cerrar modal"
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted hover:bg-subtle hover:text-ink"
          onClick={onClose}
          type="button"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="border-b border-line pb-3">
          <div className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined font-bold">add_circle</span>
            <span className="text-xs font-bold uppercase tracking-wider">
              Acción Rápida
            </span>
          </div>
          <h3 className="text-xl font-extrabold text-ink mt-0.5">
            Agregar Recursos e Inscripciones
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Inscribe asignaturas electivas del periodo o almacena tus propios materiales de estudio.
          </p>
        </div>

        {/* Pestañas */}
        <div className="flex gap-2 my-3 border-b border-line pb-2">
          <button
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
              tab === 'enroll'
                ? 'bg-primary text-white shadow-xs'
                : 'text-muted hover:bg-subtle hover:text-ink'
            }`}
            onClick={() => setTab('enroll')}
            type="button"
          >
            <span className="material-symbols-outlined text-base">how_to_reg</span>
            Inscribir Asignatura
          </button>
          <button
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
              tab === 'upload'
                ? 'bg-primary text-white shadow-xs'
                : 'text-muted hover:bg-subtle hover:text-ink'
            }`}
            onClick={() => setTab('upload')}
            type="button"
          >
            <span className="material-symbols-outlined text-base">upload_file</span>
            Subir Recurso de Estudio
          </button>
        </div>

        {successMsg && (
          <div className="mb-3 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-base">check_circle</span>
            {successMsg}
          </div>
        )}

        {tab === 'enroll' ? (
          <form onSubmit={handleEnroll} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">
                Selecciona una asignatura disponible con cupos abiertos:
              </label>
              <div className="space-y-2">
                {availableElectives.map((el) => (
                  <label
                    className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition ${
                      selectedElective === el.code
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        : 'border-line hover:bg-subtle/50'
                    }`}
                    key={el.code}
                  >
                    <input
                      checked={selectedElective === el.code}
                      className="mt-0.5 text-primary focus:ring-primary"
                      name="elective"
                      onChange={() => setSelectedElective(el.code)}
                      type="radio"
                      value={el.code}
                    />
                    <div className="text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary">{el.code}</span>
                        <span className="font-bold text-ink">{el.title}</span>
                      </div>
                      <p className="text-muted text-[11px] mt-0.5">
                        {el.teacher} · {el.credits} Créditos SCT
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-line">
              <button
                className="rounded-xl px-4 py-2 text-xs font-semibold text-muted hover:bg-subtle transition"
                onClick={onClose}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary-dark transition disabled:opacity-50"
                disabled={!selectedElective}
                type="submit"
              >
                Confirmar Inscripción
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleUploadResource} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-ink mb-1">
                Título o descripción del recurso
              </label>
              <input
                className="w-full rounded-xl border border-line bg-subtle p-2.5 text-xs focus:border-primary focus:bg-card focus:ring-0"
                onChange={(e) => setUploadedTitle(e.target.value)}
                placeholder="Ej. Resumen de Cátedra Arquitectura C4..."
                required
                type="text"
                value={uploadedTitle}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink mb-1">
                Archivo (PDF, ZIP, DOCX)
              </label>
              <input
                className="w-full rounded-xl border border-line bg-subtle p-2 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white"
                required
                type="file"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-line">
              <button
                className="rounded-xl px-4 py-2 text-xs font-semibold text-muted hover:bg-subtle transition"
                onClick={onClose}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary-dark transition"
                type="submit"
              >
                Cargar recurso
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
