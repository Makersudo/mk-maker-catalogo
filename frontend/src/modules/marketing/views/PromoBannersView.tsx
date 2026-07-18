import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

import {
  Plus, Trash2, Eye, EyeOff, Save, X, ImageIcon,
  GalleryHorizontalEnd, ExternalLink, ArrowUp, ArrowDown,
  UploadCloud, Loader2, Crop
} from 'lucide-react';

import {
  BannerAnnouncement, BannerPayload, LINK_TYPE_OPTIONS,
  listAdminAnnouncements, createAnnouncement, updateAnnouncement,
  toggleAnnouncement, deleteAnnouncement
} from '../../../services/bannersService';

import { useMediaStore } from '../../media/store/useMediaStore';
import { uploadMedia } from '../../../services/mediaService';

// ── Modal de Galeria de Mídia ─────────────────────────────────────────────────
function GalleryModal({
  isOpen, onClose, onSelect
}: { isOpen: boolean; onClose: () => void; onSelect: (url: string) => void }) {
  const { items, fetchMedia, isLoading } = useMediaStore();

  useEffect(() => {
    if (isOpen) fetchMedia();
  }, [isOpen, fetchMedia]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-neutral-900 border border-white/10 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <GalleryHorizontalEnd className="h-4 w-4 text-[#c98f86]" />
              Galeria de Imagens
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">Clique na imagem para selecioná-la como banner</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-neutral-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center h-52">
              <span className="text-sm text-neutral-400 animate-pulse">Carregando galeria...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-52 text-neutral-500">
              <ImageIcon className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm font-bold">Nenhuma imagem na galeria</p>
              <p className="text-xs mt-1 text-center opacity-60 max-w-xs">
                Faça o upload das suas artes na seção <strong>"Mídia e Imagens"</strong> do painel primeiro.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {items.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { onSelect(item.url); onClose(); }}
                  className="group relative aspect-video bg-neutral-950 rounded-xl overflow-hidden border border-white/5 hover:border-[#c98f86] transition-all"
                >
                  <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                    <span className="bg-[#c98f86] text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded w-full text-center">
                      Usar esta imagem
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ImageCropperModalProps {
  isOpen: boolean;
  imageUrl: string;
  onCrop: (base64: string) => void;
  onClose: () => void;
}



export function ImageCropperModal({ isOpen, imageUrl, onCrop, onClose }: ImageCropperModalProps) {
  const [cropBox, setCropBox] = useState({ x: 0.15, y: 0.15, width: 0.7, height: 0.7 });
  const [draggingHandle, setDraggingHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; box: typeof cropBox } | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && imageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
        
        // Inicializa o cropBox com a proporção exata de 1920/380
        const targetRatio = 1920 / 380;
        const imageRatio = img.naturalWidth / img.naturalHeight;
        if (imageRatio > targetRatio) {
          const w = targetRatio / imageRatio;
          setCropBox({
            x: (1 - w) / 2,
            y: 0,
            width: w,
            height: 1
          });
        } else {
          const h = imageRatio / targetRatio;
          setCropBox({
            x: 0,
            y: (1 - h) / 2,
            width: 1,
            height: h
          });
        }
      };
      img.src = imageUrl;
    } else {
      setNaturalSize(null);
    }
  }, [isOpen, imageUrl]);

  const handleMouseDown = (handle: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingHandle(handle);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      box: { ...cropBox }
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!draggingHandle || !dragStart || !containerRef.current || !naturalSize) return;
    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = (e.clientX - dragStart.x) / rect.width;
    const deltaY = (e.clientY - dragStart.y) / rect.height;

    let { x, y, width, height } = dragStart.box;

    if (draggingHandle === 'move') {
      x = Math.max(0, Math.min(1 - width, x + deltaX));
      y = Math.max(0, Math.min(1 - height, y + deltaY));
      setCropBox({ x, y, width, height });
    } else {
      const targetRatio = 1920 / 380;
      const relRatio = targetRatio * (naturalSize.height / naturalSize.width);

      if (['r', 'tr', 'br', 'b'].includes(draggingHandle)) {
        let newWidth = width + deltaX;
        let newHeight = newWidth / relRatio;

        // Check boundaries
        if (x + newWidth > 1) {
          newWidth = 1 - x;
          newHeight = newWidth / relRatio;
        }
        if (y + newHeight > 1) {
          newHeight = 1 - y;
          newWidth = newHeight * relRatio;
        }
        if (newWidth < 0.1) {
          newWidth = 0.1;
          newHeight = newWidth / relRatio;
        }

        setCropBox({ x, y, width: newWidth, height: newHeight });
      } else if (['l', 'tl', 'bl', 't'].includes(draggingHandle)) {
        let newX = x + deltaX;
        let newWidth = (x + width) - newX;
        let newHeight = newWidth / relRatio;
        let newY = (y + height) - newHeight;

        // Check boundaries
        if (newX < 0) {
          newX = 0;
          newWidth = x + width;
          newHeight = newWidth / relRatio;
          newY = (y + height) - newHeight;
        }
        if (newY < 0) {
          newY = 0;
          newHeight = y + height;
          newWidth = newHeight * relRatio;
          newX = (x + width) - newWidth;
        }
        if (newWidth < 0.1) {
          newWidth = 0.1;
          newHeight = newWidth / relRatio;
          newX = (x + width) - newWidth;
          newY = (y + height) - newHeight;
        }

        setCropBox({ x: newX, y: newY, width: newWidth, height: newHeight });
      }
    }
  };

  const handleMouseUp = () => {
    setDraggingHandle(null);
    setDragStart(null);
  };

  useEffect(() => {
    if (draggingHandle) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingHandle, dragStart, naturalSize]);

  const handleConfirm = () => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const cropPixelX = cropBox.x * img.naturalWidth;
      const cropPixelY = cropBox.y * img.naturalHeight;
      const cropPixelWidth = cropBox.width * img.naturalWidth;
      const cropPixelHeight = cropBox.height * img.naturalHeight;

      canvas.width = cropPixelWidth;
      canvas.height = cropPixelHeight;

      ctx.drawImage(
        img,
        cropPixelX,
        cropPixelY,
        cropPixelWidth,
        cropPixelHeight,
        0,
        0,
        cropPixelWidth,
        cropPixelHeight
      );

      const base64 = canvas.toDataURL('image/jpeg', 0.9);
      onCrop(base64);
    };
    img.src = imageUrl;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex flex-col bg-black/90 backdrop-blur-md p-4 sm:p-6 justify-center items-center">
      <div className="w-full max-w-4xl bg-neutral-900 border border-white/10 rounded-2xl flex flex-col max-h-[90vh] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-white">Recortar Arte do Banner</h3>
            <p className="text-xs text-neutral-400 mt-0.5 font-medium">Arraste e puxe individualmente as bordas superior, inferior ou laterais para recortar a imagem.</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-neutral-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-neutral-955/40">
          <div 
            ref={containerRef}
            className="relative select-none max-w-full max-h-[50vh] overflow-hidden shadow-lg border border-white/5"
          >
            <img 
              src={imageUrl} 
              alt="Para recortar" 
              className="max-w-full max-h-[50vh] object-contain pointer-events-none"
              draggable={false}
            />

            {/* Backdrop Shadows */}
            <div className="absolute left-0 top-0 right-0 bg-black/60" style={{ height: `${cropBox.y * 100}%` }} />
            <div className="absolute left-0 bottom-0 right-0 bg-black/60" style={{ height: `${(1 - cropBox.y - cropBox.height) * 100}%` }} />
            <div className="absolute left-0 bg-black/60" style={{ top: `${cropBox.y * 100}%`, height: `${cropBox.height * 100}%`, width: `${cropBox.x * 100}%` }} />
            <div className="absolute right-0 bg-black/60" style={{ top: `${cropBox.y * 100}%`, height: `${cropBox.height * 100}%`, width: `${(1 - cropBox.x - cropBox.width) * 100}%` }} />

            {/* Crop Highlight Box */}
            <div
              className="absolute border-2 border-white border-dashed shadow-[0_0_0_1px_rgba(0,0,0,0.5)] flex items-center justify-center"
              style={{
                left: `${cropBox.x * 100}%`,
                top: `${cropBox.y * 100}%`,
                width: `${cropBox.width * 100}%`,
                height: `${cropBox.height * 100}%`
              }}
            >
              <div 
                className="absolute inset-0 cursor-move"
                onMouseDown={(e) => handleMouseDown('move', e)}
              />

              {/* Grid Lines */}
              <div className="absolute inset-x-0 top-1/3 border-t border-white/20 pointer-events-none" />
              <div className="absolute inset-x-0 bottom-1/3 border-t border-white/20 pointer-events-none" />
              <div className="absolute inset-y-0 left-1/3 border-l border-white/20 pointer-events-none" />
              <div className="absolute inset-y-0 right-1/3 border-l border-white/20 pointer-events-none" />

              {/* Corner Handles */}
              <div 
                className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white border border-neutral-800 rounded-full cursor-nwse-resize z-30 hover:scale-125 transition-transform"
                onMouseDown={(e) => handleMouseDown('tl', e)}
              />
              <div 
                className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white border border-neutral-800 rounded-full cursor-nesw-resize z-30 hover:scale-125 transition-transform"
                onMouseDown={(e) => handleMouseDown('tr', e)}
              />
              <div 
                className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 w-4 h-4 bg-white border border-neutral-800 rounded-full cursor-nesw-resize z-30 hover:scale-125 transition-transform"
                onMouseDown={(e) => handleMouseDown('bl', e)}
              />
              <div 
                className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-4 h-4 bg-white border border-neutral-800 rounded-full cursor-nwse-resize z-30 hover:scale-125 transition-transform"
                onMouseDown={(e) => handleMouseDown('br', e)}
              />

              {/* Edge Handles */}
              <div 
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-3 bg-white border border-neutral-800 rounded-full cursor-ns-resize z-20 hover:scale-105 transition-transform flex items-center justify-center gap-0.5"
                onMouseDown={(e) => handleMouseDown('t', e)}
              >
                <div className="w-1.5 h-0.5 bg-neutral-400 rounded-full" />
                <div className="w-1.5 h-0.5 bg-neutral-400 rounded-full" />
              </div>
              <div 
                className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-8 h-3 bg-white border border-neutral-800 rounded-full cursor-ns-resize z-20 hover:scale-105 transition-transform flex items-center justify-center gap-0.5"
                onMouseDown={(e) => handleMouseDown('b', e)}
              >
                <div className="w-1.5 h-0.5 bg-neutral-400 rounded-full" />
                <div className="w-1.5 h-0.5 bg-neutral-400 rounded-full" />
              </div>
              <div 
                className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-8 bg-white border border-neutral-800 rounded-full cursor-ew-resize z-20 hover:scale-105 transition-transform flex flex-col items-center justify-center gap-0.5"
                onMouseDown={(e) => handleMouseDown('l', e)}
              >
                <div className="w-0.5 h-1.5 bg-neutral-400 rounded-full" />
                <div className="w-0.5 h-1.5 bg-neutral-400 rounded-full" />
              </div>
              <div 
                className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-3 h-8 bg-white border border-neutral-800 rounded-full cursor-ew-resize z-20 hover:scale-105 transition-transform flex flex-col items-center justify-center gap-0.5"
                onMouseDown={(e) => handleMouseDown('r', e)}
              >
                <div className="w-0.5 h-1.5 bg-neutral-400 rounded-full" />
                <div className="w-0.5 h-1.5 bg-neutral-400 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 px-6 py-4 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors">
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#c98f86] text-white text-sm font-bold hover:bg-[#b87d74] transition-colors"
          >
            Confirmar Recorte
          </button>
        </div>
      </div>
    </div>
  );
}

