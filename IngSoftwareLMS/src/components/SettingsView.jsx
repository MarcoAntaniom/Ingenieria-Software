import { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useLanguage, LANGUAGES } from '../contexts/LanguageContext'

export function SettingsView({ displayName, activeRole }) {
  const { theme, setTheme } = useTheme()
  const { language, setLanguage, t } = useLanguage()

  const [activeTab, setActiveTab] = useState('account')
  const [notificationsEmail, setNotificationsEmail] = useState(true)
  const [notifications24h, setNotifications24h] = useState(true)
  const [notificationsForums, setNotificationsForums] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true)
  const [density, setDensity] = useState('comfortable')
  const [savedNotice, setSavedNotice] = useState(false)
  const [savedMessage, setSavedMessage] = useState('Preferencias actualizadas correctamente')
  const [sessionsRevoked, setSessionsRevoked] = useState(false)

  // Matriz de Privacidad entre Pares (Peer Privacy Toggles) para el rol Estudiante
  const [peerPrivacy, setPeerPrivacy] = useState(() => {
    try {
      const saved = localStorage.getItem('campus-peer-privacy')
      if (saved) return JSON.parse(saved)
    } catch {
      // Ignorar restricciones de almacenamiento
    }
    return {
      visibilidad_correo: false,
      visibilidad_foto: true,
      visibilidad_redes: false,
      visibilidad_actividad: true,
    }
  })

  function handleTogglePrivacy(key) {
    setPeerPrivacy((prev) => {
      const updated = { ...prev, [key]: !prev[key] }
      try {
        localStorage.setItem('campus-peer-privacy', JSON.stringify(updated))
      } catch {
        // Ignorar
      }
      setSavedMessage('Privacidad entre pares actualizada')
      setSavedNotice(true)
      setTimeout(() => setSavedNotice(false), 2500)
      return updated
    })
  }

  function handleSave(e) {
    e.preventDefault()
    setSavedMessage('Preferencias actualizadas correctamente')
    setSavedNotice(true)
    setTimeout(() => setSavedNotice(false), 3000)
  }

  const tabs = [
    { id: 'account', label: t('settings.account'), icon: 'manage_accounts' },
    { id: 'appearance', label: t('settings.appearance'), icon: 'palette' },
    { id: 'notifications', label: t('settings.notifications'), icon: 'notifications_active' },
    { id: 'security', label: t('settings.security'), icon: 'shield' },
  ]

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-white bg-white dark:bg-[#111B2E] [data-theme=contrast]_&:bg-[#0D0D0D] p-6 shadow-xs md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2 text-[#0B5575] dark:text-[#67E8F9] [data-theme=contrast]_&:text-[#00B7FF]">
            <span className="material-symbols-outlined">settings</span>
            <span className="text-xs font-bold uppercase tracking-wider">
              {t('settings.badge')}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white mt-1">
            {t('nav.settings')}
          </h2>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9] mt-0.5">
            {t('settings.subtitle')}
          </p>
        </div>

        {savedNotice && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-[#123B30] [data-theme=contrast]_&:bg-black border border-emerald-200 dark:border-[#0F766E] [data-theme=contrast]_&:border-[#00F084] [data-theme=contrast]_&:border-2 px-3.5 py-2 text-xs font-bold text-emerald-800 dark:text-[#6EE7B7] [data-theme=contrast]_&:text-[#00F084] animate-in fade-in duration-150">
            <span className="material-symbols-outlined text-base">check_circle</span>
            {savedMessage}
          </div>
        )}
      </div>

      {/* Navegación por pestañas */}
      <div className="flex gap-2 overflow-x-auto border-b border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] pb-2">
        {tabs.map((tab) => (
          <button
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5575] dark:focus-visible:ring-[#67E8F9] [data-theme=contrast]_&:focus-visible:ring-[#FFD400] ${
              activeTab === tab.id
                ? 'bg-[#0B5575] text-white dark:bg-[#0E7490] [data-theme=contrast]_&:bg-white [data-theme=contrast]_&:text-black shadow-xs'
                : 'text-[#475569] dark:text-[#CBD5E1] [data-theme=contrast]_&:text-white hover:bg-[#F8FAFC] dark:hover:bg-[#182235] [data-theme=contrast]_&:hover:bg-[#262626] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
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
      <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-white bg-white dark:bg-[#111B2E] [data-theme=contrast]_&:bg-[#0D0D0D] p-6 shadow-xs">
        {activeTab === 'account' && (
          <div className="space-y-8 max-w-3xl">
            {/* Sección 1: Datos Personales e Institucionales Oficiales (Read-Only RBAC) */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-[#0B5575] dark:text-[#67E8F9] [data-theme=contrast]_&:text-[#00B7FF]">
                      verified_user
                    </span>
                    {t('settings.id_section_title')}
                  </h3>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9] mt-0.5">
                    {t('settings.id_section_desc')}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 dark:bg-[#102F46] [data-theme=contrast]_&:bg-black border border-sky-200 dark:border-[#155E75] [data-theme=contrast]_&:border-[#00B7FF] px-2.5 py-1 text-[11px] font-bold text-[#0B5575] dark:text-[#67E8F9] [data-theme=contrast]_&:text-[#00B7FF] self-start sm:self-center shrink-0">
                  <span className="material-symbols-outlined text-xs">lock</span>
                  {t('settings.readonly_badge')}
                </span>
              </div>

              {/* Mensaje institucional de bloqueo estricto */}
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 dark:border-[#78350F] [data-theme=contrast]_&:border-[#FFE600] [data-theme=contrast]_&:border-2 bg-[#FFFBEB] dark:bg-[#2A1E0B] [data-theme=contrast]_&:bg-[#0D0D0D] p-3.5 text-xs text-amber-900 dark:text-[#FDE68A] [data-theme=contrast]_&:text-[#FFE600]">
                <span className="material-symbols-outlined text-lg shrink-0 text-amber-600 dark:text-[#FCD34D] [data-theme=contrast]_&:text-[#FFE600]">
                  info
                </span>
                <div>
                  <p className="font-extrabold">{t('settings.readOnlyNotice')}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed">
                    {t('settings.readOnlyHelp')}
                  </p>
                </div>
              </div>

              {/* Grid de campos oficiales bloqueados */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Nombre Legal Completo */}
                <div>
                  <label className="flex items-center justify-between text-xs font-bold text-[#0F172A] dark:text-[#CBD5E1] [data-theme=contrast]_&:text-white mb-1.5">
                    <span>{t('settings.field_fullname')}</span>
                    <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9] font-normal flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-xs">lock</span>
                      {t('settings.field_official_tag')}
                    </span>
                  </label>
                  <input
                    aria-label={`${t('settings.field_fullname')} (${t('settings.readonly_badge')})`}
                    className="w-full rounded-xl border border-[#CBD5E1] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-[#F8FAFC] dark:bg-[#111B2E] [data-theme=contrast]_&:bg-black p-2.5 text-xs text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9] cursor-not-allowed select-none focus:outline-none"
                    disabled
                    readOnly
                    type="text"
                    value={activeRole === 'Estudiante' ? 'Esteban Morales Sepúlveda' : displayName}
                  />
                </div>

                {/* 2. RUT / Cédula de Identidad */}
                <div>
                  <label className="flex items-center justify-between text-xs font-bold text-[#0F172A] dark:text-[#CBD5E1] [data-theme=contrast]_&:text-white mb-1.5">
                    <span>{t('settings.field_rut')}</span>
                    <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9] font-normal flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-xs">lock</span>
                      {t('settings.field_official_tag')}
                    </span>
                  </label>
                  <input
                    aria-label={`${t('settings.field_rut')} (${t('settings.readonly_badge')})`}
                    className="w-full rounded-xl border border-[#CBD5E1] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-[#F8FAFC] dark:bg-[#111B2E] [data-theme=contrast]_&:bg-black p-2.5 text-xs text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9] cursor-not-allowed select-none focus:outline-none"
                    disabled
                    readOnly
                    type="text"
                    value="20.123.456-7"
                  />
                </div>

                {/* 3. Correo Institucional */}
                <div>
                  <label className="flex items-center justify-between text-xs font-bold text-[#0F172A] dark:text-[#CBD5E1] [data-theme=contrast]_&:text-white mb-1.5">
                    <span>{t('settings.field_email')}</span>
                    <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9] font-normal flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-xs">lock</span>
                      {t('settings.field_official_tag')}
                    </span>
                  </label>
                  <input
                    aria-label={`${t('settings.field_email')} (${t('settings.readonly_badge')})`}
                    className="w-full rounded-xl border border-[#CBD5E1] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-[#F8FAFC] dark:bg-[#111B2E] [data-theme=contrast]_&:bg-black p-2.5 text-xs text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9] cursor-not-allowed select-none focus:outline-none"
                    disabled
                    readOnly
                    type="email"
                    value="esteban.morales@universidad.cl"
                  />
                </div>

                {/* 4. Carrera / Programa Académico */}
                <div>
                  <label className="flex items-center justify-between text-xs font-bold text-[#0F172A] dark:text-[#CBD5E1] [data-theme=contrast]_&:text-white mb-1.5">
                    <span>{t('settings.field_career')}</span>
                    <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9] font-normal flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-xs">lock</span>
                      {t('settings.field_official_tag')}
                    </span>
                  </label>
                  <input
                    aria-label={`${t('settings.field_career')} (${t('settings.readonly_badge')})`}
                    className="w-full rounded-xl border border-[#CBD5E1] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-[#F8FAFC] dark:bg-[#111B2E] [data-theme=contrast]_&:bg-black p-2.5 text-xs text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9] cursor-not-allowed select-none focus:outline-none"
                    disabled
                    readOnly
                    type="text"
                    value="Ingeniería Civil en Informática"
                  />
                </div>

                {/* 5. Plan de Estudios */}
                <div>
                  <label className="flex items-center justify-between text-xs font-bold text-[#0F172A] dark:text-[#CBD5E1] [data-theme=contrast]_&:text-white mb-1.5">
                    <span>{t('settings.field_study_plan')}</span>
                    <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9] font-normal flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-xs">lock</span>
                      {t('settings.field_official_tag')}
                    </span>
                  </label>
                  <input
                    aria-label={`${t('settings.field_study_plan')} (${t('settings.readonly_badge')})`}
                    className="w-full rounded-xl border border-[#CBD5E1] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-[#F8FAFC] dark:bg-[#111B2E] [data-theme=contrast]_&:bg-black p-2.5 text-xs text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9] cursor-not-allowed select-none focus:outline-none"
                    disabled
                    readOnly
                    type="text"
                    value="Plan de Estudios 2022"
                  />
                </div>

                {/* 6. Número de Matrícula */}
                <div>
                  <label className="flex items-center justify-between text-xs font-bold text-[#0F172A] dark:text-[#CBD5E1] [data-theme=contrast]_&:text-white mb-1.5">
                    <span>{t('settings.field_enrollment_num')}</span>
                    <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9] font-normal flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-xs">lock</span>
                      {t('settings.field_official_tag')}
                    </span>
                  </label>
                  <input
                    aria-label={`${t('settings.field_enrollment_num')} (${t('settings.readonly_badge')})`}
                    className="w-full rounded-xl border border-[#CBD5E1] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-[#F8FAFC] dark:bg-[#111B2E] [data-theme=contrast]_&:bg-black p-2.5 text-xs text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9] cursor-not-allowed select-none focus:outline-none"
                    disabled
                    readOnly
                    type="text"
                    value="2022041982"
                  />
                </div>
              </div>
            </div>

            {/* Sección 2: Matriz de Visibilidad entre Pares (Peer Privacy Toggles) */}
            <div className="space-y-4 pt-4 border-t border-[#E2E8F0] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6]">
              <div>
                <div className="flex items-center gap-2 text-[#0B5575] dark:text-[#67E8F9] [data-theme=contrast]_&:text-[#00B7FF]">
                  <span className="material-symbols-outlined text-lg">visibility</span>
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Privacidad entre Pares (Peer-to-Peer Privacy)
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white mt-1">
                  {t('settings.privacyPeerTitle')}
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9] mt-0.5">
                  {t('settings.privacyPeerDesc')}
                </p>
              </div>

              {/* Lista de Switches de Privacidad */}
              <div className="space-y-3">
                {[
                  {
                    key: 'visibilidad_correo',
                    label: t('settings.visibilityEmail'),
                    desc: 'Permite que otros estudiantes matriculados en tus mismas secciones vean tu correo institucional en foros y salas.',
                    icon: 'mail',
                  },
                  {
                    key: 'visibilidad_foto',
                    label: t('settings.visibilityPhoto'),
                    desc: 'Muestra tu fotografía o avatar personalizado. Si lo desactivas, tus compañeros verán únicamente una inicial genérica.',
                    icon: 'account_circle',
                  },
                  {
                    key: 'visibilidad_redes',
                    label: t('settings.visibilitySocial'),
                    desc: 'Muestra enlaces a tus perfiles profesionales (LinkedIn, GitHub o portafolio) en la tarjeta de contacto para trabajos grupales.',
                    icon: 'link',
                  },
                  {
                    key: 'visibilidad_actividad',
                    label: t('settings.visibilityActivity'),
                    desc: 'Muestra a tus compañeros de sección si te encuentras conectado "En línea" en aulas sincrónicas y foros.',
                    icon: 'sensors',
                  },
                ].map((item) => {
                  const isChecked = Boolean(peerPrivacy[item.key])
                  return (
                    <div
                      className="flex items-center justify-between gap-4 rounded-xl border border-[#CBD5E1] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-[#F8FAFC]/50 dark:bg-[#16243A]/40 [data-theme=contrast]_&:bg-[#0D0D0D] p-3.5 hover:bg-[#F8FAFC] dark:hover:bg-[#16243A] [data-theme=contrast]_&:hover:bg-[#1A1A1A] transition"
                      key={item.key}
                    >
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-lg text-[#0B5575] dark:text-[#67E8F9] [data-theme=contrast]_&:text-[#00B7FF] mt-0.5">
                          {item.icon}
                        </span>
                        <div>
                          <span className="font-bold text-xs text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white block">
                            {item.label}
                          </span>
                          <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9] mt-0.5 block max-w-xl">
                            {item.desc}
                          </span>
                        </div>
                      </div>

                      {/* Switch accesible role="switch" aria-checked */}
                      <button
                        aria-checked={isChecked}
                        aria-label={item.label}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5575] dark:focus-visible:ring-[#67E8F9] [data-theme=contrast]_&:focus-visible:ring-[#FFD400] ${
                          isChecked
                            ? 'bg-[#0B5575] dark:bg-[#0E7490] [data-theme=contrast]_&:bg-white'
                            : 'bg-[#CBD5E1] dark:bg-[#334155] [data-theme=contrast]_&:bg-black [data-theme=contrast]_&:border-white'
                        }`}
                        onClick={() => handleTogglePrivacy(item.key)}
                        role="switch"
                        type="button"
                      >
                        <span
                          className={`pointer-events-none inline-block size-5 transform rounded-full bg-white [data-theme=contrast]_&:bg-black shadow ring-0 transition duration-200 ease-in-out ${
                            isChecked
                              ? 'translate-x-5 [data-theme=contrast]_&:bg-black'
                              : 'translate-x-0 [data-theme=contrast]_&:bg-white'
                          }`}
                        />
                      </button>
                    </div>
                  )
                })}
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-xs text-emerald-600 dark:text-[#6EE7B7]">
                    sync_saved_locally
                  </span>
                  Los cambios de visibilidad se guardan de forma instantánea y reactiva.
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <form onSubmit={handleSave} className="space-y-5 max-w-2xl">
            <div>
              <h3 className="text-base font-extrabold text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white">
                {t('settings.notif_channels_title')}
              </h3>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9] mt-0.5">
                {t('settings.notif_channels_desc')}
              </p>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between rounded-xl border border-[#CBD5E1] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] p-3.5 cursor-pointer hover:bg-[#F8FAFC] dark:hover:bg-[#16243A] [data-theme=contrast]_&:hover:bg-[#262626] transition">
                <div>
                  <span className="font-bold text-xs text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white block">
                    {t('settings.notif_daily_summary')}
                  </span>
                  <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">
                    {t('settings.notif_daily_desc')}
                  </span>
                </div>
                <input
                  checked={notificationsEmail}
                  className="size-4.5 rounded text-[#0B5575] focus:ring-[#0B5575]"
                  onChange={(e) => setNotificationsEmail(e.target.checked)}
                  type="checkbox"
                />
              </label>

              <label className="flex items-center justify-between rounded-xl border border-[#CBD5E1] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] p-3.5 cursor-pointer hover:bg-[#F8FAFC] dark:hover:bg-[#16243A] [data-theme=contrast]_&:hover:bg-[#262626] transition">
                <div>
                  <span className="font-bold text-xs text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white block">
                    {t('settings.notif_critical_24h')}
                  </span>
                  <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">
                    {t('settings.notif_critical_desc')}
                  </span>
                </div>
                <input
                  checked={notifications24h}
                  className="size-4.5 rounded text-[#0B5575] focus:ring-[#0B5575]"
                  onChange={(e) => setNotifications24h(e.target.checked)}
                  type="checkbox"
                />
              </label>

              <label className="flex items-center justify-between rounded-xl border border-[#CBD5E1] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] p-3.5 cursor-pointer hover:bg-[#F8FAFC] dark:hover:bg-[#16243A] [data-theme=contrast]_&:hover:bg-[#262626] transition">
                <div>
                  <span className="font-bold text-xs text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white block">
                    {t('settings.notif_forums')}
                  </span>
                  <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">
                    {t('settings.notif_forums_desc')}
                  </span>
                </div>
                <input
                  checked={notificationsForums}
                  className="size-4.5 rounded text-[#0B5575] focus:ring-[#0B5575]"
                  onChange={(e) => setNotificationsForums(e.target.checked)}
                  type="checkbox"
                />
              </label>
            </div>

            <div className="pt-2">
              <button
                className="btn-primary rounded-xl bg-[#0B5575] hover:bg-[#074968] dark:bg-[#0E7490] dark:hover:bg-[#155E75] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition"
                type="submit"
              >
                {t('settings.save_prefs')}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h3 className="text-base font-extrabold text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white">
                {t('settings.security_title')}
              </h3>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9] mt-0.5">
                {t('settings.security_desc')}
              </p>
            </div>

            <div className="rounded-xl border border-[#CBD5E1] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white block">
                    {t('settings.two_factor_title')}
                  </span>
                  <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">
                    {t('settings.two_factor_desc')}
                  </span>
                </div>
                <button
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    twoFactorEnabled
                      ? 'bg-emerald-100 dark:bg-[#123B30] [data-theme=contrast]_&:bg-black text-emerald-800 dark:text-[#6EE7B7] [data-theme=contrast]_&:text-[#00F084] [data-theme=contrast]_&:border [data-theme=contrast]_&:border-[#00F084]'
                      : 'bg-[#F8FAFC] dark:bg-[#182235] [data-theme=contrast]_&:bg-black text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]'
                  }`}
                  onClick={() => setTwoFactorEnabled((prev) => !prev)}
                  type="button"
                >
                  {twoFactorEnabled ? t('settings.two_factor_active') : t('settings.two_factor_inactive')}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-[#CBD5E1] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] p-4 space-y-3">
              <h4 className="font-bold text-xs text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white">
                {t('settings.active_sessions_title')}
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#182235] [data-theme=contrast]_&:bg-black">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[#0B5575] dark:text-[#67E8F9] [data-theme=contrast]_&:text-[#00B7FF]">
                      devices
                    </span>
                    <div>
                      <p className="font-bold text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white">
                        Navegador Web Actual · Windows
                      </p>
                      <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9]">
                        IP 190.161.42.10 · Santiago, Chile (Sesión en curso)
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-[#6EE7B7] [data-theme=contrast]_&:text-[#00F084] bg-emerald-50 dark:bg-[#123B30] [data-theme=contrast]_&:bg-black [data-theme=contrast]_&:border [data-theme=contrast]_&:border-[#00F084] px-2 py-0.5 rounded-md">
                    Activa ahora
                  </span>
                </div>
              </div>
              {sessionsRevoked ? (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-[#6EE7B7] [data-theme=contrast]_&:text-[#00F084] bg-emerald-50 dark:bg-[#123B30] [data-theme=contrast]_&:bg-black p-2 rounded-lg border border-emerald-200 dark:border-[#0F766E] [data-theme=contrast]_&:border-[#00F084] animate-in fade-in">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span>{t('settings.sessions_revoked_notice')}</span>
                </div>
              ) : (
                <button
                  className="text-xs font-bold text-[#B42318] dark:text-[#FCA5A5] [data-theme=contrast]_&:text-[#FF4D5A] hover:underline pt-1"
                  onClick={() => {
                    setSessionsRevoked(true)
                    setTimeout(() => setSessionsRevoked(false), 5000)
                  }}
                  type="button"
                >
                  {t('settings.close_other_sessions')}
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h3 className="text-base font-extrabold text-[#0F172A] dark:text-[#F8FAFC] [data-theme=contrast]_&:text-white">
                {t('settings.appearance_title')}
              </h3>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] [data-theme=contrast]_&:text-[#D9D9D9] mt-0.5">
                {t('settings.appearance_desc')}
              </p>
            </div>

            {/* Selector de Tema / Modo Oscuro / Alto Contraste */}
            <div>
              <label className="block text-xs font-bold text-[#0F172A] dark:text-[#CBD5E1] [data-theme=contrast]_&:text-white mb-2">
                {t('settings.theme_label')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'light', label: t('settings.theme_light'), icon: 'light_mode', desc: t('settings.theme_light_desc') },
                  { id: 'dark', label: t('settings.theme_dark'), icon: 'dark_mode', desc: t('settings.theme_dark_desc') },
                  { id: 'contrast', label: t('settings.theme_contrast'), icon: 'contrast', desc: t('settings.theme_contrast_desc') },
                ].map((th) => (
                  <button
                    className={`flex flex-col items-center text-center gap-1.5 rounded-xl border p-3.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5575] dark:focus-visible:ring-[#67E8F9] [data-theme=contrast]_&:focus-visible:ring-[#FFD400] ${
                      theme === th.id
                        ? 'border-[#0B5575] dark:border-[#67E8F9] [data-theme=contrast]_&:border-[#FFD400] bg-[#EFF8FB] dark:bg-[#123B49] [data-theme=contrast]_&:bg-[#1A1A1A] text-[#0B5575] dark:text-[#67E8F9] [data-theme=contrast]_&:text-[#FFD400] shadow-xs ring-1 ring-[#0B5575] dark:ring-[#67E8F9] [data-theme=contrast]_&:ring-[#FFD400]'
                        : 'border-[#CBD5E1] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-white dark:bg-[#16243A] [data-theme=contrast]_&:bg-[#0D0D0D] text-[#64748B] dark:text-[#CBD5E1] [data-theme=contrast]_&:text-white hover:bg-[#F8FAFC] dark:hover:bg-[#1D2F46] [data-theme=contrast]_&:hover:bg-[#262626]'
                    }`}
                    key={th.id}
                    onClick={() => setTheme(th.id)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-2xl">{th.icon}</span>
                    <span className="font-extrabold">{th.label}</span>
                    <span className="text-[10px] font-normal opacity-80">{th.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Selector de Idioma (i18n: es-CL, arn, en-US) */}
            <div>
              <label className="block text-xs font-bold text-[#0F172A] dark:text-[#CBD5E1] [data-theme=contrast]_&:text-white mb-2">
                {t('settings.language_label')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {LANGUAGES.map((item) => (
                  <button
                    className={`flex flex-col items-start gap-1 rounded-xl border p-3.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5575] dark:focus-visible:ring-[#67E8F9] [data-theme=contrast]_&:focus-visible:ring-[#FFD400] ${
                      language === item.code
                        ? 'border-[#0B5575] dark:border-[#67E8F9] [data-theme=contrast]_&:border-[#00B7FF] bg-[#EFF8FB] dark:bg-[#123B49] [data-theme=contrast]_&:bg-[#1A1A1A] text-[#0B5575] dark:text-[#67E8F9] [data-theme=contrast]_&:text-[#00B7FF] shadow-xs ring-1 ring-[#0B5575] dark:ring-[#67E8F9]'
                        : 'border-[#CBD5E1] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-white dark:bg-[#16243A] [data-theme=contrast]_&:bg-[#0D0D0D] text-[#64748B] dark:text-[#CBD5E1] [data-theme=contrast]_&:text-white hover:bg-[#F8FAFC] dark:hover:bg-[#1D2F46] [data-theme=contrast]_&:hover:bg-[#262626]'
                    }`}
                    key={item.code}
                    onClick={() => setLanguage(item.code)}
                    type="button"
                  >
                    <span className="font-extrabold text-sm">{item.native}</span>
                    <span className="text-[11px] font-normal opacity-80">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Densidad visual */}
            <div>
              <label className="block text-xs font-bold text-[#0F172A] dark:text-[#CBD5E1] [data-theme=contrast]_&:text-white mb-2">
                {t('settings.density_label')}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'comfortable', label: t('settings.density_comfortable') },
                  { id: 'compact', label: t('settings.density_compact') },
                ].map((d) => (
                  <button
                    className={`rounded-xl border p-3 text-xs font-bold transition text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5575] dark:focus-visible:ring-[#67E8F9] [data-theme=contrast]_&:focus-visible:ring-[#FFD400] ${
                      density === d.id
                        ? 'border-[#0B5575] dark:border-[#67E8F9] [data-theme=contrast]_&:border-[#00B7FF] bg-[#EFF8FB] dark:bg-[#123B49] [data-theme=contrast]_&:bg-[#1A1A1A] text-[#0B5575] dark:text-[#67E8F9] [data-theme=contrast]_&:text-[#00B7FF] shadow-xs ring-1 ring-[#0B5575] dark:ring-[#67E8F9]'
                        : 'border-[#CBD5E1] dark:border-[#2A3A52] [data-theme=contrast]_&:border-[#A6A6A6] bg-white dark:bg-[#16243A] [data-theme=contrast]_&:bg-[#0D0D0D] text-[#64748B] dark:text-[#CBD5E1] [data-theme=contrast]_&:text-white hover:bg-[#F8FAFC] dark:hover:bg-[#1D2F46] [data-theme=contrast]_&:hover:bg-[#262626]'
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

export default SettingsView
