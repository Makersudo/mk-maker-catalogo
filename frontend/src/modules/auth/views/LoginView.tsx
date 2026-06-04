import { type FormEvent, type ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Bell, KeyRound, Lock, Mail, PackageCheck, ShieldCheck, Store } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import {
  type AdminTotpSetup,
  confirmAdminTotpSetup,
  getAdminTotpStatus,
  login,
  requestAdminGate,
  startAdminTotpSetup,
} from '../../../services/authService';
import { usePublicSettings } from '../../../hooks/usePublicSettings';

const ADMIN_LOGIN_LOGO = '/assets/mk-maker-logo-ultra-realista.png';

export function LoginView() {
  const settings = usePublicSettings();
  const [accessCode, setAccessCode] = useState('');
  const [gateToken, setGateToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpConfigured, setTotpConfigured] = useState<boolean | null>(null);
  const [setup, setSetup] = useState<AdminTotpSetup | null>(null);
  const [setupEmail, setSetupEmail] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupCode, setSetupCode] = useState('');
  const [setupComplete, setSetupComplete] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const primaryColor = settings.store_primary_color || '#c98f86';

  useEffect(() => {
    let active = true;

    getAdminTotpStatus()
      .then((status) => {
        if (active) setTotpConfigured(status.configured);
      })
      .catch((err: any) => {
        if (!active) return;
        setTotpConfigured(true);
        setError(err?.message || 'Nao foi possivel verificar o autenticador.');
      });

    return () => {
      active = false;
    };
  }, []);

  const handleStartSetup = async () => {
    setLoading(true);
    setError('');

    try {
      setSetup(await startAdminTotpSetup(false, {
        email: setupEmail.trim().toLowerCase(),
        password: setupPassword,
      }));
      setSetupPassword('');
    } catch (err: any) {
      setError(err?.message || 'Nao foi possivel gerar a configuracao.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSetup = async (event: FormEvent) => {
    event.preventDefault();
    if (!setup) return;

    setLoading(true);
    setError('');

    try {
      await confirmAdminTotpSetup(setup.setupToken, setupCode.trim());
      setSetup(null);
      setSetupCode('');
      setSetupComplete(true);
      setTotpConfigured(true);
    } catch (err: any) {
      setError(err?.message || 'Nao foi possivel ativar o autenticador.');
    } finally {
      setLoading(false);
    }
  };

  const handleGate = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = await requestAdminGate(accessCode.trim());
      setGateToken(token);
      setAccessCode('');
    } catch (err: any) {
      setError(err?.message || 'Codigo invalido.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await login(email.trim().toLowerCase(), password, gateToken);
      setUser(user);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Nao foi possivel entrar no painel.');
    } finally {
      setLoading(false);
    }
  };

  const loginStep = !totpConfigured
    ? 'Configurar seguranca'
    : gateToken
      ? 'Credenciais do admin'
      : 'Validar autenticador';

  return (
    <div className="min-h-screen overflow-hidden bg-[#fbfaf9] text-neutral-950">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 dot-pattern opacity-60"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            `radial-gradient(circle at 8% 10%, ${primaryColor}28 0, transparent 30%), ` +
            `radial-gradient(circle at 86% 84%, ${primaryColor}24 0, transparent 32%), ` +
            'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(251,250,249,0.96) 100%)',
        }}
      />

      <main className="relative mx-auto flex min-h-screen w-full max-w-[1480px] items-center justify-center p-4 sm:p-6 lg:p-10">
        <section className="grid w-full max-w-7xl overflow-hidden rounded-[2rem] border border-neutral-200 bg-white shadow-[0_34px_90px_rgba(17,24,39,0.12)] lg:grid-cols-[minmax(0,1fr)_480px]">
          <aside
            className="relative overflow-hidden border-b border-neutral-200 bg-white p-6 sm:p-10 lg:min-h-[700px] lg:border-b-0 lg:p-12"
            aria-label="Central administrativa MK Maker"
          >
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background:
                  `linear-gradient(135deg, ${primaryColor}18 0%, transparent 30%, transparent 68%, ${primaryColor}14 100%)`,
              }}
            />
            <div aria-hidden="true" className="absolute -right-24 top-16 h-72 w-72 rounded-full border border-[#e8d2cf]" />
            <div aria-hidden="true" className="absolute -bottom-24 left-16 h-64 w-64 rounded-full border border-[#ead8d5]" />

            <div className="relative z-10 flex h-full flex-col justify-between gap-10">
              <div>
                <div className="inline-flex rounded-[1.75rem] border border-neutral-200 bg-white px-6 py-5 shadow-[0_22px_60px_rgba(106,68,63,0.12)]">
                  <img
                    src={ADMIN_LOGIN_LOGO}
                    alt="MK Maker"
                    className="h-28 w-64 object-contain object-left sm:h-32 sm:w-72"
                  />
                </div>

                <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-[#E7C9C4] bg-[#F8EEEC] px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#8D514B]">
                  <Store className="h-4 w-4" />
                  Central privada da vitrine
                </div>

                <h1 className="mt-5 max-w-3xl font-display text-5xl font-semibold leading-[0.96] tracking-normal text-neutral-950 sm:text-6xl lg:text-7xl">
                  Central administrativa <span className="text-[#9B5F58]">MK Maker</span>
                </h1>

                <p className="mt-6 max-w-xl text-base font-medium leading-7 text-neutral-600">
                  Entrada reservada para operar produtos, campanhas, pedidos, estoque e notificacoes do catalogo.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <LoginFeatureCard icon={<PackageCheck className="h-5 w-5" />} title="Catalogo live" text="Produtos e vitrine publicados." />
                <LoginFeatureCard icon={<Bell className="h-5 w-5" />} title="Alertas" text="Pedidos novos na central." />
                <LoginFeatureCard icon={<ShieldCheck className="h-5 w-5" />} title="2FA ativo" text="Acesso com autenticador." />
              </div>
            </div>
          </aside>

          <section className="relative flex items-center justify-center bg-[#fffdfc] p-5 sm:p-8 lg:border-l lg:border-neutral-200 lg:p-10">
            <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-neutral-950 via-[#9B5F58] to-[#C98F86]" />

            <div className="w-full max-w-md">
              <div className="mb-7 flex items-center gap-4 rounded-3xl border border-neutral-200 bg-white p-4 shadow-[0_12px_34px_rgba(17,24,39,0.05)] lg:hidden">
                <img src={ADMIN_LOGIN_LOGO} alt="MK Maker" className="h-16 w-32 object-contain object-left" />
                <div>
                  <p className="text-sm font-black text-neutral-950">MK Maker Admin</p>
                  <p className="text-xs font-semibold text-neutral-500">Central privada</p>
                </div>
              </div>

              <LoginStepPill label={loginStep} />

              <div className="mt-5">
                <h2 className="text-3xl font-black tracking-tight text-neutral-950 sm:text-4xl">Entrar no painel</h2>
                <p className="mt-3 text-sm font-medium leading-6 text-neutral-500">
                  Use o autenticador e suas credenciais para liberar a central administrativa.
                </p>
              </div>

              <div className="mt-8 rounded-3xl border border-neutral-200 bg-white p-4 shadow-[0_18px_54px_rgba(17,24,39,0.08)] sm:p-5">
                {totpConfigured === null ? (
                  <div className="flex min-h-52 flex-col items-center justify-center text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F8EEEC] text-[#8D514B]">
                      <ShieldCheck className="h-7 w-7" />
                    </div>
                    <p className="text-sm font-black uppercase tracking-widest text-neutral-900">Verificando autenticador</p>
                    <p className="mt-2 max-w-xs text-sm font-medium text-neutral-500">Conferindo a camada de seguranca antes de liberar o acesso.</p>
                  </div>
                ) : !totpConfigured ? (
                  <form onSubmit={setup ? handleConfirmSetup : (event) => event.preventDefault()} className="flex flex-col gap-5">
                    {error && <StatusMessage tone="error">{error}</StatusMessage>}

                    <SecurityNotice>
                      Este painel ainda nao tem autenticador configurado. Ative o Google Authenticator para proteger o acesso.
                    </SecurityNotice>

                    {!setup ? (
                      <>
                        <AuthField label="E-mail admin" icon={<Mail className="h-5 w-5" />}>
                          <input
                            type="email"
                            value={setupEmail}
                            onChange={(event) => setSetupEmail(event.target.value)}
                            className="admin-auth-input"
                            placeholder="admin@empresa.com"
                            autoComplete="username"
                            required
                          />
                        </AuthField>

                        <AuthField label="Senha admin" icon={<Lock className="h-5 w-5" />}>
                          <input
                            type="password"
                            value={setupPassword}
                            onChange={(event) => setSetupPassword(event.target.value)}
                            className="admin-auth-input"
                            placeholder="********"
                            autoComplete="current-password"
                            required
                          />
                        </AuthField>

                        <PrimaryButton
                          type="button"
                          disabled={loading || !setupEmail.trim() || !setupPassword}
                          onClick={handleStartSetup}
                        >
                          {loading ? 'Gerando configuracao...' : 'Gerar configuracao segura'}
                        </PrimaryButton>
                      </>
                    ) : (
                      <>
                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                          <p className="text-xs font-black uppercase tracking-widest text-neutral-500">Chave de configuracao</p>
                          <div className="mt-3 break-all rounded-xl border border-neutral-200 bg-white p-3 font-mono text-xs text-neutral-700">
                            {setup.setupKey}
                          </div>
                          <p className="mt-3 text-xs font-medium leading-5 text-neutral-500">
                            No Google Authenticator, adicione uma conta e escolha inserir uma chave de configuracao.
                          </p>
                          <a href={setup.otpauthUri} className="mt-3 inline-flex text-xs font-black uppercase tracking-widest text-[#8D514B] hover:text-neutral-950">
                            Abrir no app autenticador
                          </a>
                        </div>

                        <AuthField label="Codigo gerado no app" icon={<KeyRound className="h-5 w-5" />}>
                          <input
                            type="password"
                            value={setupCode}
                            onChange={(event) => setSetupCode(event.target.value)}
                            className="admin-auth-input"
                            placeholder="6 digitos"
                            autoComplete="one-time-code"
                            inputMode="numeric"
                            maxLength={6}
                            required
                          />
                        </AuthField>

                        <PrimaryButton type="submit" disabled={loading}>
                          {loading ? 'Confirmando...' : 'Ativar autenticador'}
                        </PrimaryButton>
                      </>
                    )}
                  </form>
                ) : (
                  <form onSubmit={gateToken ? handleLogin : handleGate} className="flex flex-col gap-5">
                    {error && <StatusMessage tone="error">{error}</StatusMessage>}
                    {setupComplete && (
                      <StatusMessage tone="success">
                        Autenticador ativado. Digite o codigo atual para continuar.
                      </StatusMessage>
                    )}

                    {!gateToken ? (
                      <AuthField label="Codigo do Google Authenticator" icon={<KeyRound className="h-5 w-5" />}>
                        <input
                          type="password"
                          value={accessCode}
                          onChange={(event) => setAccessCode(event.target.value)}
                          className="admin-auth-input"
                          placeholder="6 digitos"
                          autoComplete="one-time-code"
                          inputMode="numeric"
                          maxLength={6}
                          required
                        />
                      </AuthField>
                    ) : (
                      <>
                        <AuthField label="E-mail" icon={<Mail className="h-5 w-5" />}>
                          <input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            className="admin-auth-input"
                            placeholder="admin@empresa.com"
                            autoComplete="username"
                            required
                          />
                        </AuthField>

                        <AuthField label="Senha" icon={<Lock className="h-5 w-5" />}>
                          <input
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            className="admin-auth-input"
                            placeholder="********"
                            autoComplete="current-password"
                            required
                          />
                        </AuthField>
                      </>
                    )}

                    <PrimaryButton type="submit" disabled={loading}>
                      {loading ? 'Autenticando...' : gateToken ? 'Entrar no sistema' : 'Validar autenticador'}
                    </PrimaryButton>
                  </form>
                )}
              </div>

              <div className="mt-5 flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-xs font-semibold text-neutral-500 shadow-sm">
                <Store className="h-4 w-4 shrink-0 text-[#8D514B]" />
                Central privada do catalogo. Mantenha o acesso restrito aos responsaveis da loja.
              </div>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}

function LoginFeatureCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white/86 p-4 shadow-[0_14px_36px_rgba(106,68,63,0.08)] backdrop-blur">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#F8EEEC] text-[#8D514B]">
        {icon}
      </div>
      <p className="text-base font-black text-neutral-950">{title}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">{text}</p>
    </div>
  );
}

