export default function InscripcionesTable({ enrollments }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-card shadow-xs">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-line bg-subtle text-[11px] font-bold uppercase text-muted">
          <tr>
            <th className="px-4 py-3">ID</th>
            <th className="px-4 py-3">Asignatura / Sección</th>
            <th className="px-4 py-3">Estudiante</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Fecha</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {enrollments.map((insc) => (
            <tr className="hover:bg-subtle/50" key={insc.id}>
              <td className="px-4 py-3 font-mono font-semibold">#{insc.id}</td>
              <td className="px-4 py-3 font-bold text-ink">
                {insc.seccion?.asignatura?.nombre || 'Sección'}{' '}
                <span className="text-muted">
                  (Sec. {insc.seccion?.numero_seccion || insc.seccion?.id})
                </span>
              </td>
              <td className="px-4 py-3 text-muted">
                {insc.estudiante || 'Estudiante inscrito'}
              </td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-secondary-container px-2.5 py-0.5 text-[10px] font-bold text-on-secondary-container">
                  {insc.estado?.codigo || 'ACTIVA'}
                </span>
              </td>
              <td className="px-4 py-3 text-muted">
                {insc.creado_en
                  ? new Date(insc.creado_en).toLocaleDateString('es-CL')
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