type PromoBannerPayload = Pick<BannerPayload,
  'title' | 'image_url' | 'link_type' | 'link_value' | 'duration_seconds' | 'sort_order' | 'is_active'
> & { bg_color: string; image_fit: 'cover' | 'contain' | 'fill' };

function emptyPromoPayload(): PromoBannerPayload {
  return {
    title: '',
    image_url: '',
    link_type: 'none',
    link_value: '',
    duration_seconds: 5,
    sort_order: 0,
    is_active: true,
    bg_color: '#c98f86',
    image_fit: 'cover',
  };
}

function BannerForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<BannerAnnouncement>;
  onSave: (payload: BannerPayload) => Promise<void>;
  onCancel: () => void;
}) {
  const [payload, setPayload] = useState<PromoBannerPayload>(() => {
    const [initialColor, initialFit] = (initial?.bg_color ?? '#c98f86').split('|');
    return {
      title: initial?.title ?? '',
      image_url: initial?.image_url ?? '',
      link_type: initial?.link_type ?? 'none',
      link_value: initial?.link_value ?? '',
      duration_seconds: initial?.duration_seconds ?? 5,
      sort_order: initial?.sort_order ?? 0,
      is_active: initial?.is_active ?? true,
      bg_color: initialColor || '#c98f86',
      image_fit: (initialFit as 'cover' | 'contain' | 'fill') || 'cover',
    };
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperImageUrl, setCropperImageUrl] = useState('');
  const [cropFileName, setCropFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof PromoBannerPayload>(k: K, v: PromoBannerPayload[K]) =>
    setPayload(p => ({ ...p, [k]: v }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCropperImageUrl(event.target.result as string);
        setCropFileName(file.name);
        setCropperOpen(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedBase64: string) => {
    setCropperOpen(false);
    setUploading(true);
    uploadMedia(croppedBase64, cropFileName || 'banner.jpg')
      .then((uploaded) => {
        set('image_url', uploaded.url);
        if (!payload.title && cropFileName) {
          set('title', cropFileName.replace(/\.[^/.]+$/, ""));
        }
      })
      .catch((err) => {
        console.error(err);
        alert('Falha ao enviar imagem recortada.');
      })
      .finally(() => setUploading(false));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payload.image_url) { alert('Selecione uma imagem para o banner.'); return; }
    setSaving(true);
    try {
      await onSave({
        title: payload.title || 'Banner',
        subtitle: null,
        emoji: null,
        bg_color: `${payload.bg_color || '#c98f86'}|${payload.image_fit || 'cover'}`,
        text_color: '#ffffff',
        animation_type: 'slide',
        image_url: payload.image_url,
        link_type: payload.link_type,
        link_value: payload.link_value || null,
        duration_seconds: payload.duration_seconds,
        sort_order: payload.sort_order,
        is_active: payload.is_active,
        is_full_banner: true,
      });
    } finally {
      setSaving(false);
    }
  };


  return (
    <>
      <GalleryModal
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        onSelect={(url) => set('image_url', url)}
      />

      <ImageCropperModal
        isOpen={cropperOpen}
        imageUrl={cropperImageUrl}
        onCrop={handleCropComplete}
        onClose={() => setCropperOpen(false)}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Selector — the hero of this form */}
        <div>
          <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 block">
            Arte / Imagem do Banner <span className="text-[#c98f86]">*</span>
          </label>

          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={uploading}
          />
          <div
            className={`relative w-full overflow-hidden rounded-2xl border-2 transition-all group
              ${payload.image_url
                ? 'border-transparent'
                : 'border-dashed border-white/20 hover:border-[#c98f86]/60'
              } ${uploading ? 'pointer-events-none' : ''}`}
            style={{ 
              height: '240px',
              backgroundColor: payload.bg_color || '#c98f86' 
            }}
          >
            {uploading ? (
              <div className="flex flex-col items-center justify-center h-full bg-neutral-900/60">
                <Loader2 className="w-10 h-10 text-[#c98f86] animate-spin mb-3" />
                <p className="text-sm font-bold text-white">Enviando e otimizando arte...</p>
                <p className="text-xs text-neutral-500 mt-1">Isso pode levar alguns segundos</p>
              </div>
            ) : payload.image_url ? (
              <img 
                src={payload.image_url} 
                alt="Preview" 
                className={`w-full h-full animate-fade-in ${
                  payload.image_fit === 'contain' ? 'object-contain' : 
                  payload.image_fit === 'fill' ? 'object-fill' : 'object-cover'
                }`} 
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12 text-neutral-500">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:bg-[#c98f86]/10 transition-colors">
                  <UploadCloud className="w-8 h-8 opacity-40 group-hover:text-[#c98f86] transition-colors" />
                </div>
                <p className="text-sm font-bold group-hover:text-white transition-colors">Fazer Upload ou Escolher Imagem</p>
                <p className="text-xs mt-1 opacity-60">Envie um arquivo local ou escolha da galeria</p>
                
                <div className="flex items-center gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white text-neutral-900 rounded-xl px-4 py-2.5 flex items-center gap-2 font-bold text-xs hover:bg-neutral-100 transition-all shadow-md"
                  >
                    <UploadCloud className="h-4 w-4" />
                    Upload do Computador
                  </button>
                  <button
                    type="button"
                    onClick={() => setGalleryOpen(true)}
                    className="bg-neutral-800 text-white border border-white/10 rounded-xl px-4 py-2.5 flex items-center gap-2 font-bold text-xs hover:bg-neutral-700 transition-all shadow-md"
                  >
                    <GalleryHorizontalEnd className="h-4 w-4" />
                    Abrir Galeria
                  </button>
                </div>
              </div>
            )}
          </div>

          {payload.image_url && !uploading && (
            <div className="flex flex-col sm:flex-row gap-2 mt-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 bg-white/5 border border-white/10 hover:border-white/20 text-white rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 font-bold text-xs hover:bg-white/10 transition-all shadow-md"
              >
                <UploadCloud className="h-4 w-4 text-neutral-400" />
                Alterar Imagem
              </button>
              <button
                type="button"
                onClick={() => setGalleryOpen(true)}
                className="flex-1 bg-white/5 border border-white/10 hover:border-white/20 text-white rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 font-bold text-xs hover:bg-white/10 transition-all shadow-md"
              >
                <GalleryHorizontalEnd className="h-4 w-4 text-neutral-400" />
                Escolher da Galeria
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (payload.image_url.startsWith('http')) {
                    try {
                      setUploading(true);
                      const res = await fetch(payload.image_url);
                      const blob = await res.blob();
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setCropperImageUrl(reader.result as string);
                        setCropFileName('recropped_banner.jpg');
                        setCropperOpen(true);
                        setUploading(false);
                      };
                      reader.readAsDataURL(blob);
                    } catch (err) {
                      console.error(err);
                      alert('Não foi possível carregar a imagem remota para recorte. Tente enviar a imagem novamente.');
                      setUploading(false);
                    }
                  } else {
                    setCropperImageUrl(payload.image_url);
                    setCropFileName('recropped_banner.jpg');
                    setCropperOpen(true);
                  }
                }}
                className="flex-1 bg-[#c98f86]/10 border border-[#c98f86]/30 text-[#c98f86] rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 font-bold text-xs hover:bg-[#c98f86]/20 transition-all shadow-md"
              >
                <Crop className="h-4 w-4" />
                Ajustar / Recortar Bordas
              </button>
            </div>
          )}
        </div>

        {/* Title (optional label) */}
        <div>
          <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5 block">
            Nome interno (opcional)
          </label>
          <input
            type="text"
            value={payload.title}
            onChange={e => set('title', e.target.value)}
            placeholder="Ex: Banner Black Friday, Promoção Verão..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#c98f86]/60 placeholder:text-neutral-600"
          />
          <p className="text-[10px] text-neutral-500 mt-1">Apenas para organização interna, não aparece na vitrine.</p>
        </div>

        {/* Ajuste da Imagem (Object Fit) */}
        <div>
          <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 block">
            Ajuste da Imagem na Seção
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'cover', label: 'Preencher', desc: 'Preenche (pode cortar)' },
              { value: 'contain', label: 'Ajustar (Sem Cortes)', desc: 'Mostra imagem inteira' },
              { value: 'fill', label: 'Esticar', desc: 'Estica a imagem' }
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set('image_fit', opt.value as any)}
                className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-0.5
                  ${payload.image_fit === opt.value
                    ? 'bg-[#c98f86]/20 border-[#c98f86]/60 text-[#c98f86]'
                    : 'bg-white/5 border-white/10 text-neutral-400 hover:border-white/20 hover:text-white'
                  }`}
              >
                <span>{opt.label}</span>
                <span className="text-[9px] font-normal opacity-75">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Cor de Fundo (só se for "contain" para preencher as laterais) */}
        {payload.image_fit === 'contain' && (
          <div>
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5 block">
              Cor de fundo (Preenche as laterais vazias)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={payload.bg_color}
                onChange={e => set('bg_color', e.target.value)}
                className="w-10 h-10 border border-white/10 rounded-lg cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={payload.bg_color}
                onChange={e => set('bg_color', e.target.value)}
                placeholder="#C98F86"
                className="w-32 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-[#c98f86]/60 uppercase font-semibold"
              />
            </div>
            <p className="text-[10px] text-neutral-500 mt-1">Insira a mesma cor de fundo da sua imagem para um visual integrado e sem costuras.</p>
          </div>
        )}

        <div className="space-y-3">
          <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">
            Ao clicar no banner, o cliente vai para:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {LINK_TYPE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { set('link_type', opt.value); set('link_value', ''); }}
                className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all text-center
                  ${payload.link_type === opt.value
                    ? 'bg-[#c98f86]/20 border-[#c98f86]/60 text-[#c98f86]'
                    : 'bg-white/5 border-white/10 text-neutral-400 hover:border-white/20 hover:text-white'
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {payload.link_type !== 'none' && (
            <div>
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5 block">
                {payload.link_type === 'url' ? 'URL de destino' :
                 payload.link_type === 'product' ? 'ID ou slug do produto' :
                 payload.link_type === 'category' ? 'ID da categoria' : 'ID da campanha'}
              </label>
              <div className="relative">
                <input
                  required
                  type="text"
                  value={payload.link_value ?? ''}
                  onChange={e => set('link_value', e.target.value)}
                  placeholder={payload.link_type === 'url' ? 'https://...' : 'Cole o ID aqui'}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-sm text-white outline-none focus:border-[#c98f86]/60 placeholder:text-neutral-600"
                />
                <ExternalLink className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600" />
              </div>
            </div>
          )}
        </div>

        {/* Duration + Sort */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5 block">
              Tempo de exibição (seg)
            </label>
            <input
              type="number" min={2} max={30} value={payload.duration_seconds}
              onChange={e => set('duration_seconds', Number(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#c98f86]/60"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5 block">
              Posição na ordem
            </label>
            <input
              type="number" min={0} value={payload.sort_order}
              onChange={e => set('sort_order', Number(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#c98f86]/60"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-400">Ativo na vitrine</span>
            <button
              type="button"
              onClick={() => set('is_active', !payload.is_active)}
              className={`relative h-6 w-11 rounded-full transition-colors ${payload.is_active ? 'bg-[#c98f86]' : 'bg-white/10'}`}
            >
              <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${payload.is_active ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors">
              Cancelar
            </button>
            <button
              type="submit" disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#c98f86] text-white text-sm font-bold hover:bg-[#b87d74] transition-colors disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Salvando...' : 'Salvar banner'}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}

// ── View Principal ────────────────────────────────────────────────────────────
export function PromoBannersView() {
  const [items, setItems] = useState<BannerAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BannerAnnouncement | null | 'new'>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const all = await listAdminAnnouncements();
      setItems(all.filter(i => i.is_full_banner));
    } catch {
      setError('Erro ao carregar banners.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (payload: BannerPayload) => {
    if (editing === 'new') {
      await createAnnouncement(payload);
    } else if (editing) {
      await updateAnnouncement(editing.id, payload);
    }
    setEditing(null);
    await load();
  };

  const handleToggle = async (id: string) => {
    await toggleAnnouncement(id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, is_active: !i.is_active } : i));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este banner permanentemente?')) return;
    await deleteAnnouncement(id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <GalleryHorizontalEnd className="h-6 w-6 text-[#c98f86]" />
            Banners do Catálogo
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Gerencie os banners de imagem exibidos no topo da página de produtos — igual ao Mercado Livre.
          </p>
        </div>
        {editing === null && (
          <button
            onClick={() => setEditing('new')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#c98f86] text-white text-sm font-bold hover:bg-[#b87d74] transition-colors"
          >
            <Plus className="h-4 w-4" /> Novo banner
          </button>
        )}
      </div>

      {/* How it works hint */}
      {!editing && (
        <div className="rounded-2xl bg-[#c98f86]/10 border border-[#c98f86]/20 p-4 flex gap-3 items-start">
          <span className="text-2xl">🖼️</span>
          <div>
            <p className="text-sm font-bold text-white">Como funciona</p>
            <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
              Faça upload das suas artes em <strong className="text-neutral-300">Mídia e Imagens</strong>, depois crie banners aqui selecionando as imagens da galeria.
              Os banners aparecem automaticamente como um carrossel acima dos produtos na vitrine.
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <AnimatePresence>
        {editing !== null && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="rounded-2xl bg-white/5 border border-white/10 p-6"
          >
            <h2 className="text-base font-bold text-white mb-6 flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-[#c98f86]" />
              {editing === 'new' ? 'Adicionar novo banner' : `Editando: ${editing.title || 'Banner'}`}
            </h2>
            <BannerForm
              initial={editing === 'new' ? undefined : editing}
              onSave={handleSave}
              onCancel={() => setEditing(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {loading ? (
        <div className="text-center py-16 text-neutral-500 text-sm animate-pulse">Carregando banners...</div>
      ) : error ? (
        <div className="text-center py-16 text-red-400 text-sm">{error}</div>
      ) : items.length === 0 && editing === null ? (
        <div className="text-center py-20">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-white/5 flex items-center justify-center mb-4">
            <GalleryHorizontalEnd className="h-10 w-10 text-neutral-600" />
          </div>
          <p className="text-white font-bold text-lg">Nenhum banner criado ainda</p>
          <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
            Clique em "Novo banner" para adicionar sua primeira arte promocional ao catálogo.
          </p>
        </div>
      ) : items.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs text-neutral-500 px-1">{items.length} banner{items.length !== 1 ? 's' : ''} configurado{items.length !== 1 ? 's' : ''} · aparece em ordem de posição</p>
          {items.map((item, idx) => (
            <motion.div
              key={item.id}
              layout
              className="flex items-center gap-4 rounded-2xl bg-white/5 border border-white/10 p-3 hover:bg-white/8 transition-colors"
            >
              {/* Thumbnail */}
              <div 
                className="h-20 w-36 shrink-0 overflow-hidden rounded-xl border border-white/5 bg-neutral-950"
                style={{ backgroundColor: (item.bg_color || '#c98f86').split('|')[0] }}
              >
                {item.image_url ? (
                  <img 
                    src={item.image_url} 
                    alt={item.title} 
                    className={`h-full w-full ${
                      (item.bg_color || '').split('|')[1] === 'contain' ? 'object-contain' : 
                      (item.bg_color || '').split('|')[1] === 'fill' ? 'object-fill' : 'object-cover'
                    }`} 
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-neutral-700" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{item.title || '(sem nome)'}</p>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-neutral-700/50 text-neutral-500'}`}>
                    {item.is_active ? 'Ativo' : 'Pausado'}
                  </span>
                  <span className="text-[10px] text-neutral-500">#{idx + 1} · {item.duration_seconds}s</span>
                  {item.link_type !== 'none' && item.link_value && (
                    <span className="text-[10px] text-[#c98f86] flex items-center gap-1">
                      <ExternalLink className="h-2.5 w-2.5" /> {item.link_type}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleToggle(item.id)}
                  title={item.is_active ? 'Pausar' : 'Ativar'}
                  className={`p-2 rounded-xl transition-colors ${item.is_active ? 'text-emerald-400 hover:bg-emerald-400/10' : 'text-neutral-500 hover:bg-white/10'}`}
                >
                  {item.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setEditing(item)}
                  className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Editar"
                >
                  <Save className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 rounded-xl text-red-400/60 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
