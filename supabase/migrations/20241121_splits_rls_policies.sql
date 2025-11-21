-- Enable RLS on splits table if not already enabled
ALTER TABLE splits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to splits" ON splits;
DROP POLICY IF EXISTS "Allow public insert access to splits" ON splits;
DROP POLICY IF EXISTS "Allow public update access to splits" ON splits;
DROP POLICY IF EXISTS "Allow public delete access to splits" ON splits;

-- Allow anyone to read all splits (public read)
CREATE POLICY "Allow public read access to splits"
ON splits FOR SELECT
TO public
USING (true);

-- Allow anyone to insert splits (public insert)
CREATE POLICY "Allow public insert access to splits"
ON splits FOR INSERT
TO public
WITH CHECK (true);

-- Allow anyone to update splits (public update)
CREATE POLICY "Allow public update access to splits"
ON splits FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Allow anyone to delete splits (public delete)
CREATE POLICY "Allow public delete access to splits"
ON splits FOR DELETE
TO public
USING (true);
