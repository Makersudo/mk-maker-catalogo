import { type ChangeEvent, type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2, UploadCloud, X } from 'lucide-react';
import { useProductStore, Product, ProductVariant } from '../store/useProductStore';
import { Category, useCategoryStore } from '../../categories/store/useCategoryStore';
import {
  createVariantFromPreset,
  getVariationPreset,
  inferPresetIdFromVariants,
  VARIATION_PRESETS,
  type VariationPresetId,
} from './variantPresets';
import { calculateSuggestedSalePrice } from './purchasePricing';

interface ProductFormModalProps {
  onClose: () => void;
  productToEdit?: Product | null;
}

type ProductFormTab = 'details' | 'pricing' | 'media' | 'showcase';

const formTabs: Array<{ id: ProductFormTab; label: string; description: string }> = [
  { id: 'details', label: 'Produto', description: 'Nome, categoria e descricao' },
  { id: 'pricing', label: 'Preco e estoque', description: 'Custo, venda e variacoes' },
  { id: 'media', label: 'Fotos', description: 'Mockups e imagens' },
  { id: 'showcase', label: 'Vitrine', description: 'Publicacao e destaques' },
];

function getParentId(category: Category) {
  return category.parent_id ?? category.parentId ?? null;
}

function parseMoneyInput(value: string) {
  return Number(String(value || '0').replace(',', '.'));
}

