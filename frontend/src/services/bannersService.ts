import { apiRequest } from './apiClient';

export type LinkType = 'product' | 'category' | 'campaign' | 'url' | 'none';
export type AnimationType = 'slide' | 'fade' | 'zoom' | 'flip' | 'bounce' | 'typewriter';

export interface BannerAnnouncement {
  id: string;
  title: string;
  subtitle?: string | null;
  emoji?: string | null;
  image_url?: string | null;
  bg_color: string;
  text_color: string;
  link_type: LinkType;
  link_value?: string | null;
  animation_type: AnimationType;
  duration_seconds: number;
  sort_order: number;
  is_active: boolean;
  is_full_banner?: boolean;
  created_at: string;
  updated_at: string;
}

export interface BannerPayload {
  title: string;
  subtitle?: string | null;
  emoji?: string | null;
  image_url?: string | null;
  bg_color: string;
  text_color: string;
  link_type: LinkType;
  link_value?: string | null;
  animation_type: AnimationType;
  duration_seconds: number;
  sort_order: number;
  is_active: boolean;
  is_full_banner?: boolean;
}

export const ANIMATION_OPTIONS: { value: AnimationType; label: string; description: string }[] = [
  { value: 'slide',      label: 'Slide',       description: 'Desliza da direita para esquerda' },
  { value: 'fade',       label: 'Fade',         description: 'Aparece suavemente' },
  { value: 'zoom',       label: 'Zoom',         description: 'Expande ao entrar' },
  { value: 'flip',       label: 'Flip',         description: 'Vira como uma carta' },
  { value: 'bounce',     label: 'Bounce',       description: 'Salta ao aparecer' },
  { value: 'typewriter', label: 'Typewriter',   description: 'Texto digitado letra a letra' },
];

export const LINK_TYPE_OPTIONS: { value: LinkType; label: string }[] = [
  { value: 'none',     label: 'Sem link' },
  { value: 'url',      label: 'URL personalizada' },
  { value: 'product',  label: 'Produto específico' },
  { value: 'category', label: 'Categoria' },
  { value: 'campaign', label: 'Campanha' },
];

// Public
export async function listPublicAnnouncements(): Promise<BannerAnnouncement[]> {
  return apiRequest<BannerAnnouncement[]>('/api/announcements');
}

// Admin
export async function listAdminAnnouncements(): Promise<BannerAnnouncement[]> {
  return apiRequest<BannerAnnouncement[]>('/api/announcements/admin', { auth: true });
}

export async function createAnnouncement(payload: BannerPayload): Promise<BannerAnnouncement> {
  return apiRequest<BannerAnnouncement>('/api/announcements/admin', {
    method: 'POST', body: JSON.stringify(payload), auth: true,
  });
}

export async function updateAnnouncement(id: string, payload: BannerPayload): Promise<BannerAnnouncement> {
  return apiRequest<BannerAnnouncement>(`/api/announcements/admin/${id}`, {
    method: 'PUT', body: JSON.stringify(payload), auth: true,
  });
}

export async function toggleAnnouncement(id: string): Promise<BannerAnnouncement> {
  return apiRequest<BannerAnnouncement>(`/api/announcements/admin/${id}/toggle`, {
    method: 'PATCH', auth: true,
  });
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await apiRequest<void>(`/api/announcements/admin/${id}`, { method: 'DELETE', auth: true });
}
