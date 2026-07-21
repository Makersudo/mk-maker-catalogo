export interface LicenseStatus {
  active: boolean;
  status: 'active' | 'suspended' | 'not_found' | 'error';
  message: string;
  supportContact?: string;
}

interface CachedLicense {
  status: LicenseStatus;
  lastChecked: number; // Timestamp em milissegundos
}

const DEFAULT_API_URL = 'https://central-admin-backend.onrender.com';
const CACHE_KEY = 'mk_catalog_license_cache';
const GRACE_PERIOD_MS = 1000 * 60 * 60 * 48; // 48 horas de tolerância offline

/**
 * Verifica o status da licença do catálogo com a Central de Gerenciamento.
 * Implementa cache local e período de tolerância offline para segurança.
 */
export async function checkCatalogLicense(): Promise<LicenseStatus> {
  const licenseKey = import.meta.env.VITE_CENTRAL_LICENSE_KEY;
  let apiUrl = import.meta.env.VITE_CENTRAL_API_URL || DEFAULT_API_URL;

  // Em ambiente local de desenvolvimento/teste, desvia automaticamente para a API local
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    apiUrl = 'http://localhost:3001';
  }

  // 1. Se não houver chave de licença no .env, assume que é dev local livre
  if (!licenseKey) {
    return {
      active: true,
      status: 'active',
      message: 'Licença local ativa (modo desenvolvimento)',
    };
  }

  // Recupera o cache de licença anterior
  const cachedStr = localStorage.getItem(CACHE_KEY);
  let cached: CachedLicense | null = null;
  if (cachedStr) {
    try {
      cached = JSON.parse(cachedStr);
    } catch {
      cached = null;
    }
  }

  // Cria sinalizador de aborto para o fetch (timeout de 8 segundos)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(
      `${apiUrl}/api/licenses/validate?key=${encodeURIComponent(licenseKey)}&domain=${encodeURIComponent(window.location.hostname)}`,
      {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        }
      }
    );
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const result = data as LicenseStatus;

    // Atualiza o cache local imediatamente com a resposta em tempo real da Central
    const cacheData: CachedLicense = {
      status: result,
      lastChecked: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

    return result;

  } catch (error: any) {
    clearTimeout(timeoutId);
    console.warn('Falha de conexão com a Central. Verificando cache offline...', error);

    // 2. Se falhar a conexão, apenas usa o cache offline se a licença estava previamente ATIVA
    if (cached && cached.status.active) {
      const timeSinceLastCheck = Date.now() - cached.lastChecked;
      
      if (timeSinceLastCheck < GRACE_PERIOD_MS) {
        console.log(`Usando licença cacheada offline (verificada há ${Math.round(timeSinceLastCheck / 1000 / 60)} min)`);
        return cached.status;
      }
    }

    // 3. Sem cache ativo ou sem conexão: Bloqueia preventivamente
    return {
      active: false,
      status: 'error',
      message: 'Licença pendente de verificação online. Verifique sua conexão com a internet.',
    };
  }
}