export function ProductFormModal({ onClose, productToEdit }: ProductFormModalProps) {
  const { addProduct, updateProduct } = useProductStore();
  const categories = useCategoryStore((state) => state.categories);
  const fetchCategories = useCategoryStore((state) => state.fetchCategories);

  const [activeTab, setActiveTab] = useState<ProductFormTab>('details');
  const [title, setTitle] = useState(productToEdit?.title || '');
  const [slug, setSlug] = useState(productToEdit?.slug || '');
  const [description, setDescription] = useState(productToEdit?.description || '');
  const [price, setPrice] = useState(productToEdit?.price.toString() || '');
  const [purchaseCost, setPurchaseCost] = useState(productToEdit?.purchaseCost?.toString() || '');
  const [markupPercent, setMarkupPercent] = useState('80');
  const [stockQuantity, setStockQuantity] = useState(String(productToEdit?.stockQuantity ?? 0));
  const [brandLabel, setBrandLabel] = useState(productToEdit?.brandLabel || '');
  const [categoryId, setCategoryId] = useState(productToEdit?.categoryId || '');
  const [subcategoryId, setSubcategoryId] = useState(productToEdit?.subcategoryId || '');
  const [images, setImages] = useState<string[]>(productToEdit?.images || []);
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

  const rootCategories = useMemo(
    () => categories.filter((category) => !getParentId(category)),
    [categories]
  );
  const availableSubcategories = useMemo(
    () => categories.filter((category) => getParentId(category) === categoryId),
    [categories, categoryId]
  );
  const selectedVariantPreset = getVariationPreset(selectedVariantPresetId);
  const totalVariantStock = variantsEnabled
    ? variants.filter((variant) => variant.isActive).reduce((total, variant) => total + Math.max(0, Number(variant.stockQuantity || 0)), 0)
    : Math.max(0, Number(stockQuantity || 0));
  const suggestedSalePrice = calculateSuggestedSalePrice(parseMoneyInput(purchaseCost), parseMoneyInput(markupPercent));

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

  useEffect(() => {
    if (subcategoryId && !availableSubcategories.some((category) => category.id === subcategoryId)) {
      setSubcategoryId('');
    }
  }, [availableSubcategories, subcategoryId]);

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 800;
        const scaleSize = img.width > maxWidth ? maxWidth / img.width : 1;
        canvas.width = img.width * scaleSize;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
        setImages((current) => [compressedBase64, ...current]);
      };

      if (readerEvent.target?.result) {
        img.src = readerEvent.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (!title.trim() || !price || !categoryId) {
      setError('Preencha nome, preco e categoria principal.');
      setActiveTab('details');
      return;
    }

    const parsedPrice = parseMoneyInput(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setError('Preco invalido.');
      setActiveTab('pricing');
      return;
    }

    const parsedPurchaseCost = parseMoneyInput(purchaseCost);
    if (!Number.isFinite(parsedPurchaseCost) || parsedPurchaseCost < 0) {
      setError('Valor de compra invalido.');
      setActiveTab('pricing');
      return;
    }

    const productData = {
      slug: slug.trim() || null,
      title: title.trim(),
      description,
      price: parsedPrice,
      purchaseCost: parsedPurchaseCost,
      categoryId,
      subcategoryId: subcategoryId || null,
      audience: null,
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
      isNew,
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
      setError('Erro ao tentar salvar o produto.');
    }
  };

  const handleSuggestSalePrice = () => {
    setError('');
    if (suggestedSalePrice <= 0) {
      setError('Informe valor de compra e percentual validos para sugerir o preco.');
      setActiveTab('pricing');
      return;
    }

    setPrice(suggestedSalePrice.toFixed(2));
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-0 backdrop-blur-sm sm:p-6">
      <div className="relative flex max-h-[92vh] w-full max-w-6xl flex-shrink-0 animate-in flex-col overflow-hidden rounded-2xl bg-white shadow-2xl duration-200 fade-in zoom-in-95 max-sm:h-dvh max-sm:max-h-dvh max-sm:rounded-none">
        <div className="flex items-start justify-between gap-4 border-b border-neutral-100 bg-neutral-50 px-5 py-4">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-neutral-900">
              {productToEdit ? 'Editar Produto' : 'Cadastrar Novo Produto'}
            </h2>
            <p className="mt-1 text-xs font-semibold text-neutral-500">
              Organize as informacoes por etapa para evitar cadastro confuso.
            </p>
          </div>
          <button onClick={onClose} className="rounded-xl border border-neutral-200 bg-white p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto border-b border-neutral-100 bg-white px-4 py-3">
          {formTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`min-w-[148px] rounded-xl border px-4 py-3 text-left transition-colors ${
                activeTab === tab.id
                  ? 'border-[#C98F86] bg-[#F8EEEC] text-[#7A4944]'
                  : 'border-neutral-200 bg-white text-neutral-600 hover:border-[#E7C9C4]'
              }`}
            >
              <span className="block text-xs font-black uppercase tracking-widest">{tab.label}</span>
              <span className="mt-1 block text-[11px] font-semibold opacity-75">{tab.description}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar md:p-6">
          <form id="productForm" onSubmit={handleSubmit} className="flex flex-col gap-6">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm font-bold text-red-600">
                {error}
              </div>
            )}

            {activeTab === 'details' && (
              <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <Field label="Nome do produto *" className="lg:col-span-2">
                  <input type="text" value={title} onChange={(event) => setTitle(event.target.value)} className="admin-input" placeholder="Ex: Batom Matte Rose" />
                </Field>
                <Field label="Slug interno" className="lg:col-span-2">
                  <input type="text" value={slug} onChange={(event) => setSlug(event.target.value)} className="admin-input" placeholder="batom-matte-rose" />
                </Field>
                <Field label="Categoria principal *">
                  <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className={`admin-input ${rootCategories.length === 0 ? 'border-red-300 bg-red-50' : ''}`}>
                    <option value="" disabled>Selecione uma categoria principal</option>
                    {rootCategories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                  {rootCategories.length === 0 && (
                    <span className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-red-500">Crie uma categoria principal primeiro</span>
                  )}
                </Field>
                <Field label="Subcategoria">
                  <select value={subcategoryId} onChange={(event) => setSubcategoryId(event.target.value)} className="admin-input">
                    <option value="">Sem subcategoria</option>
                    {availableSubcategories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Rotulo / marca">
                  <input type="text" value={brandLabel} onChange={(event) => setBrandLabel(event.target.value)} className="admin-input" placeholder="Ex: DIOR, avon, MK MAKER" />
                </Field>
                <Field label="Tipo">
                  <input type="text" value={productType} onChange={(event) => setProductType(event.target.value)} className="admin-input" placeholder="batom, paleta, mascara..." />
                </Field>
                <Field label="Variacao" className="lg:col-span-2">
                  <input type="text" value={variation} onChange={(event) => setVariation(event.target.value)} className="admin-input" placeholder="Rose, nude, waterproof..." />
                </Field>
                <Field label="Descricao" className="lg:col-span-2">
                  <textarea rows={4} value={description} onChange={(event) => setDescription(event.target.value)} className="admin-input resize-none" placeholder="Detalhes do produto, acabamento, tonalidade e uso..." />
                </Field>
                <Field label="Caracteristicas" className="lg:col-span-2">
                  <textarea rows={4} value={featuresText} onChange={(event) => setFeaturesText(event.target.value)} className="admin-input resize-none" placeholder="Uma caracteristica por linha" />
                </Field>
              </section>
            )}

            {activeTab === 'pricing' && (
              <section className="flex flex-col gap-5">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                  <Field label="Preco de venda (R$) *">
                    <input type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} className="admin-input" placeholder="199.90" />
                  </Field>
                  <Field label="Valor de compra (R$)">
                    <input type="number" min="0" step="0.01" value={purchaseCost} onChange={(event) => setPurchaseCost(event.target.value)} className="admin-input" placeholder="0.00" />
                  </Field>
                  <Field label="Quantidade base">
                    <input type="number" min="0" step="1" value={stockQuantity} onChange={(event) => setStockQuantity(event.target.value)} className="admin-input" placeholder="0" />
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-3 rounded-2xl border border-[#E7C9C4] bg-[#FDF8F7] p-4 md:grid-cols-[1fr_auto]">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Percentual para sugestao (%)">
                      <input type="number" min="0" step="1" value={markupPercent} onChange={(event) => setMarkupPercent(event.target.value)} className="admin-input bg-white" placeholder="80" />
                    </Field>
                    <div className="flex flex-col justify-center rounded-xl border border-[#F3E3DF] bg-white px-4 py-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Preco sugerido</span>
                      <strong className="text-lg font-black text-[#8D514B]">R$ {suggestedSalePrice.toFixed(2).replace('.', ',')}</strong>
                    </div>
                  </div>
                  <button type="button" onClick={handleSuggestSalePrice} className="min-h-[48px] rounded-xl bg-neutral-950 px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition-colors hover:bg-[#8D514B]">
                    Sugerir preco
                  </button>
                </div>

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-200 p-4 transition-colors hover:bg-neutral-50">
                  <input type="checkbox" checked={variantsEnabled} onChange={(event) => setVariantsEnabled(event.target.checked)} className="h-5 w-5 accent-[#C98F86]" />
                  <div>
                    <p className="text-sm font-bold text-neutral-900">Usar variacoes neste produto</p>
                    <p className="text-xs text-neutral-500">Tonalidade, cor, acabamento, volume, modelo ou qualquer variacao com estoque proprio.</p>
                  </div>
                </label>

                {variantsEnabled && (
                  <div className="flex flex-col gap-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-neutral-700">Tipo de variacao</p>
                        <p className="mt-1 text-xs text-neutral-500">Escolha um grupo pronto ou use personalizado. Os campos continuam editaveis.</p>
                      </div>
                      <div className="rounded-xl border border-[#E7C9C4] bg-white px-4 py-3 text-right">
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400">Estoque total</span>
                        <span className="text-sm font-black text-[#8D514B]">{totalVariantStock} unidades</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 md:col-span-2 lg:grid-cols-4">
                        {VARIATION_PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setSelectedVariantPresetId(preset.id)}
                            className={`min-h-[44px] rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
                              selectedVariantPresetId === preset.id
                                ? 'border-[#C98F86] bg-[#F8EEEC] text-[#8D514B]'
                                : 'border-neutral-200 bg-white text-neutral-600 hover:border-[#E7C9C4] hover:text-[#8D514B]'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {selectedVariantPreset.values.map((value) => (
                        <button key={value} type="button" onClick={() => addPresetVariant(value)} className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-700 hover:border-[#E7C9C4] hover:text-[#8D514B]">
                          {value}
                        </button>
                      ))}
                      {selectedVariantPreset.values.length > 0 && (
                        <button type="button" onClick={addAllPresetVariants} className="rounded-lg border border-[#E7C9C4] bg-white px-3 py-2 text-xs font-bold text-[#8D514B] hover:bg-[#F8EEEC]">
                          Adicionar todas
                        </button>
                      )}
                      <button type="button" onClick={() => addPresetVariant()} className="inline-flex items-center gap-1 rounded-lg border border-[#E7C9C4] bg-[#F8EEEC] px-3 py-2 text-xs font-bold text-[#8D514B] hover:bg-[#F3E3DF]">
                        <Plus className="h-3.5 w-3.5" /> Variacao livre
                      </button>
                    </div>

                    <div className="flex flex-col gap-3">
                      {variants.length === 0 && (
                        <div className="rounded-xl border border-dashed border-neutral-200 bg-white p-4 text-sm text-neutral-500">
                          Adicione opcoes rapidas ou uma variacao livre.
                        </div>
                      )}

                      {variants.map((variant, index) => (
                        <div key={`${variant.id ?? 'new'}-${index}`} className="grid grid-cols-1 gap-3 rounded-2xl border border-neutral-200 bg-white p-4 md:grid-cols-2 lg:grid-cols-12">
                          <Field label="Tipo" className="lg:col-span-2">
                            <input value={variant.options[0]?.name ?? ''} onChange={(event) => updateVariantOption(index, 'name', event.target.value)} className="admin-input" placeholder={`Ex: ${selectedVariantPreset.optionName}`} />
                          </Field>
                          <Field label="Valor" className="lg:col-span-2">
                            <input value={variant.options[0]?.value ?? ''} onChange={(event) => updateVariantOption(index, 'value', event.target.value)} className="admin-input" placeholder={`Ex: ${selectedVariantPreset.placeholderValue}`} />
                          </Field>
                          <Field label="Nome exibido" className="lg:col-span-3">
                            <input value={variant.label} onChange={(event) => updateVariant(index, { label: event.target.value })} className="admin-input" placeholder={`Ex: ${selectedVariantPreset.placeholderLabel}`} />
                          </Field>
                          <Field label="Quantidade" className="lg:col-span-2">
                            <input type="number" min="0" step="1" value={variant.stockQuantity} onChange={(event) => updateVariant(index, { stockQuantity: Number(event.target.value) })} className="admin-input" placeholder="Ex: 12" />
                          </Field>
                          <Field label="Preco opcional" className="lg:col-span-2">
                            <input type="number" min="0" step="0.01" value={variant.price ?? ''} onChange={(event) => updateVariant(index, { price: event.target.value === '' ? null : Number(event.target.value) })} className="admin-input" placeholder="Ex: 99.90" />
                          </Field>
                          <div className="flex items-center justify-end gap-2 lg:col-span-1">
                            <label className="flex items-center gap-2 text-xs font-bold text-neutral-600">
                              <input type="checkbox" checked={variant.isActive} onChange={(event) => updateVariant(index, { isActive: event.target.checked })} className="accent-[#C98F86]" />
                              Ativa
                            </label>
                            <button type="button" onClick={() => setVariants(variants.filter((_, currentIndex) => currentIndex !== index))} className="rounded-lg p-2 text-neutral-400 hover:bg-red-50 hover:text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {activeTab === 'media' && (
              <section className="flex flex-col gap-5">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-neutral-900">Imagens do Produto</h3>
                  <p className="mt-1 text-xs text-neutral-500">Use imagens com fundo branco. O preview mantem o mockup inteiro sem cortar.</p>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="flex h-36 w-36 shrink-0 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#E7C9C4] bg-[#F8EEEC] text-[#8D514B] transition-colors hover:bg-[#F3E3DF]">
                    <UploadCloud className="h-6 w-6" />
                    <span className="text-xs font-bold">Adicionar Foto</span>
                  </button>
                  {images.map((img, index) => (
                    <div key={`${img.slice(0, 32)}-${index}`} className="group relative h-36 w-36 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-white">
                      <img src={img} alt={`Imagem ${index + 1} de ${title || 'produto'}`} className="h-full w-full object-contain p-2" />
                      <button type="button" onClick={() => setImages(images.filter((_, currentIndex) => currentIndex !== index))} className="absolute right-2 top-2 rounded-lg bg-red-500 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeTab === 'showcase' && (
              <section className="flex flex-col gap-5">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field label="Status editorial">
                    <select value={catalogStatus} onChange={(event) => setCatalogStatus(event.target.value as Product['catalogStatus'])} className="admin-input">
                      <option value="draft">Rascunho</option>
                      <option value="ready">Pronto</option>
                      <option value="live">Publicado</option>
                    </select>
                  </Field>
                  <div className="rounded-2xl border border-[#E7C9C4] bg-[#FDF8F7] p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#8D514B]">Resumo</p>
                    <p className="mt-2 text-sm font-bold text-neutral-700">
                      {isActive ? 'Produto visivel no catalogo.' : 'Produto oculto no catalogo.'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <ToggleCard title="Produto ativo" description="Visivel no catalogo publico" checked={isActive} onChange={setIsActive} tone="neutral" />
                  <ToggleCard title="Estrela / Destaque" description="Aparece em areas de destaque" checked={isFeatured} onChange={setIsFeatured} tone="emerald" />
                  <ToggleCard title="Status: Promocao" description="Aplica tag de promocao simples" checked={isPromo} onChange={setIsPromo} tone="rose" />
                  <ToggleCard title="Status: Lancamento" description="Aplica tag de novidade simples" checked={isNew} onChange={setIsNew} tone="blue" />
                </div>
              </section>
            )}
          </form>
        </div>

        <div className="grid grid-cols-1 gap-3 border-t border-neutral-100 bg-white p-4 sm:grid-cols-2 md:p-5">
          <button onClick={onClose} className="rounded-xl border border-neutral-200 px-5 py-3 text-sm font-bold uppercase tracking-widest text-neutral-600 transition-colors hover:bg-neutral-50">
            Cancelar
          </button>
          <button form="productForm" type="submit" className="rounded-xl bg-gradient-to-r from-neutral-950 to-[#A76D65] px-5 py-3 text-sm font-bold uppercase tracking-widest text-white shadow-md transition-colors hover:from-neutral-900 hover:to-[#C98F86]">
            {productToEdit ? 'Salvar Alteracoes' : 'Cadastrar Produto'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, className = '', children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-neutral-700">{label}</span>
      {children}
    </div>
  );
}

function ToggleCard({
  title,
  description,
  checked,
  onChange,
  tone,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  tone: 'neutral' | 'emerald' | 'rose' | 'blue';
}) {
  const tones = {
    neutral: checked ? 'border-[#E7C9C4] bg-[#F8EEEC] text-[#8D514B]' : 'border-neutral-200 bg-white text-neutral-700',
    emerald: checked ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-neutral-200 bg-white text-neutral-700',
    rose: checked ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-neutral-200 bg-white text-neutral-700',
    blue: checked ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-neutral-200 bg-white text-neutral-700',
  } as const;

  return (
    <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition-colors ${tones[tone]}`}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 accent-[#C98F86]" />
      <span>
        <span className="block text-sm font-black">{title}</span>
        <span className="mt-1 block text-xs font-semibold opacity-75">{description}</span>
      </span>
    </label>
  );
}
