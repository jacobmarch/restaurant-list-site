-- Optional location per visit (address + coordinates)
ALTER TABLE visits
  ADD COLUMN address TEXT,
  ADD COLUMN lat DOUBLE PRECISION,
  ADD COLUMN lng DOUBLE PRECISION;
