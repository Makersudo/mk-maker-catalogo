-- Migration: Coupons
-- Tabela para cupons de desconto

CREATE TABLE IF NOT EXISTS coupons (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT NOT NULL UNIQUE,
  description     TEXT,
  discount_type   TEXT NOT NULL DEFAULT 'percent'
                    CHECK (discount_type IN ('percent', 'fixed')),
  discount_value  NUMERIC(10,2) NOT NULL DEFAULT 10,
  min_order_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_uses        INTEGER,           -- NULL = ilimitado
  uses_count      INTEGER NOT NULL DEFAULT 0,
  expires_at      TIMESTAMPTZ,       -- NULL = sem expiração
  is_active       BOOLEAN NOT NULL DEFAULT true,
  campaign_id     UUID REFERENCES marketing_campaigns(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para lookup por código (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_coupons_code_lower ON coupons (lower(code));

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_coupon_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_coupon_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION update_coupon_updated_at();

-- Dados de demonstração
INSERT INTO coupons (code, description, discount_type, discount_value, min_order_value, max_uses) VALUES
  ('BELEZA10', '10% de desconto para novos clientes', 'percent', 10, 0, 100),
  ('VIP20', '20% de desconto exclusivo VIP', 'percent', 20, 50, 50),
  ('FRETE15', 'R$ 15 de desconto no frete', 'fixed', 15, 80, 200);
