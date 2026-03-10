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
