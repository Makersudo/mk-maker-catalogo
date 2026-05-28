import React from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { EntryScreen } from './EntryScreen';
import { styles } from '../styles';
import { Colors, Product, Store } from '../types';

function currency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function isImageLogo(value: string) {
  return /^https?:\/\//i.test(value);
}

interface CatalogScreenProps {
  activeStore: Store | null;
  storeProducts: Product[];
  favoriteIds: string[];
  onSelectProduct: (product: Product) => void;
  onToggleFavorite: (productId: string) => void;
  colors: Colors;
  // EntryScreen fallback props
  storeCode: string;
  setStoreCode: (code: string) => void;
  onOpenStore: (slug: string) => void;
}

export function CatalogScreen({
  activeStore,
  storeProducts,
  favoriteIds,
  onSelectProduct,
  onToggleFavorite,
  colors,
  storeCode,
  setStoreCode,
  onOpenStore,
}: CatalogScreenProps) {
  if (!activeStore) {
    return (
      <EntryScreen
        storeCode={storeCode}
        setStoreCode={setStoreCode}
        onOpen={onOpenStore}
        colors={colors}
      />
    );
  }

  const logoIsImage = isImageLogo(activeStore.logo);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.bannerWrap}>
        <Image source={{ uri: activeStore.banner }} style={styles.banner} />
        <View style={styles.bannerOverlay}>
          <View style={styles.storeLogoFrame}>
            {logoIsImage ? (
              <Image source={{ uri: activeStore.logo }} style={styles.storeLogoImage} resizeMode="contain" />
            ) : (
              <Text style={styles.storeLogoText}>{activeStore.logo}</Text>
            )}
          </View>
          <Text style={styles.bannerTitle}>{activeStore.name}</Text>
          <Text style={styles.bannerText}>Catalogo preso ao link /loja/{activeStore.slug}</Text>
        </View>
      </View>
      <View style={styles.sectionTitleRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Produtos em destaque</Text>
        <Text style={{ color: colors.muted }}>{storeProducts.length} itens</Text>
      </View>
      <View style={styles.grid}>
        {storeProducts.map((product) => (
          <Pressable
            key={product.id}
            onPress={() => onSelectProduct(product)}
            style={[styles.productCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
            <Text style={[styles.productName, { color: colors.text }]}>{product.name}</Text>
            <Text style={{ color: colors.muted }}>{product.category}</Text>
            <Text style={[styles.price, { color: colors.primary }]}>
              {currency(product.promoPrice || product.price)}
            </Text>
            <Pressable onPress={() => onToggleFavorite(product.id)}>
              <Text style={{ color: favoriteIds.includes(product.id) ? colors.danger : colors.muted }}>
                {favoriteIds.includes(product.id) ? 'Favoritado' : 'Favoritar'}
              </Text>
            </Pressable>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
