-- Optional photo per visit (storage object key, not full URL)
ALTER TABLE visits ADD COLUMN image_path TEXT;

CREATE POLICY "auth_update_visits" ON visits
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Public bucket: stable URLs for timeline; paths use UUIDs
INSERT INTO storage.buckets (id, name, public)
VALUES ('visit-images', 'visit-images', true);

CREATE POLICY "auth_insert_visit_images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'visit-images');

CREATE POLICY "auth_select_visit_images" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'visit-images');
