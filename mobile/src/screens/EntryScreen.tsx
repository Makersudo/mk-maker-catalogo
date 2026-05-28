import React from 'react';
import { ScrollView, Text, TextInput } from 'react-native';
import { Button } from '../components/Button';
import { Surface } from '../components/Surface';
import { styles } from '../styles';
import { Colors } from '../types';

interface EntryScreenProps {
  storeCode: string;
  setStoreCode: (code: string) => void;
  onOpen: (slug: string) => void;
  colors: Colors;
}

export function EntryScreen({ storeCode, setStoreCode, onOpen, colors }: EntryScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Surface colors={colors} style={styles.heroCard}>
        <Text style={[styles.title, { color: colors.text }]}>Entre pelo link ou QR Code da loja</Text>
        <Text style={[styles.paragraph, { color: colors.muted }]}>
          O cliente fica preso a loja recebida pelo link. Sem link, informe o codigo da loja para carregar o catalogo.
        </Text>
        <TextInput
          value={storeCode}
          onChangeText={setStoreCode}
          placeholder="mk-maker ou link /loja/mk-maker"
          placeholderTextColor={colors.muted}
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
        />
        <Button label="Abrir loja" onPress={() => onOpen(storeCode)} colors={colors} />
        <Button
          label="Simular leitura de QR Code"
          onPress={() => onOpen('mk-maker')}
          tone="secondary"
          colors={colors}
        />
      </Surface>
    </ScrollView>
  );
}
