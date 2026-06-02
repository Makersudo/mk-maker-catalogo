insert into public.categories (name, slug, parent_id, sort_order, is_active)
values
  ('Maquiagem', 'maquiagem', null, 10, true),
  ('Skincare', 'skincare', null, 20, true)
on conflict (slug) do update
set name = excluded.name,
    parent_id = excluded.parent_id,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active;

with roots as (
  select id, slug from public.categories where slug in ('maquiagem', 'skincare')
)
insert into public.categories (name, slug, parent_id, sort_order, is_active)
values
  ('Batons', 'maquiagem-batons', (select id from roots where slug = 'maquiagem'), 10, true),
  ('Olhos', 'maquiagem-olhos', (select id from roots where slug = 'maquiagem'), 20, true),
  ('Rosto', 'maquiagem-rosto', (select id from roots where slug = 'maquiagem'), 30, true),
  ('Pinceis e Acessorios', 'maquiagem-pinceis-acessorios', (select id from roots where slug = 'maquiagem'), 40, true),
  ('Cuidados com a Pele', 'skincare-cuidados-com-a-pele', (select id from roots where slug = 'skincare'), 10, true)
on conflict (slug) do update
set name = excluded.name,
    parent_id = excluded.parent_id,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active;

insert into public.settings (key, value, is_public)
values
  ('store_name', 'MK MAKER', true),
  ('whatsapp_phone', '', true)
on conflict (key) do update
set value = excluded.value,
    is_public = excluded.is_public;

DO $$ 
DECLARE
  cat_batom uuid;
  cat_rosto uuid;
  cat_olhos uuid;
  cat_skincare uuid;
  p_id uuid;
BEGIN
  SELECT id INTO cat_batom FROM public.categories WHERE slug = 'maquiagem-batons';
  SELECT id INTO cat_rosto FROM public.categories WHERE slug = 'maquiagem-rosto';
  SELECT id INTO cat_olhos FROM public.categories WHERE slug = 'maquiagem-olhos';
  SELECT id INTO cat_skincare FROM public.categories WHERE slug = 'skincare-cuidados-com-a-pele';

  -- Deletar produtos anteriores se existirem
  DELETE FROM public.products;

  -- Chanel Perfume
  INSERT INTO public.products (slug, title, description, price, category_id, catalog_status, stock_quantity)
  VALUES ('chanel-perfume-set', 'Kit Perfume Chanel', 'Elegante kit de perfume Chanel.', 850.00, cat_skincare, 'live', 10)
  RETURNING id INTO p_id;
  INSERT INTO public.product_images (product_id, url) VALUES (p_id, '/products/chanel_perfume_set_mockup_1780168256735.png');

  -- MAC Makeup Kit
  INSERT INTO public.products (slug, title, description, price, category_id, catalog_status, stock_quantity)
  VALUES ('mac-makeup-kit', 'Kit Maquiagem M·A·C', 'Kit profissional com batom e pó.', 320.00, cat_rosto, 'live', 15)
  RETURNING id INTO p_id;
  INSERT INTO public.product_images (product_id, url) VALUES (p_id, '/products/mac_makeup_kit_mockup_1780168278424.png');

  -- Fenty Beauty Set
  INSERT INTO public.products (slug, title, description, price, category_id, catalog_status, stock_quantity)
  VALUES ('fenty-beauty-set', 'Kit Cosméticos Fenty Beauty', 'Kit moderno Fenty Beauty.', 280.00, cat_rosto, 'live', 20)
  RETURNING id INTO p_id;
  INSERT INTO public.product_images (product_id, url) VALUES (p_id, '/products/fenty_beauty_set_mockup_1780168290396.png');

  -- Dior Lipstick
  INSERT INTO public.products (slug, title, description, price, category_id, catalog_status, stock_quantity)
  VALUES ('dior-lipstick', 'Batom Dior Rouge', 'Luxuoso batom vermelho Dior.', 210.00, cat_batom, 'live', 30)
  RETURNING id INTO p_id;
  INSERT INTO public.product_images (product_id, url) VALUES (p_id, '/products/dior_lipstick_mockup_1780168414760.png');

  -- YSL Foundation
  INSERT INTO public.products (slug, title, description, price, category_id, catalog_status, stock_quantity)
  VALUES ('ysl-foundation', 'Base Yves Saint Laurent', 'Base líquida YSL.', 380.00, cat_rosto, 'live', 12)
  RETURNING id INTO p_id;
  INSERT INTO public.product_images (product_id, url) VALUES (p_id, '/products/ysl_foundation_mockup_1780168430602.png');

  -- Anastasia Palette
  INSERT INTO public.products (slug, title, description, price, category_id, catalog_status, stock_quantity)
  VALUES ('anastasia-palette', 'Paleta Anastasia Beverly Hills', 'Paleta de sombras e sobrancelha.', 410.00, cat_olhos, 'live', 8)
  RETURNING id INTO p_id;
  INSERT INTO public.product_images (product_id, url) VALUES (p_id, '/products/anastasia_palette_mockup_1780168449102.png');

  -- Laura Mercier Powder
  INSERT INTO public.products (slug, title, description, price, category_id, catalog_status, stock_quantity)
  VALUES ('laura-mercier-powder', 'Pó Translucido Laura Mercier', 'Pó finalizador.', 240.00, cat_rosto, 'live', 25)
  RETURNING id INTO p_id;
  INSERT INTO public.product_images (product_id, url) VALUES (p_id, '/products/laura_mercier_powder_mockup_1780168462408.png');

  -- Rare Beauty Blush
  INSERT INTO public.products (slug, title, description, price, category_id, catalog_status, stock_quantity)
  VALUES ('rare-beauty-blush', 'Blush Líquido Rare Beauty', 'Blush líquido altamente pigmentado.', 160.00, cat_rosto, 'live', 40)
  RETURNING id INTO p_id;
  INSERT INTO public.product_images (product_id, url) VALUES (p_id, '/products/rare_beauty_blush_mockup_1780168475290.png');

  -- Haus Labs Foundation
  INSERT INTO public.products (slug, title, description, price, category_id, catalog_status, stock_quantity)
  VALUES ('haus-labs-foundation', 'Base Haus Labs', 'Base de cobertura média.', 260.00, cat_rosto, 'live', 18)
  RETURNING id INTO p_id;
  INSERT INTO public.product_images (product_id, url) VALUES (p_id, '/products/haus_labs_foundation_mockup_1780168490100.png');

END $$;
