import React from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Button } from '../components/Button';
import { Surface } from '../components/Surface';
import { EntryScreen } from './EntryScreen';
import { styles } from '../styles';
import { Colors, Order, OrderStatus, Plan, PlanCode, Product, Screen, Store } from '../types';

function currency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function usagePercent(value: number, limit: number | null) {
  if (limit === null) return 0;
  return Math.min(100, Math.round((value / limit) * 100));
}

function getWarning(percent: number) {
  if (percent >= 100) return 'Limite atingido: upgrade ou extra necessario.';
  if (percent >= 85) return 'Uso alto: recomende upgrade antes do bloqueio.';
  if (percent >= 70) return 'Atencao: limite se aproximando.';
  return 'Uso saudavel.';
}

// ── Admin Login ──────────────────────────────────────────────────────────────

interface AdminLoginScreenProps {
  adminAccessCode: string;
  setAdminAccessCode: (v: string) => void;
  adminEmail: string;
  setAdminEmail: (v: string) => void;
  adminPassword: string;
  setAdminPassword: (v: string) => void;
  onLogin: () => void;
  isLoading: boolean;
  colors: Colors;
}

export function AdminLoginScreen({
  adminAccessCode,
  setAdminAccessCode,
  adminEmail,
  setAdminEmail,
  adminPassword,
  setAdminPassword,
  onLogin,
  isLoading,
  colors,
}: AdminLoginScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Surface colors={colors}>
        <Text style={[styles.title, { color: colors.text }]}>Login do dono</Text>
        <Text style={[styles.paragraph, { color: colors.muted }]}>
          Usa o mesmo acesso admin do SaaS: codigo de acesso, email e senha configurados no backend.
        </Text>
        <TextInput
          value={adminAccessCode}
          onChangeText={setAdminAccessCode}
          placeholder="codigo de acesso"
          placeholderTextColor={colors.muted}
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
        />
        <TextInput
          value={adminEmail}
          onChangeText={setAdminEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="email@loja.com"
          placeholderTextColor={colors.muted}
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
        />
        <TextInput
          value={adminPassword}
          onChangeText={setAdminPassword}
          placeholder="senha"
          secureTextEntry
          placeholderTextColor={colors.muted}
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
        />
        <Button
          label={isLoading ? 'Entrando...' : 'Entrar como dono'}
          onPress={onLogin}
          colors={colors}
        />
      </Surface>
    </ScrollView>
  );
}

// ── Plan Usage Bar ────────────────────────────────────────────────────────────

