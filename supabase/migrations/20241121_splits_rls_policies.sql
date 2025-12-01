-- Enable RLS on splits table if not already enabled
ALTER TABLE splits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to splits" ON splits;
DROP POLICY IF EXISTS "Allow public insert access to splits" ON splits;
DROP POLICY IF EXISTS "Allow public update access to splits" ON splits;
DROP POLICY IF EXISTS "Allow public delete access to splits" ON splits;

-- Allow users to read only their own splits
CREATE POLICY "Users can read own splits"
ON splits FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to insert only their own splits
CREATE POLICY "Users can insert own splits"
ON splits FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to update only their own splits
CREATE POLICY "Users can update own splits"
ON splits FOR UPDATE
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to update only their own splits
CREATE POLICY "Users can delete own splits"
ON splits FOR DELETE
TO authenticated
WITH CHECK (auth.uid() = user_id);
