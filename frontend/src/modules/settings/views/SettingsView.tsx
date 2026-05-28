import { type FormEvent, useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Image as ImageIcon,
  KeyRound,
  LinkIcon,
  Loader2,
  Palette,
  Phone,
  Save,
  ShieldCheck,
  Store,
} from 'lucide-react';
import {
  type AdminTotpSetup,
  confirmAdminTotpSetup,
  startAdminTotpSetup,
} from '../../../services/authService';
import {
  type StoreSettings,
  getPublicSettings,
  saveSettings,
} from '../../../services/settingsService';

const PLAN_LABELS: Record<string, string> = {
  basic: 'Basico - R$ 149,90/mes',
  medium: 'Medio - R$ 399,90/mes',
  master: 'Master - R$ 749,90/mes',
};

export function SettingsView() {
  const [setup, setSetup] = useState<AdminTotpSetup | null>(null);
  const [code, setCode] = useState('');
  const [securityMessage, setSecurityMessage] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [securityLoading, setSecurityLoading] = useState(false);

  const [settings, setSettings] = useState<StoreSettings>({});
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsFeedback, setSettingsFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    getPublicSettings()
      .then((data) => setSettings(data))
      .catch(() => setSettings({}))
      .finally(() => setSettingsLoading(false));
  }, []);

  const handleStartReset = async () => {
    setSecurityLoading(true);
    setSecurityError('');
    setSecurityMessage('');

    try {
      setSetup(await startAdminTotpSetup(true));
    } catch (err: any) {
      setSecurityError(err.message);
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleConfirm = async (event: FormEvent) => {
    event.preventDefault();
    if (!setup) return;

    setSecurityLoading(true);
    setSecurityError('');
    setSecurityMessage('');

    try {
      await confirmAdminTotpSetup(setup.setupToken, code.trim());
      setSetup(null);
      setCode('');
      setSecurityMessage('Google Authenticator atualizado com sucesso.');
    } catch (err: any) {
      setSecurityError(err.message);
    } finally {
      setSecurityLoading(false);
    }
  };

  function handleSettingsChange(key: keyof StoreSettings, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSaveSettings(event: FormEvent) {
    event.preventDefault();
    setSavingSettings(true);
    setSettingsFeedback(null);

    try {
      const saved = await saveSettings(settings);
      setSettings(saved);
      setSettingsFeedback({ type: 'success', message: 'Configuracoes salvas com sucesso.' });
    } catch {
      setSettingsFeedback({ type: 'error', message: 'Erro ao salvar configuracoes. Verifique sua sessao.' });
    } finally {
      setSavingSettings(false);
      window.setTimeout(() => setSettingsFeedback(null), 4000);
    }
  }

  const primaryColor = settings.store_primary_color || '#d68a00';

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-10">
      <section className="bg-white p-6 md:p-8 rounded-2xl border border-neutral-200 shadow-sm">
        <div className="flex items-start gap-3 mb-6">
          <div className="h-11 w-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-neutral-900 uppercase tracking-tight">Seguranca do Admin</h2>
            <p className="text-sm text-neutral-500 mt-1">
              Gerencie o Google Authenticator usado antes do login com email e senha.
            </p>
          </div>
        </div>

        {securityError && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm">
            {securityError}
          </div>
        )}

        {securityMessage && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 border border-green-100 rounded-lg text-sm">
            {securityMessage}
          </div>
        )}

        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
          <h3 className="text-sm font-black text-neutral-800 uppercase tracking-widest mb-2">
            Google Authenticator
          </h3>
          <p className="text-sm text-neutral-600 mb-4">
            Use esta acao para trocar o autenticador em producao. A chave antiga so sera substituida depois que o novo codigo for confirmado.
          </p>

          {!setup ? (
            <button
              type="button"
              disabled={securityLoading}
              onClick={handleStartReset}
              className="bg-gradient-to-r from-purple-800 to-purple-600 text-white font-bold text-sm uppercase tracking-tight rounded-xl px-5 py-3 hover:from-purple-700 hover:to-purple-500 transition-all shadow-md shadow-purple-500/20 disabled:opacity-50"
            >
              {securityLoading ? 'Gerando...' : 'Reconfigurar autenticador'}
            </button>
          ) : (
            <form onSubmit={handleConfirm} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Nova chave de configuracao</label>
                <div className="p-3 bg-white border border-neutral-200 rounded-xl font-mono text-xs break-all text-neutral-700">
                  {setup.setupKey}
                </div>
                <a
                  href={setup.otpauthUri}
                  className="text-xs font-bold text-purple-700 hover:text-purple-900"
                >
                  Abrir configuracao no app autenticador
                </a>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Codigo do novo autenticador</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    type="password"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                    placeholder="6 digitos"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={securityLoading}
                className="bg-gradient-to-r from-purple-800 to-purple-600 text-white font-bold text-sm uppercase tracking-tight rounded-xl px-5 py-3 hover:from-purple-700 hover:to-purple-500 transition-all shadow-md shadow-purple-500/20 disabled:opacity-50"
              >
                {securityLoading ? 'Confirmando...' : 'Confirmar novo autenticador'}
              </button>
            </form>
          )}
        </div>
      </section>

      <section className="bg-white p-6 md:p-8 rounded-2xl border border-neutral-200 shadow-sm">
        <header className="mb-6">
          <h2 className="text-xl font-black text-neutral-900 uppercase tracking-tight">
            Configuracoes da Loja
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Personalize a identidade publica da sua loja.
          </p>
        </header>

        {settingsFeedback && (
          <div
            className={`flex items-center gap-3 mb-4 p-4 rounded-xl text-sm font-medium ${
              settingsFeedback.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {settingsFeedback.type === 'success' ? (
              <CheckCircle className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            {settingsFeedback.message}
          </div>
        )}

        {settingsLoading ? (
          <div className="flex items-center justify-center h-48 text-neutral-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSaveSettings} className="flex flex-col gap-6">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 flex flex-col gap-5">
              <SectionTitle icon={<Store className="w-4 h-4 text-purple-600" />} label="Identidade" tone="purple" />
              <SettingsField
                id="store_name"
                label="Nome da Loja"
                placeholder="Ex: MK MAKER"
                value={settings.store_name || ''}
                onChange={(value) => handleSettingsChange('store_name', value)}
              />
              <SettingsField
                id="store_slug"
                label="Slug / URL"
                placeholder="Ex: mk-maker"
                value={settings.store_slug || ''}
                onChange={(value) => handleSettingsChange('store_slug', value)}
                prefix="loja/"
                icon={<LinkIcon className="w-3.5 h-3.5" />}
              />
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 flex flex-col gap-5">
              <SectionTitle icon={<Phone className="w-4 h-4 text-emerald-600" />} label="Contato" tone="emerald" />
              <SettingsField
                id="whatsapp_phone"
                label="WhatsApp (DDI+DDD+Numero)"
                placeholder="Ex: 5511999999999"
                value={settings.whatsapp_phone || ''}
                onChange={(value) => handleSettingsChange('whatsapp_phone', value)}
              />
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 flex flex-col gap-5">
              <SectionTitle icon={<Palette className="w-4 h-4 text-pink-600" />} label="Aparencia" tone="pink" />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-neutral-500" htmlFor="store_primary_color">
                  Cor primaria da marca
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="store_primary_color"
                    type="color"
                    value={primaryColor}
                    onChange={(event) => handleSettingsChange('store_primary_color', event.target.value)}
                    className="w-10 h-10 rounded-lg border border-neutral-200 cursor-pointer p-0.5"
                  />
                  <div
                    className="flex-1 h-10 rounded-xl border border-neutral-200 flex items-center px-4 text-sm font-mono text-white font-bold shadow-inner"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {primaryColor}
                  </div>
                </div>
              </div>

              <SettingsField
                id="store_banner"
                label="URL do Banner"
                placeholder="https://..."
                value={settings.store_banner || ''}
                onChange={(value) => handleSettingsChange('store_banner', value)}
                icon={<ImageIcon className="w-3.5 h-3.5" />}
              />

              {settings.store_banner && (
                <img
                  src={settings.store_banner}
                  alt="Preview do banner"
                  className="w-full h-32 object-cover rounded-xl border border-neutral-200"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                />
              )}

              <SettingsField
                id="store_logo"
                label="URL do Logo"
                placeholder="https://..."
                value={settings.store_logo || ''}
                onChange={(value) => handleSettingsChange('store_logo', value)}
                icon={<ImageIcon className="w-3.5 h-3.5" />}
              />
            </div>

            {settings.store_plan && (
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                  <Store className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-purple-500">Plano Atual</p>
                  <p className="text-sm font-bold text-purple-900 mt-0.5">
                    {PLAN_LABELS[settings.store_plan] || settings.store_plan}
                  </p>
                </div>
              </div>
            )}

            <button
              id="settings-save-btn"
              type="submit"
              disabled={savingSettings}
              className="flex items-center justify-center gap-2 w-full md:w-auto md:self-end px-8 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-bold rounded-xl transition-colors shadow-md text-sm uppercase tracking-widest"
            >
              {savingSettings ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {savingSettings ? 'Salvando...' : 'Salvar Configuracoes'}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}

function SectionTitle({ icon, label, tone }: { icon: React.ReactNode; label: string; tone: 'purple' | 'emerald' | 'pink' }) {
  const toneClass = {
    purple: 'bg-purple-100',
    emerald: 'bg-emerald-100',
    pink: 'bg-pink-100',
  }[tone];

  return (
    <div className="flex items-center gap-3 pb-2 border-b border-neutral-100">
      <div className={`w-8 h-8 ${toneClass} rounded-lg flex items-center justify-center`}>
        {icon}
      </div>
      <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-500">{label}</h3>
    </div>
  );
}

function SettingsField({
  id,
  label,
  placeholder,
  value,
  onChange,
  prefix,
  icon,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold uppercase tracking-widest text-neutral-500" htmlFor={id}>
        {label}
      </label>
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-xs text-neutral-400 font-mono select-none">{prefix}</span>
        )}
        {icon && !prefix && (
          <span className="absolute left-3 text-neutral-400">{icon}</span>
        )}
        <input
          id={id}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`w-full border border-neutral-200 rounded-xl py-2.5 pr-4 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors ${
            prefix ? 'pl-14' : icon ? 'pl-9' : 'pl-4'
          }`}
        />
      </div>
    </div>
  );
}
