-- Update student drive tracking to use detailed JSON structure
-- First drop the old columns
ALTER TABLE students 
DROP COLUMN IF EXISTS drives_attended,
DROP COLUMN IF EXISTS qualified_rounds,
DROP COLUMN IF EXISTS failed_round;

-- Add the new detailed tracking column
ALTER TABLE students 
ADD COLUMN drive_details TEXT; 