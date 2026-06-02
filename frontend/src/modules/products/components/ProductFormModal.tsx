import { type ChangeEvent, type FormEvent, useEffect, useState, useRef } from 'react';
import { Plus, Trash2, X, UploadCloud } from 'lucide-react';
import { useProductStore, Product, ProductVariant } from '../store/useProductStore';
import { Category, useCategoryStore } from '../../categories/store/useCategoryStore';
import {
  createVariantFromPreset,
  getVariationPreset,
  inferPresetIdFromVariants,
  VARIATION_PRESETS,
  type VariationPresetId,
} from './variantPresets';

interface ProductFormModalProps {
  onClose: () => void;
  productToEdit?: Product | null;
}

function getParentId(category: Category) {
  return category.parent_id ?? category.parentId ?? null;
}

export function ProductFormModal({ onClose, productToEdit }: ProductFormModalProps) {
  const { addProduct, updateProduct } = useProductStore();
  const categories = useCategoryStore(state => state.categories);
  const fetchCategories = useCategoryStore(state => state.fetchCategories);
  
  const [title, setTitle] = useState(productToEdit?.title || '');
  const [slug, setSlug] = useState(productToEdit?.slug || '');
  const [description, setDescription] = useState(productToEdit?.description || '');
  const [price, setPrice] = useState(productToEdit?.price.toString() || '');
  const [stockQuantity, setStockQuantity] = useState(String(productToEdit?.stockQuantity ?? 0));
  const [brandLabel, setBrandLabel] = useState(productToEdit?.brandLabel || '');
  const rootCategories = categories.filter((category) => !getParentId(category));
  const [categoryId, setCategoryId] = useState(productToEdit?.categoryId || '');
  const [subcategoryId, setSubcategoryId] = useState(productToEdit?.subcategoryId || '');
  const [images, setImages] = useState<string[]>(productToEdit?.images || []);
  const [audience, setAudience] = useState<Product['audience'] | ''>(productToEdit?.audience || '');
  const [productType, setProductType] = useState(productToEdit?.productType || '');
  const [variation, setVariation] = useState(productToEdit?.variation || '');
  const [featuresText, setFeaturesText] = useState((productToEdit?.features || []).join('\n'));
  const [catalogStatus, setCatalogStatus] = useState<Product['catalogStatus']>(productToEdit?.catalogStatus || 'draft');
  const [variantsEnabled, setVariantsEnabled] = useState(productToEdit?.variantsEnabled ?? false);
  const [selectedVariantPresetId, setSelectedVariantPresetId] = useState<VariationPresetId>(
    inferPresetIdFromVariants(productToEdit?.variants)
  );
  const [variants, setVariants] = useState<ProductVariant[]>((productToEdit?.variants || []).map((variant) => ({
    ...variant,
    price: variant.price ?? null,
    options: variant.options?.length ? variant.options : [{ name: '', value: '' }],
  })));
  
  const [isActive, setIsActive] = useState(productToEdit?.isActive ?? true);
  const [isFeatured, setIsFeatured] = useState(productToEdit?.isFeatured ?? false);
  const [isPromo, setIsPromo] = useState(productToEdit?.isPromo ?? false);
  const [isNew, setIsNew] = useState(productToEdit?.isNew ?? false);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (categories.length === 0) {
      fetchCategories(true);
    }
  }, [categories.length, fetchCategories]);

  useEffect(() => {
    if (!categoryId && rootCategories.length > 0) {
      setCategoryId(rootCategories[0].id);
    }
  }, [categoryId, rootCategories]);

  const availableSubcategories = categories.filter((category) => getParentId(category) === categoryId);
  const selectedVariantPreset = getVariationPreset(selectedVariantPresetId);
  const totalVariantStock = variantsEnabled
    ? variants.filter((variant) => variant.isActive).reduce((total, variant) => total + Math.max(0, Number(variant.stockQuantity || 0)), 0)
    : Math.max(0, Number(stockQuantity || 0));

  useEffect(() => {
    if (subcategoryId && !availableSubcategories.some((category) => category.id === subcategoryId)) {
      setSubcategoryId('');
    }
  }, [availableSubcategories, subcategoryId]);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Redimensionamento de Imagem para evitar estouro de limite de 5MB do LocalStorage
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800; // Tamanho aceitável para cartões web
        let scaleSize = 1;
        
        if (img.width > MAX_WIDTH) {
          scaleSize = MAX_WIDTH / img.width;
        }
        
        canvas.width = img.width * scaleSize;
        canvas.height = img.height * scaleSize;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Comprime convertendo para JPEG 60%
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
        setImages([compressedBase64, ...images]);
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title || !price || !categoryId) {
      setError("Preencha todos os campos obrigatórios marcados com (*).");
      return;
    }

    const parsedPrice = parseFloat(String(price).replace(',', '.'));
    if (isNaN(parsedPrice)) {
      setError("Preço inválido.");
      return;
    }

    const productData = {
      slug: slug.trim() || null,
      title,
      description,
      price: parsedPrice,
      categoryId,
      subcategoryId: subcategoryId || null,
      audience: audience || null,
      brandLabel: brandLabel.trim(),
      productType,
      variation: variation || null,
      features: featuresText.split('\n').map((item) => item.trim()).filter(Boolean),
      imagePrompt: productToEdit?.imagePrompt || '',
      catalogStatus,
      images,
      stockQuantity: Math.max(0, Math.floor(Number(stockQuantity || 0))),
      variantsEnabled,
      variants: variantsEnabled ? variants.map((variant) => ({
        ...variant,
        label: variant.label || variant.options.map((option) => `${option.name}: ${option.value}`).join(' / '),
        stockQuantity: Math.max(0, Math.floor(Number(variant.stockQuantity || 0))),
        price: variant.price === null || variant.price === undefined ? null : Number(variant.price),
      })) : [],
      isActive,
      isFeatured,
      isPromo,
      isNew
    };

    try {
      if (productToEdit) {
        await updateProduct(productToEdit.id, productData);
      } else {
        await addProduct(productData);
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError("Erro ao tentar salvar o produto.");
    }
  };

  const addPresetVariant = (value = '') => {
    const nextVariant = createVariantFromPreset(selectedVariantPresetId, value);
    const nextOption = nextVariant.options[0];
    if (nextOption.value && variants.some((variant) => variant.options.some((option) => option.name === nextOption.name && option.value === nextOption.value))) return;
    setVariants([...variants, nextVariant]);
    setVariantsEnabled(true);
  };

  const addAllPresetVariants = () => {
    const missingValues = selectedVariantPreset.values.filter((value) => (
      !variants.some((variant) => variant.options.some((option) => option.name === selectedVariantPreset.optionName && option.value === value))
    ));
    if (missingValues.length === 0) return;
    setVariants([...variants, ...missingValues.map((value) => createVariantFromPreset(selectedVariantPresetId, value))]);
    setVariantsEnabled(true);
  };

  const updateVariant = (index: number, updates: Partial<ProductVariant>) => {
    setVariants(variants.map((variant, currentIndex) => currentIndex === index ? { ...variant, ...updates } : variant));
  };

  const updateVariantOption = (index: number, field: 'name' | 'value', value: string) => {
    setVariants(variants.map((variant, currentIndex) => {
      if (currentIndex !== index) return variant;
      const options = variant.options.length > 0 ? variant.options : [{ name: '', value: '' }];
      const nextOptions = options.map((option, optionIndex) => optionIndex === 0 ? { ...option, [field]: value } : option);
      return { ...variant, options: nextOptions };
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-neutral-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-full flex flex-col shadow-2xl relative overflow-hidden flex-shrink-0 animate-in fade-in zoom-in-95 duration-200">
        
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
          <h2 className="text-xl font-bold uppercase tracking-tight text-neutral-900">
            {productToEdit ? 'Editar Produto' : 'Cadastrar Novo Produto'}
          </h2>
          <button onClick={onClose} className="p-2 text-neutral-400 hover:text-neutral-900 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <form id="productForm" onSubmit={handleSubmit} className="flex flex-col gap-8">
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm font-bold rounded-lg text-center">
                {error}
              </div>
            )}

            {/* Informações Básicas */}
            <div className="flex flex-col gap-5">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100 pb-2">Informações Básicas</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-widest">Nome do Produto *</label>
                  <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" placeholder="Ex: Batom Matte Rose" />
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-widest">Slug interno</label>
                  <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" placeholder="batom-matte-rose" />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-widest">Preço (R$) *</label>
                  <input required type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" placeholder="199.90" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-widest">Quantidade base</label>
                  <input type="number" min="0" step="1" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" placeholder="0" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-widest">Categoria Principal *</label>
                  <select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={`w-full px-4 py-3 ${rootCategories.length === 0 ? 'bg-red-50 border-red-300' : 'bg-neutral-50 border-neutral-200'} border rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500`}>
                    <option value="" disabled>Selecione uma categoria principal</option>
                    {rootCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  {rootCategories.length === 0 && (
                    <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">Crie uma categoria principal primeiro</span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-widest">Subcategoria</label>
                  <select value={subcategoryId} onChange={(e) => setSubcategoryId(e.target.value)} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500">
                    <option value="">Sem subcategoria</option>
                    {availableSubcategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-widest">Descrição</label>
                  <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none" placeholder="Detalhes do produto, tecido, uso..." />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100 pb-2">Estoque e Variações</h3>
              <label className="flex items-center gap-3 p-4 border border-neutral-200 rounded-xl cursor-pointer hover:bg-neutral-50 transition-colors">
                <input type="checkbox" checked={variantsEnabled} onChange={(e) => setVariantsEnabled(e.target.checked)} className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 accent-purple-600" />
                <div>
                  <p className="text-sm font-bold text-neutral-900">Usar variações neste produto</p>
                  <p className="text-xs text-neutral-500">Tamanho, cor, sabor, modelo ou qualquer variação com estoque próprio.</p>
                </div>
              </label>

              {variantsEnabled && (
                <div className="flex flex-col gap-5">
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                    <div>
                      <p className="text-xs font-bold text-neutral-700 uppercase tracking-widest">Tipo de variacao</p>
                      <p className="mt-1 text-xs text-neutral-500">Escolha um grupo pronto ou use personalizado. Os campos continuam editaveis.</p>
                    </div>
                    <div className="rounded-xl border border-purple-100 bg-white px-4 py-3 text-right">
                      <span className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400">Estoque total</span>
                      <span className="text-sm font-black text-purple-700">{totalVariantStock} unidades</span>
                    </div>
                    <div className="md:col-span-2 grid grid-cols-2 lg:grid-cols-4 gap-2">
                      {VARIATION_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setSelectedVariantPresetId(preset.id)}
                          className={`min-h-[44px] rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
                            selectedVariantPresetId === preset.id
                              ? 'border-purple-600 bg-purple-50 text-purple-800'
                              : 'border-neutral-200 bg-white text-neutral-600 hover:border-purple-300 hover:text-purple-700'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-bold text-neutral-700 uppercase tracking-widest">Opcoes rapidas</p>
                      {selectedVariantPreset.values.length > 0 && (
                        <button type="button" onClick={addAllPresetVariants} className="text-xs font-bold text-purple-700 hover:text-purple-900">
                          Adicionar todas
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedVariantPreset.values.map((value) => (
                        <button key={value} type="button" onClick={() => addPresetVariant(value)} className="px-3 py-2 rounded-lg border border-neutral-200 bg-white text-xs font-bold text-neutral-700 hover:border-purple-300 hover:text-purple-700">
                          {value}
                        </button>
                      ))}
                      <button type="button" onClick={() => addPresetVariant()} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-purple-200 bg-purple-50 text-xs font-bold text-purple-700 hover:bg-purple-100">
                        <Plus className="w-3.5 h-3.5" /> Variacao livre
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    {variants.length === 0 && (
                      <div className="p-4 rounded-xl border border-dashed border-neutral-200 text-sm text-neutral-500">
                        Adicione opcoes rapidas ou uma variacao livre.
                      </div>
                    )}

                    {variants.map((variant, index) => (
                      <div key={`${variant.id ?? 'new'}-${index}`} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 p-4 rounded-2xl border border-neutral-200 bg-neutral-50">
                        <div className="lg:col-span-2 flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Tipo</label>
                          <input value={variant.options[0]?.name ?? ''} onChange={(e) => updateVariantOption(index, 'name', e.target.value)} className="px-3 py-3 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-purple-500" placeholder={`Ex: ${selectedVariantPreset.optionName}`} />
                        </div>
                        <div className="lg:col-span-2 flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Valor</label>
                          <input value={variant.options[0]?.value ?? ''} onChange={(e) => updateVariantOption(index, 'value', e.target.value)} className="px-3 py-3 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-purple-500" placeholder={`Ex: ${selectedVariantPreset.placeholderValue}`} />
                        </div>
                        <div className="lg:col-span-3 flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Nome exibido</label>
                          <input value={variant.label} onChange={(e) => updateVariant(index, { label: e.target.value })} className="px-3 py-3 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-purple-500" placeholder={`Ex: ${selectedVariantPreset.placeholderLabel}`} />
                        </div>
                        <div className="lg:col-span-2 flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Quantidade</label>
                          <input type="number" min="0" step="1" value={variant.stockQuantity} onChange={(e) => updateVariant(index, { stockQuantity: Number(e.target.value) })} className="px-3 py-3 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-purple-500" placeholder="Ex: 12" />
                        </div>
                        <div className="lg:col-span-2 flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Preco opcional</label>
                          <input type="number" min="0" step="0.01" value={variant.price ?? ''} onChange={(e) => updateVariant(index, { price: e.target.value === '' ? null : Number(e.target.value) })} className="px-3 py-3 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-purple-500" placeholder="Ex: 99.90" />
                        </div>
                        <div className="lg:col-span-1 flex items-center justify-end gap-2">
                          <label className="flex items-center gap-2 text-xs font-bold text-neutral-600">
                            <input type="checkbox" checked={variant.isActive} onChange={(e) => updateVariant(index, { isActive: e.target.checked })} className="accent-purple-600" />
                            Ativa
                          </label>
                          <button type="button" onClick={() => setVariants(variants.filter((_, currentIndex) => currentIndex !== index))} className="p-2 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-5">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100 pb-2">Metadados de Catalogo</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-widest">Publico</label>
                  <select value={audience ?? ''} onChange={(e) => setAudience(e.target.value as Product['audience'] | '')} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500">
                    <option value="">Sem publico</option>
                    <option value="feminino">Feminino</option>
                    <option value="masculino">Masculino</option>
                    <option value="suplemento">Suplemento</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-widest">Rotulo / marca</label>
                  <input type="text" value={brandLabel} onChange={(e) => setBrandLabel(e.target.value)} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" placeholder="Ex: DIOR, avon, MK MAKER" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-widest">Status editorial</label>
                  <select value={catalogStatus} onChange={(e) => setCatalogStatus(e.target.value as 'draft' | 'ready' | 'live')} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500">
                    <option value="draft">Rascunho</option>
                    <option value="ready">Pronto</option>
                    <option value="live">Publicado</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-widest">Tipo</label>
                  <input type="text" value={productType} onChange={(e) => setProductType(e.target.value)} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" placeholder="batom, paleta, mascara..." />
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-3">
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-widest">Variacao</label>
                  <input type="text" value={variation} onChange={(e) => setVariation(e.target.value)} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" placeholder="Rose, nude, waterproof..." />
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-3">
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-widest">Caracteristicas</label>
                  <textarea rows={4} value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none" placeholder="Uma caracteristica por linha" />
                </div>

              </div>
            </div>

            {/* Imagens */}
            <div className="flex flex-col gap-5">
               <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100 pb-2">Imagens do Produto</h3>
               <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                 <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                 <button type="button" onClick={() => fileInputRef.current?.click()} className="shrink-0 w-32 h-32 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-purple-300 bg-purple-50 text-purple-700 rounded-xl hover:bg-purple-100 transition-colors">
                   <UploadCloud className="w-6 h-6" />
                   <span className="text-xs font-bold">Adicionar Foto</span>
                 </button>
                 {images.map((img, idx) => (
                   <div key={idx} className="shrink-0 w-32 h-32 rounded-xl border border-neutral-200 overflow-hidden relative group">
                     <img src={img} className="w-full h-full object-cover" />
                     <button type="button" onClick={() => setImages(images.filter((_, i) => i !== idx))} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-4 h-4"/></button>
                   </div>
                 ))}
               </div>
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-neutral-100 bg-white grid grid-cols-2 gap-4">
           <button onClick={onClose} className="px-5 py-3 rounded-xl border border-neutral-200 text-neutral-600 font-bold text-sm hover:bg-neutral-50 transition-colors uppercase tracking-widest">
             Cancelar
           </button>
           <button form="productForm" type="submit" className="px-5 py-3 rounded-xl bg-gradient-to-r from-purple-800 to-purple-600 text-white font-bold text-sm hover:from-purple-700 hover:to-purple-500 transition-colors shadow-md uppercase tracking-widest">
             {productToEdit ? 'Salvar Alterações' : 'Cadastrar Produto'}
           </button>
        </div>

      </div>
    </div>
  );
}
