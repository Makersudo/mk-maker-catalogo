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

const DEFAULT_SUPABASE_URL = 'https://augeggvlijscaebcggvk.supabase.co';
const DEFAULT_API_URL = 'https://central-admin-backend.onrender.com';
const CACHE_KEY = 'mk_catalog_license_cache';
const GRACE_PERIOD_MS = 1000 * 60 * 60 * 48; // 48 horas de tolerância offline

const META_TAG = '||META:';

function decodeLicenseRow(row: any) {
  if (!row) return row;
  const result = { ...row };
  let rawMsg = result.message || '';

  if (rawMsg.includes(META_TAG)) {
    const parts = rawMsg.split(META_TAG);
    result.message = parts[0].trim() || null;
    try {
      const meta = JSON.parse(parts[1]);
      if (meta.expires_at !== undefined) result.expires_at = meta.expires_at;
      if (meta.scheduled_block_at !== undefined) result.scheduled_block_at = meta.scheduled_block_at;
      if (meta.scheduled_unblock_at !== undefined) result.scheduled_unblock_at = meta.scheduled_unblock_at;
      if (meta.plan_start_date !== undefined) result.plan_start_date = meta.plan_start_date;
      if (meta.billing_cycle_days !== undefined) result.billing_cycle_days = meta.billing_cycle_days;
      if (meta.payment_status !== undefined) result.payment_status = meta.payment_status;
      if (meta.plan_price !== undefined) result.plan_price = meta.plan_price;
      if (meta.last_payment_date !== undefined) result.last_payment_date = meta.last_payment_date;
    } catch (e) {
      console.warn("Failed to parse META json:", e);
    }
  }

  return result;
}

function evaluateLicenseStatus(rawData: any): LicenseStatus {
  if (!rawData) {
    return {
      active: false,
      status: 'not_found',
      message: 'Licença não encontrada no sistema.',
    };
  }

  const data = decodeLicenseRow(rawData);
  const now = new Date();

  // 1. Verificação de chave desativada manualmente (Prioridade Máxima)
  if (!data.active) {
    return {
      active: false,
      status: 'suspended',
      message: data.message || 'Plataforma suspensa por pendências financeiras.',
      supportContact: data.support_contact
    };
  }

  // 2. Verificação de agendamento de bloqueio por data/hora
  let isScheduledBlocked = false;
  if (data.scheduled_block_at && now >= new Date(data.scheduled_block_at)) {
    if (data.scheduled_unblock_at && new Date(data.scheduled_unblock_at) > new Date(data.scheduled_block_at) && now >= new Date(data.scheduled_unblock_at)) {
      isScheduledBlocked = false;
    } else {
      isScheduledBlocked = true;
    }
  }

  if (isScheduledBlocked) {
    return {
      active: false,
      status: 'suspended',
      message: data.message || 'Plataforma suspensa conforme bloqueio agendado.',
      supportContact: data.support_contact
    };
  }

  // 3. Verificação de expiração por data/hora do plano
  if (data.expires_at && now >= new Date(data.expires_at)) {
    return {
      active: false,
      status: 'suspended',
      message: 'Licença expirada. Entre em contato com o suporte para renovação.',
      supportContact: data.support_contact
    };
  }

  // 4. Verificação de Ciclo de 30 Dias (Plan Start Date)
  if (data.plan_start_date) {
    const startDate = new Date(data.plan_start_date);
    const cycleDays = Number(data.billing_cycle_days || 30);
    const diffMs = now.getTime() - startDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays > cycleDays) {
      const nextCycleExpiry = data.expires_at ? new Date(data.expires_at) : new Date(startDate.getTime() + cycleDays * 24 * 60 * 60 * 1000);
      if (now >= nextCycleExpiry) {
        return {
          active: false,
          status: 'suspended',
          message: 'Ciclo de 30 dias do plano encerrado. Entre em contato com o suporte para renovação.',
          supportContact: data.support_contact
        };
      }
    }
  }

  return {
    active: true,
    status: 'active',
    message: 'Licença ativa',
    supportContact: data.support_contact
  };
}

/**
 * Verifica o status da licença do catálogo.
 * ESTRATÉGIA:
 * 1º PASSO (PRIMÁRIO): Consulta Direta de Altíssima Velocidade no SUPABASE REST API.
 * 2º PASSO (SECUNDÁRIO): Fallback na API do Central Admin Backend.
 * 3º PASSO (TERCIÁRIO): Cache Local com Período de Tolerância Offline.
 */
export async function checkCatalogLicense(): Promise<LicenseStatus> {
  const licenseKey = import.meta.env.VITE_CENTRAL_LICENSE_KEY;
  let apiUrl = import.meta.env.VITE_CENTRAL_API_URL || DEFAULT_API_URL;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_KEY || '';

  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    apiUrl = 'http://localhost:3001';
  }

  if (!licenseKey) {
    return {
      active: true,
      status: 'active',
      message: 'Licença local ativa (modo desenvolvimento)',
    };
  }

  // Recupera o cache local prévio
  const cachedStr = localStorage.getItem(CACHE_KEY);
  let cached: CachedLicense | null = null;
  if (cachedStr) {
    try {
      cached = JSON.parse(cachedStr);
    } catch {
      cached = null;
    }
  }

  // ⚡ 1º PASSO (PRIMÁRIO): Consulta DIRETA AO SUPABASE REST API se houver chave pública anon configurada
  if (supabaseKey) {
    try {
      const supabaseController = new AbortController();
      const supTimeout = setTimeout(() => supabaseController.abort(), 4000);

      const supResponse = await fetch(
        `${supabaseUrl}/rest/v1/catalog_licenses?license_key=eq.${encodeURIComponent(licenseKey)}&select=*`,
        {
          method: 'GET',
          signal: supabaseController.signal,
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Accept': 'application/json'
          }
        }
      );
      clearTimeout(supTimeout);

      if (supResponse.ok) {
        const rows = await supResponse.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const result = evaluateLicenseStatus(rows[0]);

          // Grava no cache imediato
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            status: result,
            lastChecked: Date.now()
          }));

          return result;
        }
      }
    } catch (err) {
      console.warn('Consulta direta ao Supabase falhou ou sofreu timeout, tentando backend secundário...', err);
    }
  }

  // ⚡ 2º PASSO (SECUNDÁRIO): Fallback na API Central Backend
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

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

    const cacheData: CachedLicense = {
      status: result,
      lastChecked: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

    return result;

  } catch (error: any) {
    clearTimeout(timeoutId);

    // ⚡ 3º PASSO (TERCIÁRIO): Período de tolerância para clientes offline
    if (cached && cached.status.active) {
      const timeSinceLastCheck = Date.now() - cached.lastChecked;
      if (timeSinceLastCheck < GRACE_PERIOD_MS) {
        return cached.status;
      }
    }

    return {
      active: false,
      status: 'error',
      message: 'Licença pendente de verificação online. Verifique sua conexão com a internet.',
    };
  }
}
