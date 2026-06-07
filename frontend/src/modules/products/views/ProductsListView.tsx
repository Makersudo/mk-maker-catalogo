import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Filter, Package, Edit2, Trash2, ImageOff, Layers3 } from 'lucide-react';
import { useProductStore, Product } from '../store/useProductStore';
import { useCategoryStore } from '../../categories/store/useCategoryStore';
import { ProductFormModal } from '../components/ProductFormModal';

function formatAdminPrice(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));
}

export function ProductsListView() {
  const { products, isLoading, error, deleteProduct, updateVisibility, bulkUpdateVisibility, fetchProducts, bulkUpdateStock } = useProductStore();
  const categories = useCategoryStore((state) => state.categories);
  const fetchCategories = useCategoryStore((state) => state.fetchCategories);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [catalogStatusFilter, setCatalogStatusFilter] = useState('all');
  const [imageFilter, setImageFilter] = useState('all');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [bulkStockQuantity, setBulkStockQuantity] = useState('0');
  const [bulkActionLoading, setBulkActionLoading] = useState<'selected' | 'filtered' | null>(null);
  const [visibilityActionLoading, setVisibilityActionLoading] = useState(false);

  const filteredProducts = products.filter((product) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = [
      product.title,
      product.slug || '',
      product.productType || '',
      product.variation || '',
    ].some((value) => value.toLowerCase().includes(term));
    const matchesCategory = categoryFilter === 'all' || product.categoryId === categoryFilter || product.subcategoryId === categoryFilter;
    const matchesCatalogStatus = catalogStatusFilter === 'all' || product.catalogStatus === catalogStatusFilter;
    const matchesImage = imageFilter === 'all' || (imageFilter === 'with-image' ? product.images.length > 0 : product.images.length === 0);

    return matchesSearch && matchesCategory && matchesCatalogStatus && matchesImage;
  });

  const filteredProductIds = useMemo(
    () => filteredProducts.map((product) => product.id),
    [filteredProducts]
  );

  const allFilteredSelected = filteredProductIds.length > 0
    && filteredProductIds.every((productId) => selectedProductIds.includes(productId));

  const getCategoryLabel = (product: Product) => {
    const categoryName = categories.find((category) => category.id === product.categoryId)?.name || product.categoryName || 'Sem Categoria';
    const subcategoryName = categories.find((category) => category.id === product.subcategoryId)?.name || product.subcategoryName;
    return subcategoryName ? `${categoryName} / ${subcategoryName}` : categoryName;
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories(true);
  }, [fetchProducts, fetchCategories]);

  useEffect(() => {
    setSelectedProductIds((current) => current.filter((productId) => products.some((product) => product.id === productId)));
  }, [products]);

  const handleEdit = (product: Product) => {
    setProductToEdit(product);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setProductToEdit(null);
    setIsModalOpen(true);
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds((current) => (
      current.includes(productId)
        ? current.filter((selectedId) => selectedId !== productId)
        : [...current, productId]
    ));
  };

  const toggleAllFilteredSelection = () => {
    setSelectedProductIds((current) => {
      if (allFilteredSelected) {
        return current.filter((productId) => !filteredProductIds.includes(productId));
      }

      return Array.from(new Set([...current, ...filteredProductIds]));
    });
  };

  const applyBulkStock = async (mode: 'selected' | 'filtered') => {
    const nextStockQuantity = Number(bulkStockQuantity);
    const productIds = mode === 'selected' ? selectedProductIds : filteredProductIds;

    if (!Number.isInteger(nextStockQuantity) || nextStockQuantity < 0) {
      window.alert('Informe uma quantidade inteira e nao negativa.');
      return;
    }

    if (productIds.length === 0) {
      window.alert(mode === 'selected' ? 'Selecione ao menos um produto.' : 'Nenhum produto filtrado disponivel para atualizar.');
      return;
    }

    setBulkActionLoading(mode);
    try {
      await bulkUpdateStock(productIds, nextStockQuantity);
      if (mode === 'filtered') {
        setSelectedProductIds((current) => current.filter((productId) => !filteredProductIds.includes(productId)));
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Nao foi possivel atualizar o estoque em lote.');
    } finally {
      setBulkActionLoading(null);
    }
  };

  const applyBulkVisibility = async (updates: Parameters<typeof bulkUpdateVisibility>[1]) => {
    if (selectedProductIds.length === 0) {
      window.alert('Selecione ao menos um produto.');
      return;
    }

    setVisibilityActionLoading(true);
    try {
      await bulkUpdateVisibility(selectedProductIds, updates);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Nao foi possivel atualizar a vitrine em lote.');
    } finally {
      setVisibilityActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6 max-w-[1800px] mx-auto pb-4 md:pb-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-neutral-900">Produtos</h1>
          <p className="text-xs md:text-sm text-neutral-500 mt-1">Gerencie o catalogo de maquiagem e beleza.</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center justify-center w-full md:w-auto gap-2 bg-gradient-to-r from-neutral-950 to-[#A76D65] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:from-neutral-900 hover:to-[#C98F86] transition-colors shadow-md shadow-[#C98F86]/20"
        >
          <Plus className="w-5 h-5" />
          Novo Produto
        </button>
      </header>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-xl md:rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-neutral-100 p-3 md:p-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden rounded-lg bg-[#F8EEEC] p-2 text-[#8D514B] sm:block">
              <Layers3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#9d6a63]">Operacao da lista</p>
              <h2 className="text-sm font-black text-neutral-900">{filteredProducts.length} produtos encontrados</h2>
            </div>
          </div>
          <div className="rounded-full bg-neutral-50 px-3 py-1 text-xs font-bold text-neutral-500">
            {selectedProductIds.length} selecionados
          </div>
        </div>

        <div className="grid gap-3 p-3 md:p-4 xl:grid-cols-[minmax(360px,1fr)_auto] xl:items-center">
          <div className="grid gap-3 md:grid-cols-[minmax(260px,1fr)_repeat(3,minmax(150px,190px))]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por nome, slug, tipo ou variacao..."
                className="h-10 w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-9 pr-4 text-sm focus:border-[#C98F86] focus:outline-none focus:ring-1 focus:ring-[#C98F86]"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="h-10 w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-9 pr-3 text-sm focus:border-[#C98F86] focus:outline-none focus:ring-1 focus:ring-[#C98F86]"
              >
                <option value="all">Todas categorias</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.parentId || category.parent_id ? `- ${category.name}` : category.name}
                  </option>
                ))}
              </select>
            </div>
            <select
              value={catalogStatusFilter}
              onChange={(event) => setCatalogStatusFilter(event.target.value)}
              className="h-10 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-[#C98F86] focus:outline-none focus:ring-1 focus:ring-[#C98F86]"
            >
              <option value="all">Todos status</option>
              <option value="draft">Rascunho</option>
              <option value="ready">Pronto</option>
              <option value="live">Publicado</option>
            </select>
            <select
              value={imageFilter}
              onChange={(event) => setImageFilter(event.target.value)}
              className="h-10 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-[#C98F86] focus:outline-none focus:ring-1 focus:ring-[#C98F86]"
            >
              <option value="all">Todas imagens</option>
              <option value="missing-image">Sem imagem</option>
              <option value="with-image">Com imagem</option>
            </select>
          </div>

          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <input
              type="number"
              min={0}
              step={1}
              value={bulkStockQuantity}
              onChange={(event) => setBulkStockQuantity(event.target.value)}
              className="h-10 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-[#C98F86] focus:outline-none focus:ring-1 focus:ring-[#C98F86] lg:w-24"
              placeholder="Qtd."
              aria-label="Quantidade para estoque em lote"
            />
            <button
              onClick={() => applyBulkStock('selected')}
              disabled={bulkActionLoading !== null}
              className="h-10 rounded-xl border border-[#E7C9C4] bg-[#F8EEEC] px-3 text-xs font-black uppercase text-[#8D514B] hover:bg-[#F3E3DF] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {bulkActionLoading === 'selected' ? 'Aplicando' : 'Estoque selecionados'}
            </button>
            <button
              onClick={() => applyBulkStock('filtered')}
              disabled={bulkActionLoading !== null}
              className="h-10 rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-xs font-black uppercase text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {bulkActionLoading === 'filtered' ? 'Aplicando' : 'Estoque filtrados'}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-neutral-100 p-3 md:p-4">
          <button disabled={visibilityActionLoading} onClick={() => applyBulkVisibility({ isActive: true })} className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black uppercase text-emerald-700 disabled:opacity-60">Ativar</button>
          <button disabled={visibilityActionLoading} onClick={() => applyBulkVisibility({ isActive: false })} className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-black uppercase text-neutral-700 disabled:opacity-60">Desativar</button>
          <button disabled={visibilityActionLoading} onClick={() => applyBulkVisibility({ catalogStatus: 'live', isActive: true })} className="rounded-lg border border-[#E7C9C4] bg-[#F8EEEC] px-3 py-2 text-xs font-black uppercase text-[#8D514B] disabled:opacity-60">Publicar</button>
          <button disabled={visibilityActionLoading} onClick={() => applyBulkVisibility({ isFeatured: true })} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black uppercase text-amber-700 disabled:opacity-60">Destacar</button>
          <button disabled={visibilityActionLoading} onClick={() => applyBulkVisibility({ isNew: true })} className="rounded-lg border border-[#E7C9C4] bg-white px-3 py-2 text-xs font-black uppercase text-[#8D514B] disabled:opacity-60">Lancamento</button>
        </div>
      </section>

      <div className="mobile-products-list grid gap-3 lg:hidden">
        {isLoading ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 text-sm font-bold text-neutral-500 shadow-sm">
            Carregando produtos...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-8 text-center shadow-sm">
            <Package className="mx-auto mb-3 h-10 w-10 text-neutral-300" />
            <h3 className="text-sm font-black text-neutral-900">Nenhum produto encontrado</h3>
            <p className="mx-auto mt-1 max-w-xs text-xs text-neutral-500">
              Ajuste os filtros ou cadastre um novo produto para a vitrine.
            </p>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <article key={product.id} className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm shadow-neutral-900/5">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedProductIds.includes(product.id)}
                  onChange={() => toggleProductSelection(product.id)}
                  aria-label={`Selecionar ${product.title}`}
                  className="mt-1 h-4 w-4 shrink-0 accent-[#C98F86]"
                />
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-white">
                  {product.images[0]
                    ? <img src={product.images[0]} alt={product.title} className="h-full w-full object-contain p-1.5" />
                    : <Package className="mx-auto mt-6 h-6 w-6 text-neutral-300" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="line-clamp-2 text-sm font-black leading-tight text-neutral-900">{product.title}</h4>
                  <p className="mt-1 truncate text-[11px] font-semibold text-neutral-500">{product.slug || `ID: ${product.id.split('-')[0].toUpperCase()}`}</p>
                  <p className="mt-2 line-clamp-1 text-xs font-bold text-[#7A4944]">{getCategoryLabel(product)}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {product.brandLabel && <span className="rounded bg-[#F8EEEC] px-1.5 py-0.5 text-[9px] font-black uppercase text-[#8D514B]">{product.brandLabel}</span>}
                    {product.productType && <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[9px] font-black uppercase text-neutral-600">{product.productType}</span>}
                    {product.images.length === 0 && (
                      <span className="inline-flex items-center gap-1 rounded bg-orange-50 px-1.5 py-0.5 text-[9px] font-black uppercase text-orange-700">
                        <ImageOff className="h-3 w-3" />
                        Sem imagem
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-neutral-50 p-2 text-center">
                <div>
                  <span className="block text-[9px] font-black uppercase tracking-widest text-neutral-400">Preco</span>
                  <strong className="mt-1 block text-xs text-neutral-900">{formatAdminPrice(product.price)}</strong>
                </div>
                <div>
                  <span className="block text-[9px] font-black uppercase tracking-widest text-neutral-400">Estoque</span>
                  <strong className="mt-1 block text-xs text-neutral-900">{product.stockQuantity ?? 0}</strong>
                </div>
                <div>
                  <span className="block text-[9px] font-black uppercase tracking-widest text-neutral-400">Status</span>
                  <strong className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] uppercase ${product.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-200 text-neutral-500'}`}>
                    {product.isActive ? 'Ativo' : 'Inativo'}
                  </strong>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-3">
                <label className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black uppercase text-emerald-700">
                  <input
                    type="checkbox"
                    checked={product.isActive}
                    onChange={() => updateVisibility(product.id, { isActive: !product.isActive })}
                    className="h-4 w-4 accent-emerald-600"
                  />
                  Ativo
                </label>
                <div className="ml-auto flex gap-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="inline-flex items-center gap-1 rounded-xl border border-[#E7C9C4] bg-[#F8EEEC] px-3 py-2 text-xs font-black uppercase text-[#8D514B]"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Excluir este produto?')) deleteProduct(product.id);
                    }}
                    className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black uppercase text-rose-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Excluir
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="hidden lg:block bg-white rounded-xl md:rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[1320px] text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-xs font-bold text-neutral-500 uppercase tracking-widest">
                <th className="p-4 w-12">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleAllFilteredSelection}
                    aria-label="Selecionar todos os produtos filtrados"
                    className="w-4 h-4 accent-[#C98F86]"
                  />
                </th>
                <th className="p-4 min-w-[380px]">Produto</th>
                <th className="p-4 w-64">Categoria</th>
                <th className="p-4 w-32 whitespace-nowrap">Preco</th>
                <th className="p-4 w-24 whitespace-nowrap">Estoque</th>
                <th className="p-4 min-w-[240px]">Tags</th>
                <th className="p-4 w-28 whitespace-nowrap">Status</th>
                <th className="p-4 w-40 text-right whitespace-nowrap">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-sm font-bold text-neutral-500">
                    Carregando produtos...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-neutral-400">
                      <Package className="w-12 h-12 mb-4 opacity-50" />
                      <h3 className="text-lg font-bold text-neutral-900 mb-1">Nenhum produto encontrado</h3>
                      <p className="text-sm text-neutral-500 max-w-sm mx-auto">
                        Seu catalogo esta vazio no momento ou a busca nao retornou resultados.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                    <td className="p-4 align-top">
                      <input
                        type="checkbox"
                        checked={selectedProductIds.includes(product.id)}
                        onChange={() => toggleProductSelection(product.id)}
                        aria-label={`Selecionar ${product.title}`}
                        className="w-4 h-4 accent-[#C98F86]"
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-white rounded-lg shrink-0 overflow-hidden border border-neutral-200">
                          {product.images[0]
                            ? <img src={product.images[0]} alt={product.title} className="w-full h-full object-contain p-1" />
                            : <Package className="w-5 h-5 m-auto text-neutral-400 mt-4" />}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-neutral-900 text-sm">{product.title}</h4>
                          <span className="text-xs text-neutral-500">{product.slug || `ID: ${product.id.split('-')[0].toUpperCase()}`}</span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {product.brandLabel && <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-[#F8EEEC] text-[#8D514B] rounded">{product.brandLabel}</span>}
                            {product.productType && <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-neutral-100 text-neutral-600 rounded">{product.productType}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-neutral-600">
                      <span className="line-clamp-2">{getCategoryLabel(product)}</span>
                    </td>
                    <td className="p-4 text-sm font-bold text-neutral-900 whitespace-nowrap">R$ {product.price.toFixed(2).replace('.', ',')}</td>
                    <td className="p-4 text-sm whitespace-nowrap">
                      <span className="font-bold text-neutral-900">{product.stockQuantity ?? 0}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {product.catalogStatus && (
                          <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded border ${product.catalogStatus === 'live' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : product.catalogStatus === 'ready' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-neutral-100 text-neutral-600 border-neutral-200'}`}>
                            {product.catalogStatus}
                          </span>
                        )}
                        {product.isFeatured && <span className="px-2 py-1 text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 rounded border border-emerald-200">Destaque</span>}
                        {product.isPromo && <span className="px-2 py-1 text-[10px] font-bold uppercase bg-rose-100 text-rose-700 rounded border border-rose-200">Promo</span>}
                        {product.isNew && <span className="px-2 py-1 text-[10px] font-bold uppercase bg-[#F8EEEC] text-[#8D514B] rounded border border-[#E7C9C4]">Novo</span>}
                        {product.images.length === 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase bg-orange-50 text-orange-700 rounded border border-orange-200">
                            <ImageOff className="w-3 h-3" />
                            Sem imagem
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {product.isActive
                        ? <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest bg-emerald-100/50 text-emerald-700 border border-emerald-500/20 rounded-full">Ativo</span>
                        : <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest bg-neutral-100 text-neutral-500 border border-neutral-200 rounded-full">Inativo</span>}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <label className="inline-flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer" title="Ativo no catalogo">
                          <input
                            type="checkbox"
                            checked={product.isActive}
                            onChange={() => updateVisibility(product.id, { isActive: !product.isActive })}
                            className="w-4 h-4 accent-emerald-600"
                          />
                          <span className="sr-only">Ativo no catalogo</span>
                        </label>
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-2 text-neutral-400 hover:text-[#8D514B] rounded-lg hover:bg-[#F8EEEC] transition-colors"
                          title="Editar Produto"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Excluir este produto?')) deleteProduct(product.id);
                          }}
                          className="p-2 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Excluir Produto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <ProductFormModal onClose={() => setIsModalOpen(false)} productToEdit={productToEdit} />
      )}
    </div>
  );
}
