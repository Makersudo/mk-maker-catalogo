import { useEffect, useState } from 'react';
import { getPublicSettings, type StoreSettings } from '../services/settingsService';

export const DEFAULT_PUBLIC_SETTINGS: StoreSettings = {
  store_name: 'MK MAKER',
  store_slug: 'mk-maker',
  store_primary_color: '#d68a00',
  store_secondary_color: '#111827',
};

let cachedSettings: StoreSettings | null = null;
let pendingSettings: Promise<StoreSettings> | null = null;

function loadSettings() {
  if (cachedSettings) return Promise.resolve(cachedSettings);

  if (!pendingSettings) {
    pendingSettings = getPublicSettings()
      .then((settings) => {
        cachedSettings = { ...DEFAULT_PUBLIC_SETTINGS, ...settings };
        return cachedSettings;
      })
      .catch(() => DEFAULT_PUBLIC_SETTINGS)
      .finally(() => {
        pendingSettings = null;
      });
  }

  return pendingSettings;
}

export function usePublicSettings() {
  const [settings, setSettings] = useState<StoreSettings>(cachedSettings ?? DEFAULT_PUBLIC_SETTINGS);

  useEffect(() => {
    let active = true;

    loadSettings().then((loaded) => {
      if (active) setSettings(loaded);
    });

    return () => {
      active = false;
    };
  }, []);

  return settings;
}

