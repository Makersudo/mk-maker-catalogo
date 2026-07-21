/**
 * Utilitário para otimização de imagens em tempo real utilizando a CDN gratuita weserv.nl.
 * Reduz drasticamente o tamanho das imagens convertendo para WebP e ajustando resolução e qualidade.
 */
export function getOptimizedImageUrl(originalUrl: string, width: number = 800, quality: number = 75): string {
  if (!originalUrl) return '';
  
  // Se for uma imagem local, data URI, ou já estiver usando o otimizador, retorna como está
  if (
    originalUrl.startsWith('data:') || 
    originalUrl.startsWith('/') || 
    originalUrl.includes('wsrv.nl') || 
    originalUrl.includes('images.weserv.nl')
  ) {
    return originalUrl;
  }

  // Utiliza a CDN global wsrv.nl para servir a imagem proxy otimizada
  return `https://wsrv.nl/?url=${encodeURIComponent(originalUrl)}&w=${width}&output=webp&q=${quality}&we`;
}
