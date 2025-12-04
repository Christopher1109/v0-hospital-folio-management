-- Drop problematic policies
DROP POLICY IF EXISTS "Users can view users from their hospital" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;

-- Recreate users policies without recursion
CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  USING (id = auth.uid());

-- Allow users to view other users from same hospital using a simpler approach
CREATE POLICY "Users can view hospital users"
  ON users FOR SELECT
  USING (
    hospital_id = (
      SELECT u.hospital_id 
      FROM users u 
      WHERE u.id = auth.uid()
      LIMIT 1
    )
  );

-- Gerentes can view all users
CREATE POLICY "Gerentes can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'gerente'
    )
  );

-- Fix hospitals policies to avoid recursion
DROP POLICY IF EXISTS "Users can view their own hospital" ON hospitals;

CREATE POLICY "Users can view their hospital"
  ON hospitals FOR SELECT
  USING (
    id = (SELECT u.hospital_id FROM users u WHERE u.id = auth.uid() LIMIT 1)
  );
