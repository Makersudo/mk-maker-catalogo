import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Alert, SafeAreaView, View } from 'react-native';
import {
  createMobileOrder,
  getMobileStore,
  listAdminOrders,
  loginAdmin,
  requestAdminGate,
  updateAdminOrderStatus,
  type AdminOrderResponse,
} from './src/api';

// Componentes
import { BottomNav } from './src/components/BottomNav';
import { Header } from './src/components/Header';

// Telas
import { CatalogScreen } from './src/screens/CatalogScreen';
import { CartScreen } from './src/screens/CartScreen';
import { CheckoutScreen } from './src/screens/CheckoutScreen';
import { EntryScreen } from './src/screens/EntryScreen';
import { FavoritesScreen } from './src/screens/FavoritesScreen';
import { ProductScreen } from './src/screens/ProductScreen';
import {
  AdminDashboardScreen,
  AdminLoginScreen,
  AdminOrdersScreen,
  AdminProductsScreen,
  AdminSettingsScreen,
} from './src/screens/AdminScreens';

// Tipos e estilos
import { styles } from './src/styles';
import type {
  CartItem,
  CheckoutProfile,
  Colors,
  Mode,
  Order,
  OrderStatus,
  Plan,
  PlanCode,
  Product,
  ProductVariant,
  Screen,
  Store,
} from './src/types';

// ── Dados iniciais (fallback offline) ─────────────────────────────────────────

const plans: Record<PlanCode, Plan> = {
  basic: { label: 'Basico', price: 'R$ 149,90', products: 50, orders: 250, stock: 50, customization: false },
  medium: { label: 'Medio', price: 'R$ 399,90', products: 250, orders: 350, stock: 250, customization: true },
  master: { label: 'Master', price: 'R$ 749,90', products: null, orders: null, stock: 450, customization: true },
};

const demoStores: Store[] = [
  {
    id: 'store-mk-maker',
    name: 'MK MAKER',
    slug: 'mk-maker',
    whatsapp: '5511999999999',
    primaryColor: '#c98f86',
    banner: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80',
    logo: 'https://augeggvlijscaebcggvk.supabase.co/storage/v1/object/public/mk-maker-media/brand/mk-maker-logo-tight.png',
    plan: 'medium',
    planUsage: { products: 286, ordersThisMonth: 301, stockItems: 362 },
  },
];

const demoProducts: Product[] = [
  {
    id: 'batom-matte-rose',
    storeId: 'store-mk-maker',
    name: 'Batom Matte Rose',
    description: 'Batom de acabamento matte com tom rose elegante para uso diario.',
    price: 49.9,
    promoPrice: 39.9,
    category: 'Maquiagem',
    imageUrl: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=900&q=80',
    stockQuantity: 24,
    isActive: true,
    isFeatured: true,
    variants: [
      { id: 'rose', label: 'Rose', stockQuantity: 12, price: 39.9 },
      { id: 'nude', label: 'Nude', stockQuantity: 6, price: 39.9 },
    ],
  },
  {
    id: 'mascara-cilios',
    storeId: 'store-mk-maker',
    name: 'Mascara de Cilios',
    description: 'Mascara para cilios com efeito volume e acabamento intenso.',
    price: 69.9,
    category: 'Olhos',
    imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80',
    stockQuantity: 41,
    isActive: true,
    variants: [
      { id: 'preta', label: 'Preta', stockQuantity: 19, price: 69.9 },
      { id: 'waterproof', label: 'Waterproof', stockQuantity: 22, price: 79.9 },
    ],
  },
  {
    id: 'paleta-sombras',
    storeId: 'store-mk-maker',
    name: 'Paleta de Sombras Nude',
    description: 'Paleta compacta com tons neutros para producoes leves e sofisticadas.',
    price: 119.9,
    category: 'Olhos',
    imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80',
    stockQuantity: 9,
    isActive: true,
    variants: [{ id: 'nude', label: 'Nude', stockQuantity: 9, price: 119.9 }],
  },
];

