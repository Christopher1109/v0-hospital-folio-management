-- Insert hospitals (only using columns that exist: name, location)
INSERT INTO hospitals (name, location) VALUES
('Hospital General Norte', 'Av. Revolución 123, Ciudad de México'),
('Hospital Regional Sur', 'Calle Independencia 456, Ciudad de México'),
('Hospital Central', 'Blvd. Juárez 789, Guadalajara')
ON CONFLICT DO NOTHING;

-- Insert products
INSERT INTO products (name, description, unit, category, min_stock) VALUES
('Guantes de látex', 'Guantes desechables de látex talla M', 'caja', 'Material Médico', 50),
('Jeringas 10ml', 'Jeringas desechables de 10ml', 'unidad', 'Material Médico', 100),
('Gasas estériles', 'Gasas estériles 10x10cm', 'paquete', 'Material Médico', 50),
('Alcohol 70%', 'Alcohol isopropílico 70% 1L', 'litro', 'Insumos', 20),
('Vendas elásticas', 'Vendas elásticas 10cm x 5m', 'rollo', 'Material Médico', 30),
('Termómetros digitales', 'Termómetro digital infrarrojo', 'unidad', 'Equipo Médico', 10),
('Mascarillas N95', 'Mascarillas de protección N95', 'unidad', 'Equipo de Protección', 100),
('Suero fisiológico', 'Solución salina 0.9% 500ml', 'unidad', 'Medicamentos', 50),
('Catéteres IV', 'Catéter intravenoso calibre 22', 'unidad', 'Material Médico', 50),
('Esparadrapo', 'Esparadrapo hipoalergénico 2.5cm', 'rollo', 'Material Médico', 30)
ON CONFLICT DO NOTHING;

-- Using DO block to insert inventory with dynamic hospital and product IDs
DO $$
DECLARE
  hospital_norte_id uuid;
  hospital_sur_id uuid;
  hospital_centro_id uuid;
  product_guantes_id uuid;
  product_jeringas_id uuid;
  product_gasas_id uuid;
  product_alcohol_id uuid;
  product_vendas_id uuid;
  product_termometros_id uuid;
  product_mascarillas_id uuid;
  product_suero_id uuid;
  product_cateteres_id uuid;
  product_esparadrapo_id uuid;
BEGIN
  -- Get hospital IDs
  SELECT id INTO hospital_norte_id FROM hospitals WHERE name = 'Hospital General Norte';
  SELECT id INTO hospital_sur_id FROM hospitals WHERE name = 'Hospital Regional Sur';
  SELECT id INTO hospital_centro_id FROM hospitals WHERE name = 'Hospital Central';
  
  -- Get product IDs
  SELECT id INTO product_guantes_id FROM products WHERE name = 'Guantes de látex';
  SELECT id INTO product_jeringas_id FROM products WHERE name = 'Jeringas 10ml';
  SELECT id INTO product_gasas_id FROM products WHERE name = 'Gasas estériles';
  SELECT id INTO product_alcohol_id FROM products WHERE name = 'Alcohol 70%';
  SELECT id INTO product_vendas_id FROM products WHERE name = 'Vendas elásticas';
  SELECT id INTO product_termometros_id FROM products WHERE name = 'Termómetros digitales';
  SELECT id INTO product_mascarillas_id FROM products WHERE name = 'Mascarillas N95';
  SELECT id INTO product_suero_id FROM products WHERE name = 'Suero fisiológico';
  SELECT id INTO product_cateteres_id FROM products WHERE name = 'Catéteres IV';
  SELECT id INTO product_esparadrapo_id FROM products WHERE name = 'Esparadrapo';

  -- Insert inventory for Hospital General Norte (only using columns that exist: hospital_id, product_id, quantity)
  INSERT INTO inventory (hospital_id, product_id, quantity) VALUES
  (hospital_norte_id, product_guantes_id, 150),
  (hospital_norte_id, product_jeringas_id, 500),
  (hospital_norte_id, product_gasas_id, 200),
  (hospital_norte_id, product_alcohol_id, 50),
  (hospital_norte_id, product_vendas_id, 100),
  (hospital_norte_id, product_termometros_id, 25),
  (hospital_norte_id, product_mascarillas_id, 300),
  (hospital_norte_id, product_suero_id, 200),
  (hospital_norte_id, product_cateteres_id, 150),
  (hospital_norte_id, product_esparadrapo_id, 80)
  ON CONFLICT (hospital_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity;

  -- Insert inventory for Hospital Regional Sur
  INSERT INTO inventory (hospital_id, product_id, quantity) VALUES
  (hospital_sur_id, product_guantes_id, 120),
  (hospital_sur_id, product_jeringas_id, 400),
  (hospital_sur_id, product_gasas_id, 180),
  (hospital_sur_id, product_alcohol_id, 45),
  (hospital_sur_id, product_vendas_id, 90),
  (hospital_sur_id, product_termometros_id, 20),
  (hospital_sur_id, product_mascarillas_id, 250),
  (hospital_sur_id, product_suero_id, 180),
  (hospital_sur_id, product_cateteres_id, 130),
  (hospital_sur_id, product_esparadrapo_id, 70)
  ON CONFLICT (hospital_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity;

  -- Insert inventory for Hospital Central
  INSERT INTO inventory (hospital_id, product_id, quantity) VALUES
  (hospital_centro_id, product_guantes_id, 100),
  (hospital_centro_id, product_jeringas_id, 350),
  (hospital_centro_id, product_gasas_id, 150),
  (hospital_centro_id, product_alcohol_id, 40),
  (hospital_centro_id, product_vendas_id, 75),
  (hospital_centro_id, product_termometros_id, 18),
  (hospital_centro_id, product_mascarillas_id, 200),
  (hospital_centro_id, product_suero_id, 160),
  (hospital_centro_id, product_cateteres_id, 110),
  (hospital_centro_id, product_esparadrapo_id, 60)
  ON CONFLICT (hospital_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity;
END $$;
