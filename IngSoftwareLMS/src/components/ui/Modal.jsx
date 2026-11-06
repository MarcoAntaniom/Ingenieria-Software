import { useEffect, useRef } from 'react'
import Button from './Button'

export default function Modal({ open, onClose, title, children }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      aria-labelledby="modal-title"
      className="m-auto w-[min(90vw,36rem)] rounded-xl border border-line bg-card p-0 text-ink shadow-xl backdrop:bg-ink/50"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClose={onClose}
      ref={dialogRef}
    >
      <div className="flex items-start justify-between gap-4 border-b border-line p-5">
        <h2 className="text-lg font-bold" id="modal-title">{title}</h2>
        <Button aria-label="Cerrar diálogo" onClick={onClose} variant="secondary">
          <span aria-hidden="true" className="material-symbols-outlined">close</span>
        </Button>
      </div>
      <div className="p-5">{children}</div>
    </dialog>
  )
}
