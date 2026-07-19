-- Required 1–5 star rating per visit
ALTER TABLE visits
  ADD COLUMN rating SMALLINT NOT NULL DEFAULT 3,
  ADD CONSTRAINT visits_rating_range CHECK (rating BETWEEN 1 AND 5);

ALTER TABLE visits ALTER COLUMN rating DROP DEFAULT;
