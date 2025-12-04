-- SCRIPT 007: Modificaciones completas del sistema
-- Este script implementa todos los cambios solicitados

-- 1. Agregar nueva tabla para asignaciones de hospitales a supervisores
CREATE TABLE IF NOT EXISTS supervisor_hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supervisor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(supervisor_id, hospital_id)
);

-- 2. Agregar campos de paciente a folio_requests
ALTER TABLE folio_requests ADD COLUMN IF NOT EXISTS patient_name TEXT;
ALTER TABLE folio_requests ADD COLUMN IF NOT EXISTS patient_age INTEGER;
ALTER TABLE folio_requests ADD COLUMN IF NOT EXISTS patient_gender TEXT CHECK (patient_gender IN ('masculino', 'femenino', 'otro'));
ALTER TABLE folio_requests ADD COLUMN IF NOT EXISTS patient_nss TEXT;
ALTER TABLE folio_requests ADD COLUMN IF NOT EXISTS surgery_type TEXT;
ALTER TABLE folio_requests ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT false;
ALTER TABLE folio_requests ADD COLUMN IF NOT EXISTS anesthesia_type TEXT CHECK (anesthesia_type IN ('general', 'locorregional', 'sedacion'));
ALTER TABLE folio_requests ADD COLUMN IF NOT EXISTS surgeon_name TEXT;
ALTER TABLE folio_requests ADD COLUMN IF NOT EXISTS anesthesiologist_name TEXT;
ALTER TABLE folio_requests ADD COLUMN IF NOT EXISTS procedure_time TIMESTAMPTZ;

-- 3. Crear 8 hospitales adicionales (para tener 11 en total)
INSERT INTO hospitals (name, location) VALUES
('Hospital Pediátrico Oriente', 'Calle Niños Héroes 234, Ciudad de México'),
('Hospital de Especialidades Poniente', 'Av. Constitución 567, Ciudad de México'),
('Hospital Materno Infantil Norte', 'Blvd. Madres 890, Monterrey'),
('Hospital Regional Centro', 'Calle Hidalgo 111, Guadalajara'),
('Hospital Traumatológico Sur', 'Av. Reforma 222, Puebla'),
('Hospital Cardiovascular Este', 'Calle Corazón 333, Querétaro'),
('Hospital Neurológico Occidente', 'Av. Cerebro 444, León'),
('Hospital Oncológico Bajío', 'Calle Esperanza 555, Celaya')
ON CONFLICT DO NOTHING;

-- 4. Actualizar políticas RLS para supervisor_hospitals
ALTER TABLE supervisor_hospitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Supervisores pueden ver sus hospitales asignados"
  ON supervisor_hospitals FOR SELECT
  USING (supervisor_id = auth.uid());

CREATE POLICY "Gerentes pueden ver todas las asignaciones"
  ON supervisor_hospitals FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'gerente'
  ));

-- 5. Actualizar políticas RLS de inventory
DROP POLICY IF EXISTS "Almacen can update inventory for their hospital" ON inventory;
DROP POLICY IF EXISTS "Almacen can insert inventory for their hospital" ON inventory;

CREATE POLICY "Personal autorizado puede actualizar inventario"
  ON inventory FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
        AND role IN ('almacen', 'lider')
        AND hospital_id = inventory.hospital_id
    )
    OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'gerente'
    )
    OR
    inventory.hospital_id IN (
      SELECT hospital_id FROM supervisor_hospitals 
      WHERE supervisor_id = auth.uid()
    )
  );

CREATE POLICY "Personal autorizado puede insertar inventario"
  ON inventory FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
        AND role IN ('almacen', 'lider')
        AND hospital_id = inventory.hospital_id
    )
    OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'gerente'
    )
    OR
    inventory.hospital_id IN (
      SELECT hospital_id FROM supervisor_hospitals 
      WHERE supervisor_id = auth.uid()
    )
  );

-- 6. Actualizar políticas RLS de folio_requests
DROP POLICY IF EXISTS "Supervisores can view folios from their hospital" ON folio_requests;
DROP POLICY IF EXISTS "Supervisores can approve folios for their hospital" ON folio_requests;

CREATE POLICY "Supervisores pueden ver folios de sus hospitales asignados"
  ON folio_requests FOR SELECT
  USING (
    hospital_id IN (
      SELECT hospital_id FROM supervisor_hospitals 
      WHERE supervisor_id = auth.uid()
    )
  );

CREATE POLICY "Supervisores pueden actualizar folios de sus hospitales"
  ON folio_requests FOR UPDATE
  USING (
    hospital_id IN (
      SELECT hospital_id FROM supervisor_hospitals 
      WHERE supervisor_id = auth.uid()
    )
  );

-- 7. Permitir a líderes, supervisores y gerentes crear folios
CREATE POLICY "Lideres pueden crear folios en su hospital"
  ON folio_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
        AND role = 'lider' 
        AND hospital_id = folio_requests.hospital_id
    )
  );

CREATE POLICY "Supervisores pueden crear folios en sus hospitales"
  ON folio_requests FOR INSERT
  WITH CHECK (
    folio_requests.hospital_id IN (
      SELECT hospital_id FROM supervisor_hospitals 
      WHERE supervisor_id = auth.uid()
    )
  );

CREATE POLICY "Gerentes pueden crear cualquier folio"
  ON folio_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'gerente'
    )
  );

-- 8. Permitir a supervisores y gerentes ver todo el inventario
CREATE POLICY "Supervisores pueden ver inventario de sus hospitales"
  ON inventory FOR SELECT
  USING (
    hospital_id IN (
      SELECT hospital_id FROM supervisor_hospitals 
      WHERE supervisor_id = auth.uid()
    )
  );
