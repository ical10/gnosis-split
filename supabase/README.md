# Supabase Setup for Gnosis Split

## Initial Database Schema

The `splits` table should be created with the following schema:

```sql
CREATE TABLE splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  total_amount BIGINT NOT NULL,
  date TEXT NOT NULL,
  payer_address TEXT NOT NULL,
  participants JSONB DEFAULT '[]'::jsonb,
  payments JSONB DEFAULT '[]'::jsonb,
  source_tx_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Applying RLS Policies

To fix the "new row violates row-level security policy" error, you need to apply the RLS policies.

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `migrations/20241121_splits_rls_policies.sql`
4. Click **Run** to execute the SQL

### Option 2: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Link to your project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# Apply the migration
supabase db push
```

### Option 3: Manual Policy Creation via Dashboard

1. Go to **Authentication** → **Policies** in your Supabase dashboard
2. Select the `splits` table
3. Enable RLS if not already enabled
4. Add the following policies:
   - **Select**: Allow all (public access)
   - **Insert**: Allow all (public access)
   - **Update**: Allow all (public access)
   - **Delete**: Allow all (public access)

## Environment Variables

Make sure your `.env` file has:

```env
VITE_USE_SUPABASE=true
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Testing

After applying the policies, try creating a new split. You should no longer see the RLS policy error.

## Security Note

⚠️ **For Production**: The current policies allow public access (anyone can read/write). For a production app, you should implement proper authentication and restrict policies based on:

- Authenticated users only
- User ownership (e.g., only allow users to update splits they created)
- Participant verification (e.g., only allow participants to update payment status)

Example production policy:

```sql
-- Only allow authenticated users to create splits
CREATE POLICY "Authenticated users can create splits"
ON splits FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Only allow payer or participants to read a split
CREATE POLICY "Allow participants to read their splits"
ON splits FOR SELECT
TO authenticated
USING (
  payer_address = auth.jwt() ->> 'wallet_address' OR
  participants @> jsonb_build_array(
    jsonb_build_object('address', auth.jwt() ->> 'wallet_address')
  )
);
```
