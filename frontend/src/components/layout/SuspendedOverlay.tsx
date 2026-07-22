import { AlertTriangle, Lock, Phone, Wrench, RefreshCw } from 'lucide-react';

interface SuspendedOverlayProps {
  message?: string;
  supportContact?: string;
  isAdminRoute?: boolean;
}

export function SuspendedOverlay({ message, supportContact, isAdminRoute }: SuspendedOverlayProps) {
  const defaultSupport = 'https://wa.me/5500000000000';
  const contactUrl = supportContact || defaultSupport;

  // 🛠️ MODO PÚBLICO (Clientes da Loja): Apenas aviso elegante de manutenção
  if (!isAdminRoute) {
    return (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-neutral-950 p-4 select-none font-sans">
        {/* Background Decorativo */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(199,143,134,0.06),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(111,72,68,0.06),transparent_50%)]" />
        
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-neutral-800/80 bg-neutral-900/80 p-8 text-center shadow-2xl backdrop-blur-xl md:p-10">
          {/* Ícone de Manutenção */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-neutral-800 to-neutral-700 text-amber-400 shadow-xl shadow-amber-500/10 border border-neutral-700/50">
            <Wrench className="h-9 w-9 animate-pulse" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-4">
            <RefreshCw className="w-3 h-3 animate-spin" /> Manutenção Programada
          </div>

          <h1 className="mb-3 text-2xl font-black uppercase tracking-wider text-white">
            Site em Manutenção
          </h1>

          <p className="mb-6 text-sm leading-relaxed text-neutral-400">
            Estamos realizando melhorias técnicas em nosso catálogo no momento. Voltaremos a atender em breve!
          </p>

          <div className="mt-6 text-[11px] font-medium text-neutral-500 border-t border-neutral-800 pt-6">
            Agradecemos a sua compreensão.
          </div>
        </div>
      </div>
    );
  }

  // 🔐 MODO ADMIN (/admin ou /login): Aviso explícito de pagamento e suporte para o lojista
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-neutral-950 p-4 select-none font-sans">
      {/* Background Decorativo */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(199,143,134,0.12),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(111,72,68,0.12),transparent_50%)]" />
      
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900/80 p-8 text-center shadow-2xl backdrop-blur-xl md:p-10">
        
        {/* Ícone de Cadeado/Aviso Animado */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#6f4844] to-[#c98f86] text-white shadow-xl shadow-[#c98f86]/10">
          <Lock className="h-10 w-10 animate-pulse" />
        </div>

        <h1 className="mb-3 text-2xl font-black uppercase tracking-wider text-white">
          Acesso ao Painel Suspenso
        </h1>

        <p className="mb-6 text-sm leading-relaxed text-neutral-300">
          {message || 'Identificamos pendências no plano do seu catálogo. Entre em contato com o suporte para realizar o pagamento e liberar o acesso.'}
        </p>

        {/* Alerta de Contato */}
        <div className="mb-8 flex items-center gap-3 rounded-2xl border border-[#c98f86]/30 bg-[#6f4844]/20 p-4 text-left">
          <AlertTriangle className="h-6 w-6 shrink-0 text-[#c98f86]" />
          <div className="text-xs">
            <p className="font-bold text-white mb-0.5">Atenção Lojista</p>
            <p className="text-neutral-300 leading-snug">Para renovar sua licença, realizar o pagamento e reativar o catálogo para seus clientes, fale com o suporte.</p>
          </div>
        </div>

        {/* Botão de Suporte WhatsApp */}
        <a
          href={contactUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#6f4844] to-[#c98f86] py-4 px-6 font-bold text-white shadow-lg shadow-[#c98f86]/20 hover:from-[#7c4f4a] hover:to-[#d6a39b] hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Phone className="h-5 w-5" />
          Falar com Suporte & Liberar Acesso
        </a>

        {/* Rodapé sutil */}
        <div className="mt-8 text-[10px] uppercase tracking-widest text-neutral-500">
          Central Master de Licenciamento
        </div>
      </div>
    </div>
  );
}
