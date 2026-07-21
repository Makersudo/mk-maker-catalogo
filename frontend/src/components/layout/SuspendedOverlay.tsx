import { AlertTriangle, Lock, Phone } from 'lucide-react';

interface SuspendedOverlayProps {
  message?: string;
  supportContact?: string;
}

export function SuspendedOverlay({ message, supportContact }: SuspendedOverlayProps) {
  const defaultSupport = 'https://wa.me/5500000000000'; // Substituir pelo WhatsApp do Super Admin
  const contactUrl = supportContact || defaultSupport;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-neutral-950 p-4 select-none font-sans">
      {/* Background Decorativo */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(199,143,134,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(111,72,68,0.1),transparent_50%)]" />
      
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900/60 p-8 text-center shadow-2xl backdrop-blur-xl md:p-10">
        
        {/* Ícone de Cadeado/Aviso Animado */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#6f4844] to-[#c98f86] text-white shadow-xl shadow-[#c98f86]/10">
          <Lock className="h-10 w-10 animate-pulse" />
        </div>

        <h1 className="mb-3 text-2xl font-black uppercase tracking-wider text-white">
          Plataforma Suspensa
        </h1>

        <p className="mb-6 text-sm leading-relaxed text-neutral-400">
          {message || 'Este catálogo está temporariamente suspenso por manutenção financeira ou técnica.'}
        </p>

        {/* Alerta de Contato */}
        <div className="mb-8 flex items-center gap-3 rounded-2xl border border-[#c98f86]/20 bg-[#6f4844]/10 p-4 text-left">
          <AlertTriangle className="h-5 w-5 shrink-0 text-[#c98f86]" />
          <div className="text-xs">
            <p className="font-bold text-white">Atenção Lojista</p>
            <p className="text-neutral-400">Para reativar sua loja e liberar o acesso dos clientes, entre em contato.</p>
          </div>
        </div>

        {/* Botão de Suporte */}
        <a
          href={contactUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#6f4844] to-[#c98f86] py-3.5 px-6 font-bold text-white shadow-lg shadow-[#c98f86]/10 hover:from-[#7c4f4a] hover:to-[#d6a39b] hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Phone className="h-5 w-5" />
          Falar com o Administrador
        </a>

        {/* Rodapé sutil */}
        <div className="mt-8 text-[10px] uppercase tracking-widest text-neutral-600">
          MK Maker &copy; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
