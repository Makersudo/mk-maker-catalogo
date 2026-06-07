import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Minus, Plus, Trash2, Send, ShoppingCart, MapPin, Store, Copy, CheckCircle2 } from "lucide-react";
import { useStore } from "../../store/useStore";
import { CheckoutData } from "../../types";
import { createOrder } from "../../services/orderService";

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function CartDrawer() {
  const { cart, isCartOpen, closeCart, updateQuantity, removeFromCart, clearCart } = useStore();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [orderCode, setOrderCode] = useState("");
  const [ticketCopied, setTicketCopied] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  const [formData, setFormData] = useState<CheckoutData>({
    fullName: "",
    phone: "",
    fulfillmentType: "delivery",
    paymentMethod: "pix",
    cep: "",
    address: "",
    number: "",
    complement: "",
    neighborhood: "",
    region: "",
    city: "",
    state: "",
    referencePoint: ""
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    const cep = onlyDigits(formData.cep);
    if (cep.length !== 8 || formData.fulfillmentType !== "delivery") return;

    let cancelled = false;
    setCepLoading(true);
    fetch(`https://viacep.com.br/ws/${cep}/json/`)
      .then((response) => response.json())
      .then((data) => {
        if (cancelled || data.erro) return;
        setFormData((current) => ({
          ...current,
          address: data.logradouro || current.address,
          neighborhood: data.bairro || current.neighborhood,
          city: data.localidade || current.city,
          region: data.localidade || current.region,
          state: data.uf || current.state,
        }));
      })
      .finally(() => {
        if (!cancelled) setCepLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [formData.cep, formData.fulfillmentType]);

  const validateCheckout = () => {
    if (!formData.fullName.trim()) return "Informe seu nome completo.";
    if (onlyDigits(formData.phone).length < 10) return "Informe um WhatsApp valido.";
    if (!formData.paymentMethod) return "Escolha uma forma de pagamento.";

    if (formData.fulfillmentType === "delivery") {
      if (onlyDigits(formData.cep).length !== 8) return "Informe um CEP valido.";
      if (!formData.address.trim()) return "Informe a rua ou avenida.";
      if (!formData.number.trim()) return "Informe o numero.";
      if (!formData.neighborhood.trim()) return "Informe o bairro.";
      if (!formData.city.trim()) return "Informe a cidade.";
    }

    return "";
  };

  const handleCheckout = async (e: FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setCheckoutError("");
    setOrderCode("");
    setTicketCopied(false);

    const validation = validateCheckout();
    if (validation) {
      setCheckoutError(validation);
      return;
    }

    setCheckoutLoading(true);
    try {
      const response = await createOrder(cart, formData);
      setOrderCode(response.order?.order_code || "");
      clearCart();
      if (response.whatsappUrl) {
        window.open(response.whatsappUrl, "_blank", "noopener,noreferrer");
      } else {
        setCheckoutError("Pedido registrado. Configure o WhatsApp da loja para abrir a conversa automaticamente.");
      }
    } catch (err: any) {
      setCheckoutError(err.message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const total = cart.reduce((acc, item) => {
    const unitPrice = item.variant?.price ?? item.product.price;
    return acc + unitPrice * item.quantity;
  }, 0);

  const copyTicket = async () => {
    if (!orderCode) return;
    await navigator.clipboard.writeText(orderCode);
    setTicketCopied(true);
    window.setTimeout(() => setTicketCopied(false), 1800);
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 top-4 z-[101] flex h-[calc(100dvh-1rem)] w-full flex-col border-l border-neutral-200 bg-white shadow-2xl max-sm:rounded-t-3xl sm:inset-y-0 sm:left-auto sm:h-dvh sm:max-w-lg sm:rounded-none"
          >
            <header className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50/80 p-4 sm:p-6">
              <h2 className="text-xl font-bold uppercase tracking-tight text-neutral-900 flex items-center gap-2">
                Seu Carrinho
                <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-purple-800 to-purple-500 rounded-full text-white">
                  {cart.reduce((acc, item) => acc + item.quantity, 0)} itens
                </span>
              </h2>
              <button onClick={closeCart} className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </header>

            <main className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
              {cart.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-neutral-400">
                  {orderCode ? (
                    <div className="w-full max-w-sm rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
                      <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-600" />
                      <h3 className="text-lg font-black uppercase tracking-tight">Pedido recebido</h3>
                      <p className="mt-2 text-sm text-emerald-800">Informe este ticket para retirada ou atendimento.</p>
                      <div className="mt-5 rounded-xl border border-emerald-200 bg-white px-4 py-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Ticket</span>
                        <p className="mt-1 text-xl font-black text-neutral-900">{orderCode}</p>
                      </div>
                      <button onClick={copyTicket} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black uppercase tracking-wide text-white">
                        <Copy className="h-4 w-4" />
                        {ticketCopied ? "Copiado" : "Copiar ticket"}
                      </button>
                    </div>
                  ) : (
                    <>
                      <ShoppingCart className="w-12 h-12 mb-4 opacity-30" />
                      <p>Seu carrinho esta vazio.</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6">
                  <div className="flex flex-col gap-4">
                    {cart.map((item) => {
                      const unitPrice = item.variant?.price ?? item.product.price;
                      return (
                        <div key={item.key} className="flex gap-4 p-4 bg-white border border-neutral-200 rounded-xl shadow-sm">
                          <div className="w-16 h-16 bg-neutral-100 rounded-lg overflow-hidden flex-shrink-0">
                            {item.product.imageUrl ? (
                              <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-neutral-100" />
                            )}
                          </div>
                          <div className="flex-1 flex flex-col">
                            <div className="flex justify-between items-start mb-1">
                              <div>
                                <h4 className="font-bold text-sm text-neutral-900 line-clamp-1">{item.product.name}</h4>
                                {item.variant && <p className="text-[11px] font-semibold text-neutral-500">{item.variant.label}</p>}
                              </div>
                              <button onClick={() => removeFromCart(item.key)} className="text-neutral-400 hover:text-red-500 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <span className="text-purple-700 font-bold text-xs mb-3">{formatPrice(unitPrice)}</span>
                            <div className="flex items-center gap-3 mt-auto">
                              <button onClick={() => item.quantity > 1 ? updateQuantity(item.key, item.quantity - 1) : removeFromCart(item.key)} className="w-6 h-6 flex items-center justify-center bg-neutral-100 text-neutral-700 rounded hover:bg-neutral-200 transition-colors">
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-bold w-4 text-center text-neutral-900">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.key, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center bg-neutral-100 text-neutral-700 rounded hover:bg-neutral-200 transition-colors">
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="h-px w-full bg-neutral-200 my-1" />

                  <form id="checkout-form" onSubmit={handleCheckout} className="flex flex-col gap-4">
                    {checkoutError && (
                      <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-xs font-bold">
                        {checkoutError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer ${formData.fulfillmentType === "delivery" ? "border-purple-400 bg-purple-50" : "border-neutral-200"}`}>
                        <input type="radio" name="fulfillmentType" value="delivery" checked={formData.fulfillmentType === "delivery"} onChange={handleChange} className="accent-purple-700" />
                        <MapPin className="w-4 h-4" />
                        <span className="text-xs font-bold">Entrega</span>
                      </label>
                      <label className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer ${formData.fulfillmentType === "pickup" ? "border-purple-400 bg-purple-50" : "border-neutral-200"}`}>
                        <input type="radio" name="fulfillmentType" value="pickup" checked={formData.fulfillmentType === "pickup"} onChange={handleChange} className="accent-purple-700" />
                        <Store className="w-4 h-4" />
                        <span className="text-xs font-bold">Retirada</span>
                      </label>
                    </div>

                    <input required name="fullName" value={formData.fullName} onChange={handleChange} type="text" placeholder="Nome completo *" className="w-full bg-white border border-neutral-300 text-sm text-neutral-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder:text-neutral-400" />
                    <input required name="phone" value={formData.phone} onChange={handleChange} type="tel" placeholder="WhatsApp *" className="w-full bg-white border border-neutral-300 text-sm text-neutral-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder:text-neutral-400" />

                    {formData.fulfillmentType === "delivery" && (
                      <>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <input required name="cep" value={formData.cep} onChange={handleChange} type="text" placeholder={cepLoading ? "Buscando CEP..." : "CEP *"} className="w-full bg-white border border-neutral-300 text-sm text-neutral-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder:text-neutral-400" />
                          <input required name="city" value={formData.city} onChange={handleChange} type="text" placeholder="Cidade *" className="w-full bg-white border border-neutral-300 text-sm text-neutral-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder:text-neutral-400" />
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <input name="state" value={formData.state} onChange={handleChange} type="text" placeholder="UF" className="w-full bg-white border border-neutral-300 text-sm text-neutral-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder:text-neutral-400" />
                          <input required name="neighborhood" value={formData.neighborhood} onChange={handleChange} type="text" placeholder="Bairro *" className="w-full bg-white border border-neutral-300 text-sm text-neutral-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder:text-neutral-400 sm:col-span-2" />
                        </div>
                        <input required name="address" value={formData.address} onChange={handleChange} type="text" placeholder="Rua / Avenida *" className="w-full bg-white border border-neutral-300 text-sm text-neutral-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder:text-neutral-400" />
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <input required name="number" value={formData.number} onChange={handleChange} type="text" placeholder="Numero *" className="w-full bg-white border border-neutral-300 text-sm text-neutral-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder:text-neutral-400" />
                          <input name="complement" value={formData.complement} onChange={handleChange} type="text" placeholder="Complemento" className="w-full bg-white border border-neutral-300 text-sm text-neutral-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder:text-neutral-400 sm:col-span-2" />
                        </div>
                        <input name="referencePoint" value={formData.referencePoint} onChange={handleChange} type="text" placeholder="Ponto de referencia" className="w-full bg-white border border-neutral-300 text-sm text-neutral-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder:text-neutral-400" />
                      </>
                    )}

                    <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="w-full bg-white border border-neutral-300 text-sm text-neutral-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500">
                      <option value="pix">Pix</option>
                      <option value="cash">Dinheiro</option>
                      <option value="card">Cartao</option>
                    </select>

                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                      <h3 className="uppercase tracking-widest text-xs font-bold text-neutral-500 mb-3">Resumo do pedido</h3>
                      <div className="flex flex-col gap-2 text-xs text-neutral-600">
                        {cart.map((item) => (
                          <div key={item.key} className="flex justify-between gap-3">
                            <span>{item.quantity}x {item.product.name}{item.variant ? ` - ${item.variant.label}` : ""}</span>
                            <strong>{formatPrice((item.variant?.price ?? item.product.price) * item.quantity)}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </main>

            <footer className="border-t border-neutral-200 bg-white/80 px-4 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] backdrop-blur-md sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-neutral-500 uppercase tracking-widest text-[10px] font-bold">Total Estimado</span>
                <span className="text-xl font-bold text-neutral-900">{formatPrice(total)}</span>
              </div>

              <button type="submit" form="checkout-form" disabled={cart.length === 0 || checkoutLoading} className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-purple-800 to-purple-500 text-white font-bold text-sm uppercase tracking-tight rounded-xl hover:from-purple-700 hover:to-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-purple-500/20">
                <Send className="w-4 h-4" />
                {checkoutLoading ? "Enviando pedido..." : "Finalizar compra"}
              </button>
            </footer>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