function PlanUsage({
  label,
  value,
  limit,
  colors,
}: {
  label: string;
  value: number;
  limit: number | null;
  colors: Colors;
}) {
  const percent = usagePercent(value, limit);
  return (
    <View style={styles.usageBlock}>
      <View style={styles.usageHeader}>
        <Text style={{ color: colors.text, fontWeight: '700' }}>{label}</Text>
        <Text style={{ color: colors.muted }}>
          {limit === null ? `${value} / ilimitado` : `${value} / ${limit}`}
        </Text>
      </View>
      {limit !== null && (
        <View style={[styles.progress, { backgroundColor: colors.surfaceAlt }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${percent}%`, backgroundColor: percent >= 100 ? colors.danger : colors.primary },
            ]}
          />
        </View>
      )}
      <Text style={{ color: percent >= 85 ? colors.danger : colors.muted }}>
        {limit === null ? 'Master ilimitado.' : getWarning(percent)}
      </Text>
    </View>
  );
}

// ── Admin Dashboard ───────────────────────────────────────────────────────────

interface AdminDashboardScreenProps {
  activeStore: Store | null;
  plans: Record<PlanCode, Plan>;
  colors: Colors;
  // EntryScreen fallback
  storeCode: string;
  setStoreCode: (v: string) => void;
  onOpenStore: (slug: string) => void;
}

export function AdminDashboardScreen({
  activeStore,
  plans,
  colors,
  storeCode,
  setStoreCode,
  onOpenStore,
}: AdminDashboardScreenProps) {
  if (!activeStore) {
    return (
      <EntryScreen storeCode={storeCode} setStoreCode={setStoreCode} onOpen={onOpenStore} colors={colors} />
    );
  }
  const plan = plans[activeStore.plan];
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Painel da loja</Text>
      <Surface colors={colors}>
        <Text style={[styles.title, { color: colors.text }]}>{activeStore.name}</Text>
        <Text style={{ color: colors.muted }}>
          Plano {plan.label} - {plan.price}/mes
        </Text>
        <PlanUsage label="Produtos" value={activeStore.planUsage.products} limit={plan.products} colors={colors} />
        <PlanUsage label="Pedidos do mes" value={activeStore.planUsage.ordersThisMonth} limit={plan.orders} colors={colors} />
        <PlanUsage label="Estoque" value={activeStore.planUsage.stockItems} limit={plan.stock} colors={colors} />
      </Surface>
      <Surface colors={colors}>
        <Text style={[styles.label, { color: colors.text }]}>Notificacoes</Text>
        <Text style={{ color: colors.muted }}>
          Novo pedido gera push no app e tambem segue pelo WhatsApp do cliente.
        </Text>
      </Surface>
    </ScrollView>
  );
}

// ── Admin Products ────────────────────────────────────────────────────────────

interface AdminProductsScreenProps {
  storeProducts: Product[];
  colors: Colors;
}

export function AdminProductsScreen({ storeProducts, colors }: AdminProductsScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Produtos</Text>
      <Button
        label="Criar produto completo"
        onPress={() =>
          Alert.alert(
            'API-ready',
            'Tela preparada para criar produto com fotos, variacoes e estoque.',
          )
        }
        colors={colors}
      />
      {storeProducts.map((product) => (
        <Surface key={product.id} colors={colors} style={styles.rowCard}>
          <Text style={[styles.productName, { color: colors.text }]}>{product.name}</Text>
          <Text style={{ color: colors.muted }}>
            {product.category} - estoque {product.stockQuantity} -{' '}
            {currency(product.promoPrice || product.price)}
          </Text>
          <View style={styles.inlineActions}>
            <Button
              label="Editar"
              onPress={() => Alert.alert('Editar produto', 'Equivalente ao site, adaptado para mobile.')}
              colors={colors}
            />
            <Button
              label="Inativar"
              onPress={() =>
                Alert.alert('Inativar', 'A API deve permitir editar/inativar mesmo no limite.')
              }
              tone="secondary"
              colors={colors}
            />
          </View>
        </Surface>
      ))}
    </ScrollView>
  );
}

// ── Admin Orders ──────────────────────────────────────────────────────────────

interface AdminOrdersScreenProps {
  orders: Order[];
  activeStore: Store | null;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  colors: Colors;
}

export function AdminOrdersScreen({
  orders,
  activeStore,
  onUpdateStatus,
  colors,
}: AdminOrdersScreenProps) {
  const storeOrders = activeStore ? orders.filter((o) => o.storeId === activeStore.id) : [];

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Pedidos</Text>
      {storeOrders.map((order) => (
        <Surface key={order.id} colors={colors} style={styles.rowCard}>
          <Text style={[styles.productName, { color: colors.text }]}>
            {order.id} - {order.customerName}
          </Text>
          <Text style={{ color: colors.muted }}>
            {order.createdAt} - {currency(order.total)}
          </Text>
          <Text style={{ color: colors.primary }}>{order.status}</Text>
          <View style={styles.chips}>
            {(
              ['Confirmado', 'Em separacao', 'Saiu para entrega', 'Entregue', 'Cancelado'] as OrderStatus[]
            ).map((status) => (
              <Pressable
                key={status}
                style={[styles.chip, { borderColor: colors.border }]}
                onPress={() => onUpdateStatus(order.id, status)}
              >
                <Text style={{ color: colors.text }}>{status}</Text>
              </Pressable>
            ))}
          </View>
          <Button
            label="Abrir WhatsApp do cliente"
            onPress={() => Linking.openURL(`https://wa.me/55${order.phone.replace(/\D/g, '')}`)}
            colors={colors}
          />
        </Surface>
      ))}
    </ScrollView>
  );
}

// ── Admin Settings ────────────────────────────────────────────────────────────

const PUBLIC_CATALOG_URL = 'https://mk-maker-catalogo.vercel.app/catalogo';

interface AdminSettingsScreenProps {
  activeStore: Store | null;
  onLogout: () => void;
  setScreen: (screen: Screen) => void;
  colors: Colors;
  // EntryScreen fallback
  storeCode: string;
  setStoreCode: (v: string) => void;
  onOpenStore: (slug: string) => void;
}

export function AdminSettingsScreen({
  activeStore,
  onLogout,
  colors,
  storeCode,
  setStoreCode,
  onOpenStore,
}: AdminSettingsScreenProps) {
  if (!activeStore) {
    return (
      <EntryScreen storeCode={storeCode} setStoreCode={setStoreCode} onOpen={onOpenStore} colors={colors} />
    );
  }
  const publicLink = PUBLIC_CATALOG_URL;
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Configuracoes e QR</Text>
      <Surface colors={colors}>
        <Text style={[styles.title, { color: colors.text }]}>{activeStore.name}</Text>
        <Text style={{ color: colors.muted }}>WhatsApp: {activeStore.whatsapp}</Text>
        <Text style={{ color: colors.muted }}>Cor principal: {activeStore.primaryColor}</Text>
        <View style={[styles.qrMock, { borderColor: colors.border }]}>
          <Text style={{ color: colors.text, fontWeight: '900', fontSize: 28 }}>QR</Text>
          <Text style={{ color: colors.muted, textAlign: 'center' }}>{publicLink}</Text>
        </View>
        <Button label="Copiar/compartilhar link" onPress={() => Linking.openURL(publicLink)} colors={colors} />
        <Button label="Sair do admin" onPress={onLogout} tone="secondary" colors={colors} />
      </Surface>
    </ScrollView>
  );
}
