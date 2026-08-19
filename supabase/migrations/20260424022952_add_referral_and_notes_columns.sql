
-- Referidos (Sprint 3)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS referred_by TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_referrals INTEGER DEFAULT 0;

-- Notas en pedidos
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_time TEXT;

-- Generar códigos de referido para clientes existentes
UPDATE customers 
SET referral_code = 'REF-' || UPPER(SUBSTRING(REPLACE(phone, '+', ''), -4)) || '-' || UPPER(SUBSTRING(MD5(phone), 1, 4))
WHERE referral_code IS NULL;
