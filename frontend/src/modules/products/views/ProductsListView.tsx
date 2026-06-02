import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Filter, Package, Edit2, Trash2, ImageOff, Layers3 } from 'lucide-react';
import { useProductStore, Product } from '../store/useProductStore';
import { useCategoryStore } from '../../categories/store/useCategoryStore';
import { ProductFormModal } from '../components/ProductFormModal';

export function ProductsListView() {
  const { products, deleteProduct, updateVisibility, bulkUpdateVisibility, fetchProducts, bulkUpdateStock } = useProductStore();
  const categories = useCategoryStore((state) => state.categories);
  const fetchCategories = useCategoryStore((state) => state.fetchCategories);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('all');
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
    const matchesAudience = audienceFilter === 'all' || product.audience === audienceFilter;
    const matchesCatalogStatus = catalogStatusFilter === 'all' || product.catalogStatus === catalogStatusFilter;
    const matchesImage = imageFilter === 'all' || (imageFilter === 'with-image' ? product.images.length > 0 : product.images.length === 0);

    return matchesSearch && matchesAudience && matchesCatalogStatus && matchesImage;
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
    <div className="flex flex-col gap-4 md:gap-8 max-w-7xl mx-auto pb-6 md:pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-neutral-900">Produtos</h1>
          <p className="text-xs md:text-sm text-neutral-500 mt-1">Gerencie o catalogo de maquiagem e beleza.</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center justify-center w-full md:w-auto gap-2 bg-gradient-to-r from-purple-800 to-purple-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:from-purple-700 hover:to-purple-500 transition-colors shadow-md shadow-purple-500/20"
        >
          <Plus className="w-5 h-5" />
          Novo Produto
        </button>
      </header>

      <div className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-neutral-200 shadow-sm flex flex-col xl:flex-row gap-3 md:gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-neutral-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por nome, slug, tipo ou variacao..."
            className="w-full pl-9 md:pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg md:rounded-xl text-xs md:text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full xl:w-auto">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <select
              value={audienceFilter}
              onChange={(event) => setAudienceFilter(event.target.value)}
              className="w-full sm:w-44 pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg md:rounded-xl text-xs md:text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            >
              <option value="all">Todos os publicos</option>
              <option value="feminino">Feminino</option>
              <option value="masculino">Masculino</option>
              <option value="suplemento">Suplementos</option>
            </select>
          </div>
          <select
            value={catalogStatusFilter}
            onChange={(event) => setCatalogStatusFilter(event.target.value)}
            className="w-full sm:w-40 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg md:rounded-xl text-xs md:text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          >
            <option value="all">Todos status</option>
            <option value="draft">Rascunho</option>
            <option value="ready">Pronto</option>
            <option value="live">Publicado</option>
          </select>
          <select
            value={imageFilter}
            onChange={(event) => setImageFilter(event.target.value)}
            className="w-full sm:w-40 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg md:rounded-xl text-xs md:text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          >
            <option value="all">Todas imagens</option>
            <option value="missing-image">Sem imagem</option>
            <option value="with-image">Com imagem</option>
          </select>
        </div>
      </div>

      <section className="bg-white p-4 rounded-xl md:rounded-2xl border border-neutral-200 shadow-sm flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-purple-50 text-purple-700">
            <Layers3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-900">Ajuste de estoque em lote</h2>
            <p className="text-xs text-neutral-500 mt-1">
              Atualize a quantidade para os produtos selecionados ou para todos os produtos filtrados na lista atual.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <input
            type="number"
            min={0}
            step={1}
            value={bulkStockQuantity}
            onChange={(event) => setBulkStockQuantity(event.target.value)}
            className="w-full sm:w-36 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            placeholder="Quantidade"
          />
          <button
            onClick={() => applyBulkStock('selected')}
            disabled={bulkActionLoading !== null}
            className="px-4 py-2 rounded-lg text-sm font-bold border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {bulkActionLoading === 'selected' ? 'Aplicando...' : `Aplicar selecionados (${selectedProductIds.length})`}
          </button>
          <button
            onClick={() => applyBulkStock('filtered')}
            disabled={bulkActionLoading !== null}
            className="px-4 py-2 rounded-lg text-sm font-bold border border-neutral-200 text-neutral-700 bg-neutral-50 hover:bg-neutral-100 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {bulkActionLoading === 'filtered' ? 'Aplicando...' : `Aplicar todos filtrados (${filteredProducts.length})`}
          </button>
        </div>
      </section>

      <section className="bg-white p-4 rounded-xl md:rounded-2xl border border-neutral-200 shadow-sm flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-900">Acoes rapidas de vitrine</h2>
          <p className="text-xs text-neutral-500 mt-1">Ative, desative ou publique produtos selecionados sem abrir o modal.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap">
          <button disabled={visibilityActionLoading} onClick={() => applyBulkVisibility({ isActive: true })} className="px-4 py-2 rounded-lg text-xs font-bold border border-emerald-200 bg-emerald-50 text-emerald-700 disabled:opacity-60">Ativar</button>
          <button disabled={visibilityActionLoading} onClick={() => applyBulkVisibility({ isActive: false })} className="px-4 py-2 rounded-lg text-xs font-bold border border-neutral-200 bg-neutral-50 text-neutral-700 disabled:opacity-60">Desativar</button>
          <button disabled={visibilityActionLoading} onClick={() => applyBulkVisibility({ catalogStatus: 'live', isActive: true })} className="px-4 py-2 rounded-lg text-xs font-bold border border-purple-200 bg-purple-50 text-purple-700 disabled:opacity-60">Publicar</button>
          <button disabled={visibilityActionLoading} onClick={() => applyBulkVisibility({ isFeatured: true })} className="px-4 py-2 rounded-lg text-xs font-bold border border-amber-200 bg-amber-50 text-amber-700 disabled:opacity-60">Destacar</button>
          <button disabled={visibilityActionLoading} onClick={() => applyBulkVisibility({ isNew: true })} className="px-4 py-2 rounded-lg text-xs font-bold border border-blue-200 bg-blue-50 text-blue-700 disabled:opacity-60">Lancamento</button>
        </div>
      </section>

      <div className="bg-white rounded-xl md:rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-xs font-bold text-neutral-500 uppercase tracking-widest">
                <th className="p-4 w-12">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleAllFilteredSelection}
                    aria-label="Selecionar todos os produtos filtrados"
                    className="w-4 h-4 accent-purple-600"
                  />
                </th>
                <th className="p-4">Produto</th>
                <th className="p-4">Categoria</th>
                <th className="p-4">Preco</th>
                <th className="p-4">Estoque</th>
                <th className="p-4">Tags</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
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
                        className="w-4 h-4 accent-purple-600"
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-neutral-200 rounded-lg shrink-0 overflow-hidden">
                          {product.images[0]
                            ? <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                            : <Package className="w-5 h-5 m-auto text-neutral-400 mt-3" />}
                        </div>
                        <div>
                          <h4 className="font-bold text-neutral-900 text-sm">{product.title}</h4>
                          <span className="text-xs text-neutral-500">{product.slug || `ID: ${product.id.split('-')[0].toUpperCase()}`}</span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {product.audience && <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-neutral-100 text-neutral-600 rounded">{product.audience}</span>}
                            {product.productType && <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-neutral-100 text-neutral-600 rounded">{product.productType}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-neutral-600">{getCategoryLabel(product)}</td>
                    <td className="p-4 text-sm font-bold text-neutral-900">R$ {product.price.toFixed(2).replace('.', ',')}</td>
                    <td className="p-4 text-sm">
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
                        {product.isNew && <span className="px-2 py-1 text-[10px] font-bold uppercase bg-blue-100 text-blue-700 rounded border border-blue-200">Novo</span>}
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
                          className="p-2 text-neutral-400 hover:text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
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
