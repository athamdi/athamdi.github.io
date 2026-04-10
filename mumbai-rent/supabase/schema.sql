-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Main pins table
CREATE TABLE pins (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lat           FLOAT8 NOT NULL,
  lng           FLOAT8 NOT NULL,
  geom          GEOMETRY(Point, 4326) GENERATED ALWAYS AS (
                  ST_SetSRID(ST_MakePoint(lng, lat), 4326)
                ) STORED,
  bhk           INT CHECK (bhk IN (1, 2, 3, 4)),
  rent          INT NOT NULL CHECK (rent > 0 AND rent < 1000000),
  furnishing    TEXT CHECK (furnishing IN ('unfurnished', 'semi', 'fully')),
  gated         BOOLEAN DEFAULT false,
  one_liner     TEXT CHECK (char_length(one_liner) <= 120),
  pin_type      TEXT DEFAULT 'rent' CHECK (pin_type IN ('rent', 'seeker', 'owner')),
  ip_hash       TEXT NOT NULL,
  verified      BOOLEAN DEFAULT false,
  report_count  INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  expires_at    TIMESTAMPTZ
);

-- Private contact table for owner/seeker relay emails
CREATE TABLE pin_private_contacts (
  pin_id        UUID PRIMARY KEY REFERENCES pins(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Connection attempts audit log
CREATE TABLE connect_attempts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_pin_id      UUID NOT NULL REFERENCES pins(id) ON DELETE CASCADE,
  seeker_email_hash TEXT NOT NULL,
  message_preview   TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Spatial index for fast polygon queries
CREATE INDEX pins_geom_idx ON pins USING GIST (geom);
CREATE INDEX pins_type_idx ON pins (pin_type);
CREATE INDEX pins_bhk_idx ON pins (bhk);

-- Auto-expire seeker/owner pins after 30 days
CREATE OR REPLACE FUNCTION set_pin_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.pin_type IN ('seeker', 'owner') THEN
    NEW.expires_at := NOW() + INTERVAL '30 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pin_expiry_trigger
  BEFORE INSERT ON pins
  FOR EACH ROW EXECUTE FUNCTION set_pin_expiry();

-- Polygon stats function (called from API)
CREATE OR REPLACE FUNCTION get_polygon_stats(
  polygon_geojson TEXT,
  filter_bhk INT DEFAULT NULL,
  filter_furnishing TEXT DEFAULT NULL,
  filter_gated BOOLEAN DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'count', COUNT(*),
    'median_rent', PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY rent),
    'p25_rent', PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY rent),
    'p75_rent', PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY rent),
    'avg_rent', ROUND(AVG(rent)),
    'min_rent', MIN(rent),
    'max_rent', MAX(rent),
    'by_bhk', (
      SELECT json_agg(json_build_object('bhk', bhk, 'count', cnt, 'median', med))
      FROM (
        SELECT bhk, COUNT(*) as cnt,
               PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY rent) as med
        FROM pins
        WHERE pin_type = 'rent'
          AND report_count < 3
          AND (expires_at IS NULL OR expires_at > NOW())
          AND ST_Contains(
            ST_GeomFromGeoJSON(polygon_geojson),
            geom
          )
          AND (filter_bhk IS NULL OR bhk = filter_bhk)
          AND (filter_furnishing IS NULL OR furnishing = filter_furnishing)
          AND (filter_gated IS NULL OR gated = filter_gated)
        GROUP BY bhk
        ORDER BY bhk
      ) sub
    ),
    'by_furnishing', (
      SELECT json_agg(json_build_object('type', furnishing, 'count', cnt))
      FROM (
        SELECT furnishing, COUNT(*) as cnt
        FROM pins
        WHERE pin_type = 'rent'
          AND report_count < 3
          AND (expires_at IS NULL OR expires_at > NOW())
          AND ST_Contains(ST_GeomFromGeoJSON(polygon_geojson), geom)
          AND (filter_bhk IS NULL OR bhk = filter_bhk)
          AND (filter_gated IS NULL OR gated = filter_gated)
        GROUP BY furnishing
      ) sub
    )
  ) INTO result
  FROM pins
  WHERE pin_type = 'rent'
    AND report_count < 3
    AND (expires_at IS NULL OR expires_at > NOW())
    AND ST_Contains(
      ST_GeomFromGeoJSON(polygon_geojson),
      geom
    )
    AND (filter_bhk IS NULL OR bhk = filter_bhk)
    AND (filter_furnishing IS NULL OR furnishing = filter_furnishing)
    AND (filter_gated IS NULL OR gated = filter_gated);

  RETURN result;
END;
$$ LANGUAGE plpgsql;
