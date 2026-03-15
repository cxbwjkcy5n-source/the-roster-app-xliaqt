-- Add rating fields and how_we_met to roster_profiles
ALTER TABLE roster_profiles
  ADD COLUMN IF NOT EXISTS sexual_chemistry INTEGER CHECK (sexual_chemistry BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS attractiveness INTEGER CHECK (attractiveness BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS how_we_met TEXT;
