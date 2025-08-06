-- Add new fields to alumni table
ALTER TABLE alumni ADD COLUMN current_status TEXT NOT NULL DEFAULT 'higher_education';
ALTER TABLE alumni ADD COLUMN company TEXT;
ALTER TABLE alumni ADD COLUMN package INTEGER;
ALTER TABLE alumni ADD COLUMN role TEXT;
ALTER TABLE alumni ADD COLUMN offer_letter_url TEXT;
ALTER TABLE alumni ADD COLUMN id_card_url TEXT;

-- Update existing records to have a default status
UPDATE alumni SET current_status = 'higher_education' WHERE current_status IS NULL; 