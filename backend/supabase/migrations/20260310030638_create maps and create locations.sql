CREATE TABLE IF NOT EXISTS maps (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_name           text NOT NULL,
  slug                  text NOT NULL,
  email                 text NOT NULL,
  plan                  text NOT NULL CHECK (plan IN ('basic', 'premium')),
  relationship_start_date date NOT NULL,
  token                 text UNIQUE,
  status                text NOT NULL DEFAULT 'pending_payment'
                        CHECK (status IN ('pending_payment', 'active', 'expired', 'payment_failed')),
  youtube_video_id      text,
  youtube_start_time    integer,
  youtube_end_time      integer,
  payment_id            text,
  pix_qr_code           text,
  pix_code              text,
  payment_expires_at    timestamptz,
  expires_at            timestamptz,
  created_at            timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS locations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id      uuid REFERENCES maps(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  message     text,
  photo_url   text,
  latitude    decimal NOT NULL,
  longitude   decimal NOT NULL,
  "order"     integer NOT NULL
);