function LoginStepPill({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#E7C9C4] bg-[#F8EEEC] px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#8D514B]">
      <ShieldCheck className="h-4 w-4" />
      {label}
    </div>
  );
}

function AuthField({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-black uppercase tracking-widest text-neutral-500">{label}</span>
      <span className="relative block">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-neutral-400">
          {icon}
        </span>
        {children}
      </span>
    </label>
  );
}

function PrimaryButton({
  children,
  type,
  disabled,
  onClick,
}: {
  children: ReactNode;
  type: 'button' | 'submit';
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="group mt-1 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-neutral-950 to-[#9B5F58] px-5 py-3.5 text-sm font-black uppercase tracking-widest text-white shadow-[0_18px_34px_rgba(106,68,63,0.22)] transition hover:from-neutral-900 hover:to-[#C98F86] disabled:cursor-not-allowed disabled:opacity-55"
    >
      {children}
      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
    </button>
  );
}

function StatusMessage({ tone, children }: { tone: 'error' | 'success'; children: ReactNode }) {
  const className = tone === 'error'
    ? 'border-red-100 bg-red-50 text-red-700'
    : 'border-emerald-100 bg-emerald-50 text-emerald-700';

  return (
    <div className={`rounded-2xl border px-4 py-3 text-center text-sm font-bold ${className}`}>
      {children}
    </div>
  );
}

function SecurityNotice({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#E7C9C4] bg-[#FDF8F7] p-4 text-sm font-medium leading-6 text-[#7A4944]">
      <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest">
        <ShieldCheck className="h-4 w-4" />
        Configurar Google Authenticator
      </div>
      {children}
    </div>
  );
}
