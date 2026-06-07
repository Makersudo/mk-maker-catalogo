export function mapCategory(row: any) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    parent_id: row.parent_id ?? null,
    parentId: row.parent_id ?? null,
    sort_order: row.sort_order ?? 0,
    is_active: row.is_active ?? true,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function mapPublicCategory(row: any) {
  const category = mapCategory(row);

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    parent_id: category.parent_id,
    parentId: category.parentId,
    sort_order: category.sort_order,
    is_active: category.is_active,
  };
}
