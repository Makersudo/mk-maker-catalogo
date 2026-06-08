import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { MessageCircle, Mail, MapPin, Clock, Send, CheckCircle } from 'lucide-react';
import { getPublicSettings } from '../../../services/settingsService';

export function ContactView() {
  const [whatsapp, setWhatsapp] = useState('');
  const [storeName, setStoreName] = useState('MK MAKER');
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  useEffect(() => {
    getPublicSettings()
      .then((s) => {
        if (s.whatsapp_phone) setWhatsapp(s.whatsapp_phone);
        if (s.store_name) setStoreName(s.store_name);
      })
      .catch(() => undefined);
  }, []);

  function handleChange(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleWhatsApp() {
    if (!whatsapp) return;
    const msg = encodeURIComponent(
      `Olá, ${storeName || 'equipe'}! Vim pelo site e gostaria de tirar uma dúvida.${form.message ? `\n\n${form.message}` : ''}`,
    );
    window.open(`https://wa.me/${whatsapp}?text=${msg}`, '_blank');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Formulário abre WhatsApp com mensagem formatada como canal de contato
    if (whatsapp) {
      const msg = encodeURIComponent(
        `*Contato via site*\nNome: ${form.name}\nEmail: ${form.email}\nMensagem: ${form.message}`,
      );
      window.open(`https://wa.me/${whatsapp}?text=${msg}`, '_blank');
    }
    setSent(true);
    setTimeout(() => setSent(false), 5000);
  }

  const infos = [
    {
      icon: MessageCircle,
      label: 'WhatsApp',
      value: whatsapp ? `+${whatsapp}` : 'Configurar nas Settings',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      icon: Mail,
      label: 'E-mail',
      value: 'Configurar no atendimento',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      icon: MapPin,
      label: 'Localização',
      value: 'São Paulo, SP — Brasil',
      color: 'text-rose-600',
      bg: 'bg-rose-50',
    },
    {
      icon: Clock,
      label: 'Atendimento',
      value: 'Seg–Sex, 9h–18h',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ];

  return (
    <section className="w-full flex-1 flex flex-col items-center justify-start bg-neutral-50/50 px-4 pb-12 pt-28 lg:pb-20 lg:pt-32">
      <div className="w-full max-w-5xl mx-auto">
        {/* Cabeçalho */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl lg:text-5xl font-bold uppercase tracking-tight text-neutral-900 mb-3">
            Fale{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-800 to-purple-500">
              Conosco
            </span>
          </h2>
          <p className="text-sm lg:text-base text-neutral-500 max-w-md mx-auto">
            Tire suas dúvidas, faça pedidos especiais ou negocie pelo WhatsApp — respondemos rapidinho!
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
          {/* Informações de Contato */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col gap-4"
          >
            <div className="grid grid-cols-2 gap-4">
              {infos.map((info) => (
                <div
                  key={info.label}
                  className="bg-white border border-neutral-200 rounded-2xl p-4 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${info.bg}`}>
                    <info.icon className={`w-4 h-4 ${info.color}`} />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                    {info.label}
                  </p>
                  <p className="text-xs font-medium text-neutral-700 leading-snug">{info.value}</p>
                </div>
              ))}
            </div>

            {whatsapp && (
              <motion.button
                id="contact-whatsapp-btn"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleWhatsApp}
                className="flex items-center justify-center gap-3 w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl transition-colors shadow-lg text-sm uppercase tracking-widest"
              >
                <MessageCircle className="w-5 h-5" />
                Iniciar conversa no WhatsApp
              </motion.button>
            )}
          </motion.div>

          {/* Formulário */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm"
          >
            {sent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center h-full min-h-[300px] gap-4 text-center"
              >
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <p className="text-lg font-bold text-neutral-900">Mensagem enviada!</p>
                <p className="text-sm text-neutral-500">Abrimos o WhatsApp para você continuar a conversa.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <h3 className="text-base font-bold text-neutral-900 mb-1">Envie uma mensagem</h3>
                <ContactField
                  id="contact-name"
                  label="Seu nome"
                  placeholder="João Silva"
                  value={form.name}
                  onChange={(v) => handleChange('name', v)}
                  required
                />
                <ContactField
                  id="contact-email"
                  label="E-mail"
                  type="email"
                  placeholder="joao@email.com"
                  value={form.email}
                  onChange={(v) => handleChange('email', v)}
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-neutral-500" htmlFor="contact-message">
                    Mensagem
                  </label>
                  <textarea
                    id="contact-message"
                    rows={4}
                    required
                    value={form.message}
                    onChange={(e) => handleChange('message', e.target.value)}
                    placeholder="Escreva sua mensagem aqui..."
                    className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors resize-none"
                  />
                </div>
                <motion.button
                  id="contact-submit-btn"
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors shadow-md text-sm uppercase tracking-widest"
                >
                  <Send className="w-4 h-4" />
                  Enviar via WhatsApp
                </motion.button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function ContactField({
  id,
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  required,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold uppercase tracking-widest text-neutral-500" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
      />
    </div>
  );
}
