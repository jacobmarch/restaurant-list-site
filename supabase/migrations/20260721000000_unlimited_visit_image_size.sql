-- Remove per-bucket file size cap so visit photos are not rejected by size.
-- (App-side validation no longer enforces a max either.)
UPDATE storage.buckets
SET file_size_limit = NULL
WHERE id = 'visit-images';
