import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Edit2, Plus, Tags, Trash2 } from 'lucide-react';
import { Category, useCategoryStore } from '../store/useCategoryStore';

function getParentId(category: Category) {
  return category.parent_id ?? category.parentId ?? null;
}

export function CategoriesView() {
  const { categories, addCategory, updateCategory, deleteCategory, fetchCategories } = useCategoryStore();
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [newRootName, setNewRootName] = useState('');
  const [newSubcategoryNames, setNewSubcategoryNames] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories(true);
  }, [fetchCategories]);

  const rootCategories = useMemo(
    () => categories.filter((category) => !getParentId(category)),
    [categories]
  );

  const subcategoriesByRoot = useMemo(() => {
    return rootCategories.reduce<Record<string, Category[]>>((acc, root) => {
      acc[root.id] = categories.filter((category) => getParentId(category) === root.id);
      return acc;
    }, {});
  }, [categories, rootCategories]);

  const handleAddRoot = async (e: FormEvent) => {
    e.preventDefault();
    if (!newRootName.trim()) return;

    setError('');
    try {
      await addCategory(newRootName.trim(), null);
      setNewRootName('');
    } catch (err: any) {
      setError(err.message || 'Nao foi possivel criar a categoria principal.');
    }
  };

  const handleAddSubcategory = async (e: FormEvent, parentId: string) => {
    e.preventDefault();
    const name = newSubcategoryNames[parentId]?.trim();
    if (!name) return;

    setError('');
    try {
      await addCategory(name, parentId);
      setNewSubcategoryNames((current) => ({ ...current, [parentId]: '' }));
    } catch (err: any) {
      setError(err.message || 'Nao foi possivel criar a subcategoria.');
    }
  };

  const startEdit = (id: string, currentName: string) => {
    setIsEditing(id);
    setEditName(currentName);
  };

  const handleUpdate = async (category: Category) => {
    if (!editName.trim()) return;

    setError('');
    try {
      await updateCategory(category.id, editName.trim(), getParentId(category));
      setIsEditing(null);
    } catch (err: any) {
      setError(err.message || 'Nao foi possivel atualizar a categoria.');
    }
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`Excluir "${category.name}"?`)) return;

    setError('');
    try {
      await deleteCategory(category.id);
    } catch (err: any) {
      setError(err.message || 'Nao foi possivel excluir a categoria.');
    }
  };

  return (
    <div className="flex flex-col gap-4 md:gap-8 max-w-6xl mx-auto pb-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-neutral-900">Categorias</h1>
        <p className="text-xs md:text-sm text-neutral-500 mt-1">Organize o catalogo por linhas, categorias e subcategorias.</p>
      </header>

      {error && (
        <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-bold">
          {error}
        </div>
      )}

      <div className="bg-white p-3 md:p-6 rounded-xl md:rounded-2xl border border-neutral-200 shadow-sm">
        <form onSubmit={handleAddRoot} className="flex flex-col sm:flex-row gap-3 md:gap-4 sm:items-end">
          <div className="flex-1">
            <label className="text-[10px] md:text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1 md:mb-1.5 block">Categoria Principal</label>
            <input
              type="text"
              value={newRootName}
              onChange={(e) => setNewRootName(e.target.value)}
              placeholder="Ex: Maquiagem ou Skincare"
              className="w-full px-3 py-2.5 md:px-4 md:py-3 bg-neutral-50 border border-neutral-200 rounded-lg md:rounded-xl text-xs md:text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <button
            type="submit"
            disabled={!newRootName.trim()}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-800 to-purple-600 text-white px-5 py-2.5 md:px-6 md:py-3 rounded-lg md:rounded-xl font-bold text-xs md:text-sm hover:from-purple-700 hover:to-purple-500 transition-colors shadow-md disabled:opacity-50 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
            Adicionar
          </button>
        </form>
      </div>

      {rootCategories.length === 0 ? (
        <div className="bg-white rounded-xl md:rounded-2xl border border-neutral-200 shadow-sm p-12 text-center text-neutral-400 flex flex-col items-center">
          <Tags className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm">Crie as categorias principais do catalogo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {rootCategories.map((root) => {
            const subcategories = subcategoriesByRoot[root.id] ?? [];
            const subcategoryName = newSubcategoryNames[root.id] ?? '';

            return (
              <section key={root.id} className="bg-white rounded-xl md:rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-neutral-100 bg-neutral-50 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Tags className="w-5 h-5 text-purple-600" />
                    <div>
                      <h2 className="font-bold text-sm text-neutral-800 uppercase tracking-widest">{root.name}</h2>
                      <p className="text-[11px] text-neutral-400">/{root.slug}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(root.id, root.name)} className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" aria-label="Editar categoria principal">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(root)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" aria-label="Excluir categoria principal">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isEditing === root.id && (
                  <div className="p-4 border-b border-neutral-100 flex gap-3">
                    <input
                      type="text"
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white border border-purple-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                    <button onClick={() => handleUpdate(root)} className="text-sm font-bold text-purple-600 hover:text-purple-700 px-3 py-2 bg-purple-50 rounded-lg">Salvar</button>
                    <button onClick={() => setIsEditing(null)} className="text-sm font-bold text-neutral-500 hover:text-neutral-700 px-3 py-2">Cancelar</button>
                  </div>
                )}

                <form onSubmit={(event) => handleAddSubcategory(event, root.id)} className="p-4 border-b border-neutral-100 flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={subcategoryName}
                    onChange={(e) => setNewSubcategoryNames((current) => ({ ...current, [root.id]: e.target.value }))}
                    placeholder={`Nova subcategoria em ${root.name}`}
                    className="flex-1 px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs md:text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                  <button
                    type="submit"
                    disabled={!subcategoryName.trim()}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    Subcategoria
                  </button>
                </form>

                {subcategories.length === 0 ? (
                  <div className="p-8 text-sm text-neutral-400 text-center">Nenhuma subcategoria cadastrada.</div>
                ) : (
                  <ul className="divide-y divide-neutral-100">
                    {subcategories.map((subcategory) => (
                      <li key={subcategory.id} className="p-4 flex items-center justify-between hover:bg-neutral-50 transition-colors">
                        {isEditing === subcategory.id ? (
                          <div className="flex flex-1 items-center gap-3 pr-4">
                            <input
                              type="text"
                              autoFocus
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="flex-1 px-3 py-2 bg-white border border-purple-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                            <button onClick={() => handleUpdate(subcategory)} className="text-sm font-bold text-purple-600 hover:text-purple-700 px-3 py-2 bg-purple-50 rounded-lg">Salvar</button>
                            <button onClick={() => setIsEditing(null)} className="text-sm font-bold text-neutral-500 hover:text-neutral-700 px-3 py-2">Cancelar</button>
                          </div>
                        ) : (
                          <>
                            <div>
                              <h4 className="font-bold text-neutral-900">{subcategory.name}</h4>
                              <p className="text-xs text-neutral-400 mt-0.5">/{subcategory.slug}</p>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => startEdit(subcategory.id, subcategory.name)} className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" aria-label="Editar subcategoria">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete(subcategory)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" aria-label="Excluir subcategoria">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
