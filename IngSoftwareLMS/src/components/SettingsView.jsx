import { useState } from 'react'

export function SettingsView({ displayName, activeRole }) {
  const [activeTab, setActiveTab] = useState('account')
  const [notificationsEmail, setNotificationsEmail] = useState(true)
  const [notifications24h, setNotifications24h] = useState(true)
  const [notificationsForums, setNotificationsForums] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true)
  const [themeMode, setThemeMode] = useState('light')
  const [density, setDensity] = useState('comfortable')
  const [savedNotice, setSavedNotice] = useState(false)
  const [sessionsRevoked, setSessionsRevoked] = useState(false)

  function handleSave(e) {
    e.preventDefault()
    setSavedNotice(true)
    setTimeout(() => setSavedNotice(false), 3000)
  }

  const tabs = [
    { id: 'account', label: 'Ajustes de Cuenta', icon: 'manage_accounts' },
    { id: 'notifications', label: 'Preferencias de Notificación', icon: 'notifications_active' },
    { id: 'security', label: 'Seguridad y Accesos', icon: 'shield' },
    { id: 'appearance', label: 'Visualización y Accesibilidad', icon: 'palette' },
  ]

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-line bg-card p-6 shadow-xs md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2 text-secondary">
            <span className="material-symbols-outlined">settings</span>
            <span className="text-xs font-bold uppercase tracking-wider">
              Centro de Control del Usuario
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-ink mt-1">
            Configuración del Sistema
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Personaliza tu perfil, gestiona tus métodos de seguridad y configura tus preferencias de comunicación.
          </p>
        </div>

        {savedNotice && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2 text-xs font-bold text-emerald-800 animate-in fade-in duration-150">
            <span className="material-symbols-outlined text-base">check_circle</span>
            Preferencias actualizadas correctamente
          </div>
        )}
      </div>

      {/* Navegación por pestañas */}
      <div className="flex gap-2 overflow-x-auto border-b border-line pb-2">
        {tabs.map((tab) => (
          <button
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-primary text-white shadow-xs'
                : 'text-muted hover:bg-subtle hover:text-ink'
            }`}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            <span className="material-symbols-outlined text-base">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido según pestaña */}
      <div className="rounded-2xl border border-line bg-card p-6 shadow-xs">
        {activeTab === 'account' && (
          <form onSubmit={handleSave} className="space-y-5 max-w-2xl">
            <h3 className="text-base font-extrabold text-ink">Datos Personales e Institucionales</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">Nombre Completo</label>
                <input
                  className="w-full rounded-xl border border-line bg-subtle p-2.5 text-xs text-ink"
                  defaultValue={displayName}
                  type="text"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">RUT / Documento Oficial</label>
                <input
                  className="w-full rounded-xl border border-line bg-subtle p-2.5 text-xs text-muted"
                  defaultValue="20.123.456-7"
                  disabled
                  type="text"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">Correo Institucional</label>
                <input
                  className="w-full rounded-xl border border-line bg-subtle p-2.5 text-xs text-muted"
                  defaultValue="estudiante@universidad.cl"
                  disabled
                  type="email"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">Rol Activo en Plataforma</label>
                <input
                  className="w-full rounded-xl border border-line bg-subtle p-2.5 text-xs text-ink font-bold"
                  defaultValue={activeRole}
                  disabled
                  type="text"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-ink mb-1.5">Carrera / Programa Académico</label>
                <input
                  className="w-full rounded-xl border border-line bg-subtle p-2.5 text-xs text-ink"
                  defaultValue="Ingeniería Civil en Informática · Plan 2023"
                  disabled
                  type="text"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-line flex justify-end">
              <button
                className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-primary-dark transition"
                type="submit"
              >
                Guardar cambios de perfil
              </button>
            </div>
          </form>
        )}

        {activeTab === 'notifications' && (
          <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
            <div>
              <h3 className="text-base font-extrabold text-ink">Preferencias de Alertas y Notificaciones</h3>
              <p className="text-xs text-muted mt-0.5">Controla la frecuencia y canales para recibir avisos académicos.</p>
            </div>

            <div className="space-y-4">
              <label className="flex items-start gap-3 rounded-xl border border-line p-3.5 hover:bg-subtle/50 cursor-pointer transition">
                <input
                  checked={notificationsEmail}
                  className="mt-0.5 rounded text-primary focus:ring-primary"
                  onChange={(e) => setNotificationsEmail(e.target.checked)}
                  type="checkbox"
                />
                <div>
                  <span className="block text-xs font-bold text-ink">Alertas por correo electrónico</span>
                  <span className="text-[11px] text-muted">Recibe confirmaciones de envío, nuevas pautas y notas finales en tu correo oficial.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 rounded-xl border border-line p-3.5 hover:bg-subtle/50 cursor-pointer transition">
                <input
                  checked={notifications24h}
                  className="mt-0.5 rounded text-primary focus:ring-primary"
                  onChange={(e) => setNotifications24h(e.target.checked)}
                  type="checkbox"
                />
                <div>
                  <span className="block text-xs font-bold text-ink">Recordatorio de entregas prioritarias 24h antes</span>
                  <span className="text-[11px] text-muted">Aviso automático urgente un día antes del cierre oficial de cada evaluación sumativa.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 rounded-xl border border-line p-3.5 hover:bg-subtle/50 cursor-pointer transition">
                <input
                  checked={notificationsForums}
                  className="mt-0.5 rounded text-primary focus:ring-primary"
                  onChange={(e) => setNotificationsForums(e.target.checked)}
                  type="checkbox"
                />
                <div>
                  <span className="block text-xs font-bold text-ink">Notificaciones de foros y debates</span>
                  <span className="text-[11px] text-muted">Avisos cada vez que un compañero o docente responda en los hilos donde participas.</span>
                </div>
              </label>
            </div>

            <div className="pt-4 border-t border-line flex justify-end">
              <button
                className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-primary-dark transition"
                type="submit"
              >
                Guardar preferencias
              </button>
            </div>
          </form>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h3 className="text-base font-extrabold text-ink">Seguridad y Autenticación</h3>
              <p className="text-xs text-muted mt-0.5">Gestión de contraseñas, doble factor e historial de accesos.</p>
            </div>

            <div className="rounded-xl border border-line p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-ink block">Autenticación de Dos Factores (2FA)</span>
                  <span className="text-[11px] text-muted">Protege tu cuenta institucional mediante códigos temporales TOTP.</span>
                </div>
                <button
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    twoFactorEnabled
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-subtle text-muted'
                  }`}
                  onClick={() => setTwoFactorEnabled((prev) => !prev)}
                  type="button"
                >
                  {twoFactorEnabled ? 'Activado ✓' : 'Desactivado'}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-line p-4 space-y-3">
              <h4 className="font-bold text-xs text-ink">Sesiones Activas</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-subtle">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-secondary">devices</span>
                    <div>
                      <p className="font-bold text-ink">Navegador Web Actual · Windows</p>
                      <p className="text-[10px] text-muted">IP 190.161.42.10 · Santiago, Chile (Sesión en curso)</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Activa ahora
                  </span>
                </div>
              </div>
              {sessionsRevoked ? (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200 animate-in fade-in">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span>Se han revocado las sesiones activas en otros dispositivos.</span>
                </div>
              ) : (
                <button
                  className="text-xs font-bold text-danger hover:underline pt-1"
                  onClick={() => {
                    setSessionsRevoked(true)
                    setTimeout(() => setSessionsRevoked(false), 5000)
                  }}
                  type="button"
                >
                  Cerrar todas las demás sesiones
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h3 className="text-base font-extrabold text-ink">Visualización y Accesibilidad</h3>
              <p className="text-xs text-muted mt-0.5">Ajusta la apariencia del entorno para mayor confort visual.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-2">Tema de la Interfaz</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'light', label: 'Modo Claro', icon: 'light_mode' },
                  { id: 'dark', label: 'Modo Oscuro', icon: 'dark_mode' },
                  { id: 'contrast', label: 'Alto Contraste', icon: 'contrast' },
                ].map((th) => (
                  <button
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-bold transition ${
                      themeMode === th.id
                        ? 'border-primary bg-primary/10 text-primary shadow-xs'
                        : 'border-line bg-card text-muted hover:bg-subtle'
                    }`}
                    key={th.id}
                    onClick={() => setThemeMode(th.id)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-xl">{th.icon}</span>
                    {th.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-2">Densidad Visual de Filas y Tarjetas</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'comfortable', label: 'Espaciado Cómodo (Estándar)' },
                  { id: 'compact', label: 'Compacto (Alta densidad de datos)' },
                ].map((d) => (
                  <button
                    className={`rounded-xl border p-3 text-xs font-bold transition text-left ${
                      density === d.id
                        ? 'border-primary bg-primary/10 text-primary shadow-xs'
                        : 'border-line bg-card text-muted hover:bg-subtle'
                    }`}
                    key={d.id}
                    onClick={() => setDensity(d.id)}
                    type="button"
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