const initialOrders: Order[] = [
  {
    id: 'PED-1001',
    storeId: 'store-mk-maker',
    customerName: 'Cliente exemplo',
    phone: '(11) 99999-9999',
    total: 209.8,
    status: 'Aguardando WhatsApp',
    createdAt: 'Hoje, 14:20',
    items: [
      { name: 'Batom Matte Rose', quantity: 1, variant: 'Rose', unitPrice: 39.9 },
      { name: 'Mascara de Cilios', quantity: 1, variant: 'Preta', unitPrice: 69.9 },
    ],
  },
];

const defaultProfile: CheckoutProfile = {
  name: '',
  phone: '',
  address: '',
  paymentMethod: 'Pix a combinar',
  note: '',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function currency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [mode, setMode] = useState<Mode>('light');
  const [screen, setScreen] = useState<Screen>('entry');
  const [activeStore, setActiveStore] = useState<Store | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [liveProducts, setLiveProducts] = useState<Product[]>(demoProducts);
  const [cartByStore, setCartByStore] = useState<Record<string, CartItem[]>>({});
  const [favoritesByStore, setFavoritesByStore] = useState<Record<string, string[]>>({});
  const [checkoutProfile, setCheckoutProfile] = useState<CheckoutProfile>(defaultProfile);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [adminLogged, setAdminLogged] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [storeCode, setStoreCode] = useState('mk-maker');
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>();
  const [adminAccessCode, setAdminAccessCode] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const dark = mode === 'dark';
  const colors: Colors = {
    bg: dark ? '#101513' : '#f4f7f4',
    surface: dark ? '#18211d' : '#ffffff',
    surfaceAlt: dark ? '#202b26' : '#ecf4ef',
    text: dark ? '#f1f7f2' : '#152119',
    muted: dark ? '#9fb2a7' : '#627065',
    border: dark ? '#2c3a34' : '#dce7df',
    primary: activeStore?.primaryColor || '#c98f86',
    danger: '#e5484d',
  };

  const currentCart = activeStore ? cartByStore[activeStore.id] || [] : [];
  const favoriteIds = activeStore ? favoritesByStore[activeStore.id] || [] : [];
  const storeProducts = activeStore
    ? liveProducts.filter((p) => p.storeId === activeStore.id && p.isActive)
    : [];

  const cartDetails = useMemo(() => {
    return currentCart
      .map((item) => {
        const product = liveProducts.find((p) => p.id === item.productId);
        if (!product || !activeStore || product.storeId !== activeStore.id || !product.isActive)
          return null;
        const variant = product.variants.find((v) => v.id === item.variantId);
        const unitPrice = variant?.price || product.promoPrice || product.price;
        return { ...item, product, variant, unitPrice, total: unitPrice * item.quantity };
      })
      .filter(Boolean) as Array<
      CartItem & { product: Product; variant?: ProductVariant; unitPrice: number; total: number }
    >;
  }, [activeStore, currentCart, liveProducts]);

  const cartTotal = cartDetails.reduce((sum, item) => sum + item.total, 0);

  // ── Persistência local ──────────────────────────────────────────────────────

  useEffect(() => { void restoreLocalState(); }, []);
  useEffect(() => { void AsyncStorage.setItem('sistematize:cart', JSON.stringify(cartByStore)); }, [cartByStore]);
  useEffect(() => { void AsyncStorage.setItem('sistematize:favorites', JSON.stringify(favoritesByStore)); }, [favoritesByStore]);
  useEffect(() => { void AsyncStorage.setItem('sistematize:checkout-profile', JSON.stringify(checkoutProfile)); }, [checkoutProfile]);

  async function restoreLocalState() {
    const [storedCart, storedFavorites, storedProfile, recentStoreSlug] = await Promise.all([
      AsyncStorage.getItem('sistematize:cart'),
      AsyncStorage.getItem('sistematize:favorites'),
      AsyncStorage.getItem('sistematize:checkout-profile'),
      AsyncStorage.getItem('sistematize:recent-store'),
    ]);
    if (storedCart) setCartByStore(JSON.parse(storedCart) as Record<string, CartItem[]>);
    if (storedFavorites) setFavoritesByStore(JSON.parse(storedFavorites) as Record<string, string[]>);
    if (storedProfile) setCheckoutProfile({ ...defaultProfile, ...(JSON.parse(storedProfile) as CheckoutProfile) });
    if (recentStoreSlug) void openStore(recentStoreSlug);
  }

  // ── Ações de loja ───────────────────────────────────────────────────────────

  async function openStore(slug: string) {
    const normalizedSlug = slug.trim().toLowerCase().replace(/^.*loja\//, '');
    setIsLoading(true);
    try {
      const response = await getMobileStore(normalizedSlug);
      setActiveStore(response.store);
      setLiveProducts(response.products);
      setApiConnected(true);
      setStoreCode(response.store.slug);
      setScreen('catalog');
      await AsyncStorage.setItem('sistematize:recent-store', response.store.slug);
    } catch (error) {
      const store = demoStores.find((s) => s.slug === normalizedSlug);
      if (!store) {
        Alert.alert('Loja nao encontrada', error instanceof Error ? error.message : 'Confira o link.');
        return;
      }
      setActiveStore(store);
      setLiveProducts(demoProducts);
      setApiConnected(false);
      setStoreCode(store.slug);
      setScreen('catalog');
      await AsyncStorage.setItem('sistematize:recent-store', store.slug);
      Alert.alert('Modo local', 'A API nao respondeu. Abri a loja demo local para visualizacao.');
    } finally {
      setIsLoading(false);
    }
  }

  function addToCart(product: Product, variantId?: string) {
    if (!activeStore) return;
    setCartByStore((current) => {
      const items = current[activeStore.id] || [];
      const index = items.findIndex((item) => item.productId === product.id && item.variantId === variantId);
      const nextItems =
        index >= 0
          ? items.map((item, i) => (i === index ? { ...item, quantity: item.quantity + 1 } : item))
          : [...items, { productId: product.id, variantId, quantity: 1 }];
      return { ...current, [activeStore.id]: nextItems };
    });
    Alert.alert('Adicionado', 'Produto adicionado ao carrinho desta loja.');
  }

  function setCartQuantity(productId: string, variantId: string | undefined, quantity: number) {
    if (!activeStore) return;
    setCartByStore((current) => {
      const nextItems = (current[activeStore.id] || [])
        .map((item) =>
          item.productId === productId && item.variantId === variantId
            ? { ...item, quantity: Math.max(0, quantity) }
            : item,
        )
        .filter((item) => item.quantity > 0);
      return { ...current, [activeStore.id]: nextItems };
    });
  }

  function toggleFavorite(productId: string) {
    if (!activeStore) return;
    setFavoritesByStore((current) => {
      const ids = current[activeStore.id] || [];
      const nextIds = ids.includes(productId) ? ids.filter((id) => id !== productId) : [...ids, productId];
      return { ...current, [activeStore.id]: nextIds };
    });
  }

  async function submitCheckout() {
    if (!activeStore || cartDetails.length === 0) return;
    if (!checkoutProfile.name || !checkoutProfile.phone) {
      Alert.alert('Dados obrigatorios', 'Informe nome e telefone antes de enviar.');
      return;
    }
    const order: Order = {
      id: `PED-${Date.now().toString().slice(-6)}`,
      storeId: activeStore.id,
      customerName: checkoutProfile.name,
      phone: checkoutProfile.phone,
      total: cartTotal,
      status: 'Aguardando WhatsApp',
      createdAt: 'Agora',
      items: cartDetails.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        variant: item.variant?.label,
        unitPrice: item.unitPrice,
      })),
    };
    const message = [
      `Ola, quero fazer um pedido na ${activeStore.name}.`,
      '',
      `Cliente: ${checkoutProfile.name}`,
      `Telefone: ${checkoutProfile.phone}`,
      `Endereco/bairro: ${checkoutProfile.address || 'A combinar'}`,
      `Pagamento: ${checkoutProfile.paymentMethod}`,
      'Entrega: a combinar pelo WhatsApp',
      '',
      'Itens:',
      ...cartDetails.map(
        (item) =>
          `${item.quantity}x ${item.product.name}${item.variant ? ` - ${item.variant.label}` : ''} - ${currency(item.unitPrice)}`,
      ),
      '',
      `Total estimado: ${currency(cartTotal)}`,
      checkoutProfile.note ? `Observacao: ${checkoutProfile.note}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const whatsappUrl = `https://wa.me/${activeStore.whatsapp}?text=${encodeURIComponent(message)}`;
    setIsLoading(true);
    try {
      if (!apiConnected) {
        setOrders((current) => [order, ...current]);
        void (await import('react-native')).Linking.openURL(whatsappUrl);
        Alert.alert('Pedido local', 'API indisponivel. O WhatsApp foi aberto, mas o pedido ficou salvo apenas neste aparelho.');
        return;
      }
      const response = await createMobileOrder({
        customer: {
          fullName: checkoutProfile.name,
          phone: checkoutProfile.phone,
          address: checkoutProfile.address,
          paymentMethod: checkoutProfile.paymentMethod === 'Pix a combinar' ? 'pix' : 'cash',
          note: checkoutProfile.note,
        },
        items: cartDetails.map((item) => ({
          productId: item.productId,
          variantId: item.variantId ?? null,
          quantity: item.quantity,
        })),
      });
      const persistedOrder = {
        ...order,
        id: response.order.order_code || response.order.id,
        total: Number(response.order.total_amount ?? cartTotal),
      };
      setOrders((current) => [persistedOrder, ...current]);
      setCartByStore((current) => ({ ...current, [activeStore.id]: [] }));
      void (await import('react-native')).Linking.openURL(response.whatsappUrl || whatsappUrl);
      Alert.alert('Pedido criado', 'O pedido foi salvo no backend e o WhatsApp foi aberto.');
    } catch (error) {
      Alert.alert('Erro ao criar pedido', error instanceof Error ? error.message : 'Nao foi possivel salvar no backend.');
    } finally {
      setIsLoading(false);
    }
  }

  function mapAdminOrder(row: AdminOrderResponse): Order {
    const statusMap: Record<string, OrderStatus> = {
      new: 'Aguardando WhatsApp',
      confirmed: 'Confirmado',
      paid: 'Entregue',
      sent: 'Saiu para entrega',
      cancelled: 'Cancelado',
    };
    return {
      id: row.id,
      storeId: 'store-default',
      customerName: row.customer_name,
      phone: row.customer_phone || '',
      total: Number(row.total_amount ?? 0),
      status: statusMap[row.status] || 'Aguardando WhatsApp',
      createdAt: new Date(row.created_at).toLocaleString('pt-BR'),
      items: (row.order_items ?? []).map((item) => ({
        name: item.product_name,
        quantity: item.quantity,
        variant: item.variant_label ?? undefined,
        unitPrice: Number(item.unit_price ?? 0),
      })),
    };
  }

  async function refreshAdminOrders() {
    if (!activeStore) return;
    const rows = await listAdminOrders();
    setOrders(rows.map(mapAdminOrder));
  }

  async function updateOrderStatus(orderId: string, status: OrderStatus) {
    if (!apiConnected || orderId.startsWith('PED-')) {
      setOrders((current) => current.map((o) => (o.id === orderId ? { ...o, status } : o)));
      return;
    }
    try {
      const updated = await updateAdminOrderStatus(orderId, status);
      const mapped = mapAdminOrder(updated);
      setOrders((current) => current.map((o) => (o.id === orderId ? mapped : o)));
    } catch (error) {
      Alert.alert('Erro ao atualizar pedido', error instanceof Error ? error.message : 'Nao foi possivel atualizar.');
    }
  }

  async function submitAdminLogin() {
    if (!adminAccessCode || !adminEmail || !adminPassword) {
      Alert.alert('Dados obrigatorios', 'Informe codigo de acesso, email e senha.');
      return;
    }
    setIsLoading(true);
    try {
      const gateToken = await requestAdminGate(adminAccessCode);
      await loginAdmin(adminEmail, adminPassword, gateToken);
      setAdminLogged(true);
      setScreen('admin-dashboard');
      await refreshAdminOrders();
    } catch (error) {
      Alert.alert('Login invalido', error instanceof Error ? error.message : 'Nao foi possivel autenticar.');
    } finally {
      setIsLoading(false);
    }
  }

  // ── Roteador de telas ───────────────────────────────────────────────────────

  const entryFallbackProps = {
    storeCode,
    setStoreCode,
    onOpenStore: (slug: string) => void openStore(slug),
  };

  function renderScreen() {
    switch (screen) {
      case 'entry':
        return (
          <EntryScreen
            storeCode={storeCode}
            setStoreCode={setStoreCode}
            onOpen={(slug) => void openStore(slug)}
            colors={colors}
          />
        );
      case 'catalog':
        return (
          <CatalogScreen
            activeStore={activeStore}
            storeProducts={storeProducts}
            favoriteIds={favoriteIds}
            onSelectProduct={(product) => {
              setSelectedProduct(product);
              setSelectedVariantId(product.variants[0]?.id);
              setScreen('product');
            }}
            onToggleFavorite={toggleFavorite}
            colors={colors}
            {...entryFallbackProps}
          />
        );
      case 'product':
        return (
          <ProductScreen
            selectedProduct={selectedProduct}
            selectedVariantId={selectedVariantId}
            setSelectedVariantId={setSelectedVariantId}
            onAddToCart={addToCart}
            onBack={() => setScreen('catalog')}
            colors={colors}
          />
        );
      case 'favorites':
        return (
          <FavoritesScreen
            storeProducts={storeProducts}
            favoriteIds={favoriteIds}
            onViewProduct={(product) => {
              setSelectedProduct(product);
              setScreen('product');
            }}
            colors={colors}
          />
        );
      case 'cart':
        return (
          <CartScreen
            cartDetails={cartDetails}
            cartTotal={cartTotal}
            onUpdateQuantity={setCartQuantity}
            onCheckout={() => setScreen('checkout')}
            colors={colors}
          />
        );
      case 'checkout':
        return (
          <CheckoutScreen
            checkoutProfile={checkoutProfile}
            setCheckoutProfile={setCheckoutProfile}
            onSubmit={() => void submitCheckout()}
            onReset={() => setCheckoutProfile(defaultProfile)}
            isLoading={isLoading}
            colors={colors}
          />
        );
      case 'admin-login':
        return (
          <AdminLoginScreen
            adminAccessCode={adminAccessCode}
            setAdminAccessCode={setAdminAccessCode}
            adminEmail={adminEmail}
            setAdminEmail={setAdminEmail}
            adminPassword={adminPassword}
            setAdminPassword={setAdminPassword}
            onLogin={() => void submitAdminLogin()}
            isLoading={isLoading}
            colors={colors}
          />
        );
      case 'admin-dashboard':
        return (
          <AdminDashboardScreen
            activeStore={activeStore}
            plans={plans}
            colors={colors}
            {...entryFallbackProps}
          />
        );
      case 'admin-products':
        return <AdminProductsScreen storeProducts={storeProducts} colors={colors} />;
      case 'admin-orders':
        return (
          <AdminOrdersScreen
            orders={orders}
            activeStore={activeStore}
            onUpdateStatus={(id, status) => void updateOrderStatus(id, status)}
            colors={colors}
          />
        );
      case 'admin-settings':
        return (
          <AdminSettingsScreen
            activeStore={activeStore}
            onLogout={() => { setAdminLogged(false); setScreen('catalog'); }}
            setScreen={setScreen}
            colors={colors}
            {...entryFallbackProps}
          />
        );
      default:
        return (
          <EntryScreen
            storeCode={storeCode}
            setStoreCode={setStoreCode}
            onOpen={(slug) => void openStore(slug)}
            colors={colors}
          />
        );
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Header
        mode={mode}
        setMode={setMode}
        activeStore={activeStore}
        isLoading={isLoading}
        apiConnected={apiConnected}
        colors={colors}
      />
      <View style={styles.body}>{renderScreen()}</View>
      <BottomNav
        screen={screen}
        setScreen={setScreen}
        activeStore={activeStore}
        adminLogged={adminLogged}
        currentCart={currentCart}
        colors={colors}
      />
    </SafeAreaView>
  );
}
