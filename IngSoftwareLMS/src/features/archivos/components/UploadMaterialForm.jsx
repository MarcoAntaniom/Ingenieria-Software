import { useState } from 'react'
import { toast } from 'sonner'
import FileDropzoneUploader from '../../../shared/components/ui/FileDropzoneUploader'
import { uploadMaterialEstudio } from '../api/archivosApi'

/**
 * Formulario exclusivo para Docentes y Administradores que permite publicar
 * materiales de estudio arrastrando y soltando archivos, asignándolos
 * obligatoriamente a una sección académica (nunca en general).
 */
export default function UploadMaterialForm({
  sections = [],
  defaultSeccionId = '',
  onUploaded,
}) {
  const [selectedSeccion, setSelectedSeccion] = useState(
    defaultSeccionId ? String(defaultSeccionId) : '',
  )
  const [titulo, setTitulo] = useState('')

  const effectiveSeccionId =
    defaultSeccionId ||
    selectedSeccion ||
    (sections.length > 0 ? String(sections[0].id) : '')

  return (
    <div className="space-y-4 rounded-2xl border border-line bg-card p-6 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary">
            <span className="material-symbols-outlined text-xs">school</span>
            Exclusivo Docente / Administrador · Asignado por Sección
          </span>
          <h2 className="mt-1 text-sm font-extrabold text-ink">
            Subir Material de Estudio a la Sección (Drag & Drop)
          </h2>
          <p className="text-xs text-muted">
            Todo material de estudio debe estar asignado a una sección específica.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {!defaultSeccionId && (
          <div>
            <label className="mb-1 block text-xs font-bold text-ink">
              Sección destino (obligatorio)
            </label>
            <select
              className="w-full rounded-xl border border-line bg-subtle px-3.5 py-2 text-xs font-semibold text-ink"
              onChange={(e) => setSelectedSeccion(e.target.value)}
              required
              value={effectiveSeccionId}
            >
              {sections.length === 0 ? (
                <option value="">No hay secciones disponibles</option>
              ) : (
                sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.code} · {sec.title} (Sec. {sec.section})
                  </option>
                ))
              )}
            </select>
          </div>
        )}

        <div className={defaultSeccionId ? 'sm:col-span-2' : ''}>
          <label className="mb-1 block text-xs font-bold text-ink">
            Título o prefijo descriptivo del material (opcional)
          </label>
          <input
            className="w-full rounded-xl border border-line bg-subtle px-3.5 py-2 text-xs text-ink"
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej: Unidad 2 - Patrones de Diseño y Arquitectura"
            value={titulo}
          />
        </div>
      </div>

      {!effectiveSeccionId ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-950">
          Debes contar con una sección académica seleccionada para poder asignar y subir materiales de estudio.
        </div>
      ) : (
        <FileDropzoneUploader
          customUploadFn={(files, onProgress) => {
            if (!effectiveSeccionId) {
              toast.error(
                'Debes seleccionar una sección para asignar el material de estudio.',
              )
              return Promise.reject(
                new Error('Sección requerida para subir material.'),
              )
            }
            return uploadMaterialEstudio(
              {
                files,
                seccion: Number(effectiveSeccionId),
                titulo,
              },
              onProgress,
            )
          }}
          label="Arrastra y suelta aquí el material de estudio para publicarlo en la sección seleccionada"
          onUploadComplete={(created) => {
            setTitulo('')
            onUploaded?.(created)
          }}
        />
      )}
    </div>
  )
}
