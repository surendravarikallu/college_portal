-- Add new fields for student placement tracking
ALTER TABLE students 
ADD COLUMN id_card_url TEXT,
ADD COLUMN drives_attended INTEGER DEFAULT 0,
ADD COLUMN qualified_rounds INTEGER DEFAULT 0,
ADD COLUMN failed_round TEXT; 