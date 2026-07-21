export interface LicenseStatus {
  active: boolean;
  status: 'active' | 'suspended' | 'not_found' | 'error';
  message: string;
  supportContact?: string;
}

const DEFAULT_API_URL = 'https://mkmaker-central-api.onrender.com';

/**
 * Verifica o status da licença do catálogo com a Central Geral usando fetch nativo.
 */
export async function checkCatalogLicense(): Promise<LicenseStatus> {
  const licenseKey = import.meta.env.VITE_CENTRAL_LICENSE_KEY;
  const apiUrl = import.meta.env.VITE_CENTRAL_API_URL || DEFAULT_API_URL;

  // Se não houver chave de licença configurada no .env, assume que é desenvolvimento local / livre de licença
  if (!licenseKey) {
    return {
      active: true,
      status: 'active',
      message: 'Licença local ativa (modo desenvolvimento)',
    };
  }

  // Cria um sinalizador de timeout para o fetch nativo
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
    return data as LicenseStatus;
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error('Erro ao validar licença do catálogo:', error);
    
    // Se falhar a comunicação, por padrão falhamos liberado (ativo) com erro
    return {
      active: true, 
      status: 'error',
      message: 'Erro de comunicação com o servidor de licenças. Modo de segurança ativo.',
    };
  }
}
