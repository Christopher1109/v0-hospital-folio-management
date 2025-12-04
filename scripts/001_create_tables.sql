-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create hospitals table
CREATE TABLE IF NOT EXISTS hospitals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create users table (extends auth.users with app-specific fields)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('auxiliar', 'lider', 'supervisor', 'almacen', 'gerente')),
  hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL,
  category TEXT NOT NULL,
  min_stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hospital_id, product_id)
);

-- Create folio_requests table
CREATE TABLE IF NOT EXISTS folio_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  folio_number TEXT NOT NULL UNIQUE,
  auxiliar_id UUID NOT NULL REFERENCES users(id),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'aprobado_lider', 'aprobado_supervisor', 'entregado', 'rechazado')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'urgente')),
  notes TEXT,
  rejected_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create folio_items table
CREATE TABLE IF NOT EXISTS folio_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  folio_id UUID NOT NULL REFERENCES folio_requests(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity_requested INTEGER NOT NULL,
  quantity_approved INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create folio_history table for tracking status changes
CREATE TABLE IF NOT EXISTS folio_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  folio_id UUID NOT NULL REFERENCES folio_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE folio_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE folio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE folio_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hospitals
CREATE POLICY "Users can view their own hospital"
  ON hospitals FOR SELECT
  USING (id IN (SELECT hospital_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Gerentes can view all hospitals"
  ON hospitals FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'gerente'
  ));

-- RLS Policies for users
CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can view users from their hospital"
  ON users FOR SELECT
  USING (hospital_id IN (SELECT hospital_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- RLS Policies for products
CREATE POLICY "All authenticated users can view products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for inventory
CREATE POLICY "Users can view inventory from their hospital"
  ON inventory FOR SELECT
  USING (hospital_id IN (SELECT hospital_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Gerentes can view all inventory"
  ON inventory FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'gerente'
  ));

CREATE POLICY "Almacen can update inventory for their hospital"
  ON inventory FOR UPDATE
  USING (
    hospital_id IN (SELECT hospital_id FROM users WHERE id = auth.uid() AND role = 'almacen')
  );

-- RLS Policies for folio_requests
CREATE POLICY "Auxiliares can view their own folios"
  ON folio_requests FOR SELECT
  USING (auxiliar_id = auth.uid());

CREATE POLICY "Lideres can view folios from their hospital"
  ON folio_requests FOR SELECT
  USING (
    hospital_id IN (SELECT hospital_id FROM users WHERE id = auth.uid() AND role = 'lider')
  );

CREATE POLICY "Supervisores can view folios from their hospital"
  ON folio_requests FOR SELECT
  USING (
    hospital_id IN (SELECT hospital_id FROM users WHERE id = auth.uid() AND role = 'supervisor')
  );

CREATE POLICY "Almacen can view approved folios from their hospital"
  ON folio_requests FOR SELECT
  USING (
    hospital_id IN (SELECT hospital_id FROM users WHERE id = auth.uid() AND role = 'almacen')
    AND status = 'aprobado_supervisor'
  );

CREATE POLICY "Gerentes can view all folios"
  ON folio_requests FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'gerente'
  ));

CREATE POLICY "Auxiliares can create folios"
  ON folio_requests FOR INSERT
  WITH CHECK (auxiliar_id = auth.uid());

CREATE POLICY "Lideres can update folios from their hospital"
  ON folio_requests FOR UPDATE
  USING (
    hospital_id IN (SELECT hospital_id FROM users WHERE id = auth.uid() AND role = 'lider')
  );

CREATE POLICY "Supervisores can update folios from their hospital"
  ON folio_requests FOR UPDATE
  USING (
    hospital_id IN (SELECT hospital_id FROM users WHERE id = auth.uid() AND role = 'supervisor')
  );

CREATE POLICY "Almacen can update approved folios from their hospital"
  ON folio_requests FOR UPDATE
  USING (
    hospital_id IN (SELECT hospital_id FROM users WHERE id = auth.uid() AND role = 'almacen')
    AND status = 'aprobado_supervisor'
  );

-- RLS Policies for folio_items
CREATE POLICY "Users can view folio items they have access to"
  ON folio_items FOR SELECT
  USING (
    folio_id IN (SELECT id FROM folio_requests WHERE 
      auxiliar_id = auth.uid() OR
      hospital_id IN (SELECT hospital_id FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Auxiliares can insert folio items"
  ON folio_items FOR INSERT
  WITH CHECK (
    folio_id IN (SELECT id FROM folio_requests WHERE auxiliar_id = auth.uid())
  );

-- RLS Policies for folio_history
CREATE POLICY "Users can view folio history they have access to"
  ON folio_history FOR SELECT
  USING (
    folio_id IN (SELECT id FROM folio_requests WHERE 
      auxiliar_id = auth.uid() OR
      hospital_id IN (SELECT hospital_id FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Authenticated users can insert folio history"
  ON folio_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create function to generate folio number
CREATE OR REPLACE FUNCTION generate_folio_number()
RETURNS TEXT AS $$
DECLARE
  new_folio TEXT;
  counter INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO counter FROM folio_requests;
  new_folio := 'FOL-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');
  RETURN new_folio;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate folio number
CREATE OR REPLACE FUNCTION set_folio_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.folio_number IS NULL OR NEW.folio_number = '' THEN
    NEW.folio_number := generate_folio_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_folio_number
  BEFORE INSERT ON folio_requests
  FOR EACH ROW
  EXECUTE FUNCTION set_folio_number();

-- Create trigger to update folio_requests updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_folio_updated_at
  BEFORE UPDATE ON folio_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create trigger to update inventory updated_at
CREATE TRIGGER trigger_update_inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create trigger to automatically create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, hospital_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'auxiliar'),
    (NEW.raw_user_meta_data->>'hospital_id')::UUID
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
