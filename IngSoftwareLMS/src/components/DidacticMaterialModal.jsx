import { useState } from 'react'
import { Dialog } from './ui/Dialog'
import { Button } from './ui/Button'
import { useLanguage } from '../contexts/LanguageContext'

export function DidacticMaterialModal({ course, isOpen, onClose }) {
  const { t } = useLanguage()
  const [downloadingId, setDownloadingId] = useState(null)
  const [downloadedId, setDownloadedId] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [previewMaterial, setPreviewMaterial] = useState(null)

  if (!course) return null

  const materials = course.materials || [
    {
      id: 'm1',
      name: 'Guía de Arquitectura de Software C4 y Patrones.pdf',
      size: '2.4 MB',
      type: 'pdf',
      date: '02 Nov 2026',
      contentPreview: 'Este documento detalla las convenciones del modelo C4 para diagramar arquitectura de software...',
    },
    {
      id: 'm2',
      name: 'Pauta Técnica de Laboratorio Docker y Postgres.docx',
      size: '1.1 MB',
      type: 'docx',
      date: '28 Oct 2026',
      contentPreview: 'Instrucciones para desplegar clúster local de PostgreSQL con sharding y réplicas...',
    },
    {
      id: 'm3',
      name: 'Diapositivas Cátedra 4: Patrones CQRS y Microservicios.pptx',
      size: '6.8 MB',
      type: 'slides',
      date: '24 Oct 2026',
      contentPreview: 'Presentación de cátedra con casos de estudio sobre arquitecturas orientadas a eventos...',
    },
    {
      id: 'm4',
      name: 'Matriz de Trazabilidad de Requerimientos SRS.xlsx',
      size: '840 KB',
      type: 'xlsx',
      date: '15 Oct 2026',
      contentPreview: 'Planilla modelo para relacionar casos de uso con requerimientos no funcionales...',
    },
    {
      id: 'm5',
      name: 'Repositorio Oficial de Código y Scripts de Prueba',
      size: 'Enlace web',
      type: 'link',
      date: '01 Oct 2026',
      url: 'https://github.com/universidad/inf-321-lab',
      contentPreview: 'Acceso al repositorio institucional de GitHub con código base para los talleres prácticos.',
    },
  ]

  function getFileIcon(type) {
    switch (type) {
      case 'pdf':
        return { icon: 'picture_as_pdf', color: 'text-[#C53030] bg-[#FEF2F2] border-[#FECACA]', label: 'PDF' }
      case 'docx':
      case 'doc':
        return { icon: 'description', color: 'text-[#075477] bg-[#F0F9FF] border-[#BAE6FD]', label: 'DOCX' }
      case 'xlsx':
      case 'xls':
        return { icon: 'table_view', color: 'text-[#16856A] bg-[#F0FDF4] border-[#BBF7D0]', label: 'XLSX' }
      case 'slides':
      case 'pptx':
        return { icon: 'slideshow', color: 'text-[#B7791F] bg-[#FEFCE8] border-[#FEF08A]', label: 'PPTX' }
      case 'link':
        return { icon: 'link', color: 'text-[#64748B] bg-[#F8FAFC] border-[#E2E8F0]', label: 'Enlace' }
      default:
        return { icon: 'insert_drive_file', color: 'text-[#64748B] bg-[#F8FAFC] border-[#E2E8F0]', label: 'Archivo' }
    }
  }

  function handleDownload(file) {
    setDownloadingId(file.id)
    setTimeout(() => {
      setDownloadingId(null)
      const content = `Campus Virtual LMS - Material Didáctico Oficial\nAsignatura: ${course.code} - ${course.title}\nRecurso: ${file.name}\nTamaño: ${file.size}\nFecha: ${file.date}\nDocente: ${course.teacher}\n`
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', file.name.includes('.') ? file.name : `${file.name}.txt`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      setDownloadedId(file.id)
      setTimeout(() => setDownloadedId(null), 3000)
    }, 600)
  }

  function handleCopyLink(file) {
    navigator.clipboard?.writeText(window.location.href)
    setCopiedId(file.id)
    setTimeout(() => setCopiedId(null), 2500)
  }

  return (
    <>
      <Dialog
        description={`Profesor responsable: ${course.teacher} · Semestre Otoño 2026`}
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-[#64748b] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">
              {t('didactic_modal.resources_count', { count: materials.length })}
            </span>
            <Button onClick={onClose} size="sm" variant="primary">
              {t('didactic_modal.close')}
            </Button>
          </div>
        }
        onClose={onClose}
        open={isOpen}
        size="lg"
        subtitle={`${course.code} ${course.section ? `· Sección ${course.section}` : ''}`}
        title={t('didactic_modal.title')}
      >
        <div className="space-y-3">
          {materials.map((file) => {
            const fileConf = getFileIcon(file.type)
            const isDownloading = downloadingId === file.id
            const isCopied = copiedId === file.id

            return (
              <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-[10px] border border-[#dbe3ec] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-white dark:bg-[#16243A] [data-theme=contrast]_&:bg-[#0D0D0D] p-3.5 hover:bg-[#f8fafc] dark:hover:bg-[#1D2F46] [data-theme=contrast]_&:hover:bg-[#262626] transition"
                key={file.id}
              >
                {/* Metadatos y tipo de archivo */}
                <div className="flex items-start gap-3 min-w-0">
                  <span
                    className={`grid size-10 place-items-center rounded-[8px] border shrink-0 ${fileConf.color}`}
                    title={fileConf.label}
                  >
                    <span className="material-symbols-outlined text-xl">
                      {fileConf.icon}
                    </span>
                  </span>

                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[#172033] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white truncate leading-snug">
                      {file.name}
                    </h4>
                    <p className="text-[11px] text-[#64748b] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9] mt-0.5">
                      {fileConf.label} · {file.size} · Publicado el {file.date}
                    </p>
                  </div>
                </div>

                {/* Acciones claras: Vista previa y Descargar */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    aria-label={`${t('didactic_modal.preview')}: ${file.name}`}
                    className="rounded-[8px] border border-[#dbe3ec] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-white dark:bg-[#111B2E] [data-theme=contrast]_&:bg-black px-3 py-1.5 text-xs font-bold text-[#075477] dark:text-[#67E8F9] [data-theme=contrast]_&:text-[#00B7FF] hover:bg-[#f5f7fb] dark:hover:bg-[#1D2F46] [data-theme=contrast]_&:hover:bg-[#262626] transition"
                    onClick={() => setPreviewMaterial(file)}
                    type="button"
                  >
                    {t('didactic_modal.preview')}
                  </button>

                  <button
                    aria-label={`${t('didactic_modal.download')}: ${file.name}`}
                    className={`inline-flex items-center gap-1.5 rounded-[8px] px-3.5 py-1.5 text-xs font-bold transition disabled:opacity-50 ${
                      downloadedId === file.id
                        ? 'bg-[#16856A] dark:bg-[#123B30] dark:text-[#6EE7B7] [data-theme=contrast]_&:bg-black [data-theme=contrast]_&:text-[#00F084] [data-theme=contrast]_&:border-2 [data-theme=contrast]_&:border-[#00F084] text-white'
                        : 'bg-[#075477] dark:bg-[#0E7490] dark:hover:bg-[#155E75] [data-theme=contrast]_&:bg-white [data-theme=contrast]_&:text-black [data-theme=contrast]_&:hover:bg-[#FFD400] text-white hover:bg-[#064563]'
                    }`}
                    disabled={isDownloading}
                    onClick={() => handleDownload(file)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {downloadedId === file.id ? 'check' : isDownloading ? 'sync' : 'download'}
                    </span>
                    <span>
                      {downloadedId === file.id
                        ? t('didactic_modal.downloaded')
                        : isDownloading
                        ? t('didactic_modal.downloading')
                        : t('didactic_modal.download')}
                    </span>
                  </button>

                  <button
                    aria-label={`${t('didactic_modal.copy_link')}: ${file.name}`}
                    className="grid size-8 place-items-center rounded-[8px] border border-[#dbe3ec] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-white dark:bg-[#111B2E] [data-theme=contrast]_&:bg-black text-[#64748b] dark:text-[#CBD5E1] [data-theme=contrast]_&:text-white hover:bg-[#f1f5f9] dark:hover:bg-[#1D2F46] [data-theme=contrast]_&:hover:bg-[#262626] transition"
                    onClick={() => handleCopyLink(file)}
                    title={isCopied ? t('didactic_modal.copied') : t('didactic_modal.copy_link')}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {isCopied ? 'check' : 'share'}
                    </span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </Dialog>

      {/* Modal de Vista Previa del Documento */}
      {previewMaterial && (
        <Dialog
          description={`Formato: ${previewMaterial.type.toUpperCase()} · Tamaño: ${previewMaterial.size}`}
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                onClick={() => handleDownload(previewMaterial)}
                size="sm"
                variant="secondary"
              >
                {t('didactic_modal.download_copy')}
              </Button>
              <Button
                onClick={() => setPreviewMaterial(null)}
                size="sm"
                variant="primary"
              >
                {t('didactic_modal.close_preview')}
              </Button>
            </div>
          }
          onClose={() => setPreviewMaterial(null)}
          open={Boolean(previewMaterial)}
          size="md"
          subtitle={t('didactic_modal.preview_title')}
          title={previewMaterial.name}
        >
          <div className="space-y-4">
            <div className="rounded-[10px] border border-[#dbe3ec] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-[#f8fafc] dark:bg-[#16243A] [data-theme=contrast]_&:bg-[#0D0D0D] p-4 text-xs leading-relaxed space-y-2">
              <div className="flex items-center gap-2 text-[#075477] dark:text-[#67E8F9] [data-theme=contrast]_&:text-[#00B7FF] font-bold">
                <span className="material-symbols-outlined text-base">visibility</span>
                <span>{t('didactic_modal.preview_label')}</span>
              </div>
              <p className="text-[#172033] dark:text-[#CBD5E1] [data-theme=contrast]_&:text-[#F2F2F2]">
                {previewMaterial.contentPreview || 'Previsualización de contenido didáctico disponible para lectura directa en plataforma.'}
              </p>
            </div>

            <div className="rounded-[8px] border border-[#dbe3ec] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-white dark:bg-[#111B2E] [data-theme=contrast]_&:bg-black p-3 text-[11px] text-[#64748b] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9] flex items-center justify-between">
              <span>{t('didactic_modal.verified_repo')}</span>
              <span className="font-mono text-[#075477] dark:text-[#67E8F9] [data-theme=contrast]_&:text-[#00B7FF]">SHA256: 7f8a...3b21</span>
            </div>
          </div>
        </Dialog>
      )}
    </>
  )
}
