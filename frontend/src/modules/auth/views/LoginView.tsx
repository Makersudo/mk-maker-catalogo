import { type FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import {
  type AdminTotpSetup,
  confirmAdminTotpSetup,
  getAdminTotpStatus,
  login,
  requestAdminGate,
  startAdminTotpSetup,
} from '../../../services/authService';
import { BrandLogo } from '../../../components/brand/BrandLogo';
import { usePublicSettings } from '../../../hooks/usePublicSettings';

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
  const secondaryColor = settings.store_secondary_color || '#111111';

  useEffect(() => {
    let active = true;

    getAdminTotpStatus()
      .then((status) => {
        if (active) setTotpConfigured(status.configured);
      })
      .catch((err: any) => {
        if (!active) return;
        setTotpConfigured(true);
        setError(err.message || 'Nao foi possivel verificar o autenticador.');
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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSetup = async (e: FormEvent) => {
    e.preventDefault();
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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGate = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = await requestAdminGate(accessCode.trim());
      setGateToken(token);
      setAccessCode('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await login(email.trim().toLowerCase(), password, gateToken);
      setUser(user);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-neutral-100">
        <div className="p-8 text-center" style={{ background: `linear-gradient(90deg, ${secondaryColor}, ${primaryColor})` }}>
          <div className="h-16 w-56 bg-white/95 rounded-xl flex items-center justify-center mx-auto mb-4 px-4 shadow-lg shadow-purple-950/20">
            <BrandLogo imageClassName="h-12 w-full object-contain" textClassName="text-xl font-black tracking-normal text-neutral-950" />
          </div>
          <h1 className="text-2xl font-bold text-white uppercase tracking-tight">Painel Admin</h1>
          <p className="text-purple-200 text-sm mt-2">Acesso Restrito</p>
        </div>
        
        <div className="p-8">
          {totpConfigured === null ? (
            <div className="py-10 text-center text-sm font-semibold text-neutral-500">
              Verificando autenticador...
            </div>
          ) : !totpConfigured ? (
          <form onSubmit={setup ? handleConfirmSetup : (e) => e.preventDefault()} className="flex flex-col gap-5">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl text-sm text-purple-900">
              <div className="flex items-center gap-2 font-bold uppercase tracking-tight text-xs mb-2">
                <ShieldCheck className="h-4 w-4" />
                Configurar Google Authenticator
              </div>
              Este painel ainda nao tem autenticador configurado. Cadastre no app Google Authenticator e confirme o codigo de 6 digitos para ativar o acesso.
            </div>

            {!setup ? (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">E-mail admin</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-neutral-400" />
                    </div>
                    <input
                      type="email"
                      value={setupEmail}
                      onChange={(e) => setSetupEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                      placeholder="admin@empresa.com"
                      autoComplete="username"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Senha admin</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-neutral-400" />
                    </div>
                    <input
                      type="password"
                      value={setupPassword}
                      onChange={(e) => setSetupPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                      placeholder="********"
                      autoComplete="current-password"
                      required
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={loading || !setupEmail.trim() || !setupPassword}
                  onClick={handleStartSetup}
                  className="mt-4 w-full bg-gradient-to-r from-purple-800 to-purple-600 text-white font-bold text-sm uppercase tracking-tight rounded-xl py-3.5 hover:from-purple-700 hover:to-purple-500 transition-all shadow-md shadow-purple-500/20 disabled:opacity-50"
                >
                  {loading ? 'Gerando configuracao...' : 'Gerar configuracao segura'}
                </button>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Chave de configuracao</label>
                  <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl font-mono text-xs break-all text-neutral-700">
                    {setup.setupKey}
                  </div>
                  <p className="text-xs text-neutral-500">
                    No Google Authenticator, toque em adicionar conta e escolha inserir uma chave de configuracao.
                  </p>
                  <a
                    href={setup.otpauthUri}
                    className="text-xs font-bold text-purple-700 hover:text-purple-900"
                  >
                    Abrir configuracao no app autenticador
                  </a>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Codigo gerado no app</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <KeyRound className="h-5 w-5 text-neutral-400" />
                    </div>
                    <input
                      type="password"
                      value={setupCode}
                      onChange={(e) => setSetupCode(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                      placeholder="6 digitos"
                      autoComplete="one-time-code"
                      inputMode="numeric"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-4 w-full bg-gradient-to-r from-purple-800 to-purple-600 text-white font-bold text-sm uppercase tracking-tight rounded-xl py-3.5 hover:from-purple-700 hover:to-purple-500 transition-all shadow-md shadow-purple-500/20 disabled:opacity-50"
                >
                  {loading ? 'Confirmando...' : 'Ativar autenticador'}
                </button>
              </>
            )}
          </form>
          ) : (
          <form onSubmit={gateToken ? handleLogin : handleGate} className="flex flex-col gap-5">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            {setupComplete && (
              <div className="p-3 bg-green-50 text-green-700 border border-green-100 rounded-lg text-sm text-center">
                Autenticador ativado. Digite o codigo atual para continuar.
              </div>
            )}

            {!gateToken ? (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Codigo do Google Authenticator</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    type="password"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                    placeholder="6 digitos"
                    autoComplete="one-time-code"
                    required
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">E-mail</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-neutral-400" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                      placeholder="admin@empresa.com"
                      autoComplete="username"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Senha</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-neutral-400" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                      placeholder="********"
                      autoComplete="current-password"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full bg-gradient-to-r from-purple-800 to-purple-600 text-white font-bold text-sm uppercase tracking-tight rounded-xl py-3.5 hover:from-purple-700 hover:to-purple-500 transition-all shadow-md shadow-purple-500/20 disabled:opacity-50"
            >
              {loading ? 'Autenticando...' : gateToken ? 'Entrar no Sistema' : 'Validar Autenticador'}
            </button>
          </form>
          )}
        </div>
      </div>
    </div>
  );
}
