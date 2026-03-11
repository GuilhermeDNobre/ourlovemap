ALTER TABLE maps
  ADD COLUMN IF NOT EXISTS checkout_url text,
  DROP COLUMN IF EXISTS pix_qr_code,
  DROP COLUMN IF EXISTS pix_code,
  DROP COLUMN IF EXISTS payment_expires_at;
