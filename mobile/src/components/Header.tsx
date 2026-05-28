import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { styles } from '../styles';
import { Colors, Mode, Store } from '../types';

interface HeaderProps {
  mode: Mode;
  setMode: (mode: Mode) => void;
  activeStore: Store | null;
  isLoading: boolean;
  apiConnected: boolean;
  colors: Colors;
}

export function Header({ mode, setMode, activeStore, isLoading, apiConnected, colors }: HeaderProps) {
  const dark = mode === 'dark';

  return (
    <View style={styles.header}>
      <View>
        <Text style={[styles.appName, { color: colors.text }]}>{activeStore?.name ?? 'MK MAKER'}</Text>
        <Text style={[styles.headerSub, { color: colors.muted }]}>
          {activeStore ? `Loja fixa: ${activeStore.name}` : 'Catalogo mobile'}
        </Text>
        <Text style={[styles.headerSub, { color: apiConnected ? colors.primary : colors.muted }]}>
          {isLoading ? 'Sincronizando...' : apiConnected ? 'Backend conectado' : 'Modo local/demo'}
        </Text>
      </View>
      <Pressable
        onPress={() => setMode(dark ? 'light' : 'dark')}
        style={[styles.modeButton, { borderColor: colors.border }]}
      >
        <Text style={{ color: colors.text }}>{dark ? 'Claro' : 'Escuro'}</Text>
      </Pressable>
    </View>
  );
}
