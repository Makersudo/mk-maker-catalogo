-- Migration: Banner Announcements
-- Tabela para os anúncios rotativos do strip do header

CREATE TABLE IF NOT EXISTS banner_announcements (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  subtitle      TEXT,
  emoji         TEXT,
  image_url     TEXT,
  bg_color      TEXT NOT NULL DEFAULT '#c98f86',
  text_color    TEXT NOT NULL DEFAULT '#ffffff',
  link_type     TEXT NOT NULL DEFAULT 'url'
                  CHECK (link_type IN ('product', 'category', 'campaign', 'url', 'none')),
  link_value    TEXT,
  animation_type TEXT NOT NULL DEFAULT 'slide'
                  CHECK (animation_type IN ('slide', 'fade', 'zoom', 'flip', 'bounce', 'typewriter')),
  duration_seconds INTEGER NOT NULL DEFAULT 4,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para listagem ordenada
CREATE INDEX IF NOT EXISTS idx_banner_announcements_active_order
  ON banner_announcements (is_active, sort_order);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_banner_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_banner_updated_at
  BEFORE UPDATE ON banner_announcements
  FOR EACH ROW EXECUTE FUNCTION update_banner_updated_at();

-- Dados iniciais de demonstração
INSERT INTO banner_announcements (title, subtitle, emoji, bg_color, text_color, link_type, animation_type, sort_order) VALUES
  ('Novidades chegando!', 'Confira o catálogo completo', '✨', '#4a2825', '#ffffff', 'url', 'slide', 0),
  ('Frete grátis', 'Pedidos acima de R$ 150', '🚚', '#c98f86', '#ffffff', 'url', 'fade', 1),
  ('Produtos exclusivos', 'Para você que ama beleza', '💄', '#7c4f4a', '#ffffff', 'url', 'zoom', 2);
