import { type ChangeEvent, useEffect, useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Trash2, Link as LinkIcon } from 'lucide-react';
import { useMediaStore } from '../store/useMediaStore';

export function MediaView() {
  const { items, addMedia, removeMedia, fetchMedia } = useMediaStore();
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        let scaleSize = 1;
        
        if (img.width > MAX_WIDTH) {
          scaleSize = MAX_WIDTH / img.width;
        }
        
        canvas.width = img.width * scaleSize;
        canvas.height = img.height * scaleSize;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const compressedBase64 = canvas.toDataURL('image/webp', 0.80);
        const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
        addMedia(compressedBase64, newFileName)
          .then(() => setFeedback('Upload concluido!'))
          .catch(() => setFeedback('Falha ao enviar.'))
          .finally(() => setUploading(false));
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
       setFeedback('Link copiado!');
       setTimeout(() => setFeedback(''), 3000);
    }).catch(() => {
       setFeedback('Falha ao copiar.');
       setTimeout(() => setFeedback(''), 3000);
    });
  };

  return (
    <div className="flex flex-col gap-4 md:gap-8 max-w-7xl mx-auto pb-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-neutral-900">Mídia e Imagens</h1>
          <p className="text-xs md:text-sm text-neutral-500 mt-1">Gerencie arquivos, fotos de produtos e banners.</p>
        </div>
        <div className="w-full md:w-auto flex flex-col items-center gap-2">
           <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
           <button 
             onClick={() => fileInputRef.current?.click()}
             disabled={uploading}
             className="flex items-center justify-center w-full md:w-auto gap-2 bg-gradient-to-r from-purple-800 to-purple-600 text-white px-4 py-2 md:px-5 md:py-2.5 rounded-lg md:rounded-xl font-bold text-xs md:text-sm hover:from-purple-700 hover:to-purple-500 transition-colors shadow-md disabled:opacity-50"
           >
             <UploadCloud className="w-4 h-4 md:w-5 md:h-5" />
             {uploading ? 'Enviando...' : 'Fazer Upload'}
           </button>
           {feedback && <span className="text-xs font-bold text-emerald-600">{feedback}</span>}
        </div>
      </header>

      {/* Grid de Imagens */}
      <div className="bg-white rounded-xl md:rounded-2xl border border-neutral-200 shadow-sm p-4 md:p-6 min-h-[300px] md:min-h-[400px]">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-neutral-400 border-2 border-dashed border-neutral-100 rounded-xl p-12">
            <ImageIcon className="w-12 h-12 mb-4 opacity-30" />
            <h3 className="text-lg font-bold text-neutral-900 mb-1">Nenhuma imagem armazenada</h3>
            <p className="text-sm text-center max-w-sm">As imagens enviadas serão armazenadas pelo backend. Clique em "Fazer Upload" para enviar uma nova imagem.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {items.map(item => (
              <div key={item.id} className="group relative aspect-square bg-neutral-100 rounded-xl overflow-hidden border border-neutral-200">
                <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-neutral-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button onClick={() => copyToClipboard(item.url)} className="p-2 bg-white text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors" title="Copiar URL">
                    <LinkIcon className="w-4 h-4" />
                  </button>
                  <button onClick={() => removeMedia(item.id)} className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors" title="Excluir">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-neutral-900/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[10px] text-white truncate">{item.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
