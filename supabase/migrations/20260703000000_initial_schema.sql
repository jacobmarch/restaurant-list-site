-- restaurants: unique places
CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- visits: individual trips (one-to-many)
CREATE TABLE visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  visited_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX visits_restaurant_id_idx ON visits(restaurant_id);
CREATE INDEX visits_visited_at_idx ON visits(visited_at DESC);

-- RLS: authenticated users only (shared couple data)
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_restaurants" ON restaurants
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_insert_restaurants" ON restaurants
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "auth_select_visits" ON visits
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_insert_visits" ON visits
  FOR INSERT TO authenticated WITH CHECK (true);
