-- Agregar nuevos campos de paciente y procedimiento a folio_requests
ALTER TABLE folio_requests
ADD COLUMN IF NOT EXISTS patient_name TEXT,
ADD COLUMN IF NOT EXISTS patient_age INTEGER,
ADD COLUMN IF NOT EXISTS patient_gender TEXT CHECK (patient_gender IN ('masculino', 'femenino', 'otro')),
ADD COLUMN IF NOT EXISTS patient_nss TEXT,
ADD COLUMN IF NOT EXISTS surgery_type TEXT,
ADD COLUMN IF NOT EXISTS is_emergency BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS anesthesia_type TEXT,
ADD COLUMN IF NOT EXISTS surgeon_name TEXT,
ADD COLUMN IF NOT EXISTS anesthesiologist_name TEXT,
ADD COLUMN IF NOT EXISTS procedure_time TIME;

-- Crear tabla de tipos de anestesia si no existe
CREATE TABLE IF NOT EXISTS anesthesia_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar tipos de anestesia predefinidos
INSERT INTO anesthesia_types (name, description) VALUES
('Anestesia general balanceada adulto', 'Anestesia general para procedimientos en pacientes adultos'),
('Anestesia general balanceada pediátrica', 'Anestesia general para procedimientos en pacientes pediátricos'),
('Anestesia general de alta especialidad', 'Anestesia general para procedimientos de alta complejidad'),
('Anestesia general endovenosa', 'Anestesia general administrada por vía intravenosa'),
('Anestesia locorregional', 'Anestesia que afecta una región específica del cuerpo'),
('Sedación', 'Sedación consciente o profunda para procedimientos menores')
ON CONFLICT (name) DO NOTHING;

-- Crear tabla de médicos (cirujanos y anestesiólogos)
CREATE TABLE IF NOT EXISTS doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  specialty TEXT NOT NULL CHECK (specialty IN ('cirujano', 'anestesiólogo')),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, specialty, hospital_id)
);

-- RLS Policies para anesthesia_types
ALTER TABLE anesthesia_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view anesthesia types"
  ON anesthesia_types FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies para doctors
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view doctors from their hospital"
  ON doctors FOR SELECT
  USING (hospital_id IN (SELECT hospital_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Gerentes can view all doctors"
  ON doctors FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'gerente'
  ));

-- Insertar médicos de ejemplo para Hospital General Norte
INSERT INTO doctors (name, specialty, hospital_id)
SELECT 'Dr. Juan Pérez', 'cirujano', id FROM hospitals WHERE name = 'Hospital General Norte'
ON CONFLICT DO NOTHING;

INSERT INTO doctors (name, specialty, hospital_id)
SELECT 'Dra. María García', 'cirujano', id FROM hospitals WHERE name = 'Hospital General Norte'
ON CONFLICT DO NOTHING;

INSERT INTO doctors (name, specialty, hospital_id)
SELECT 'Dr. Carlos Rodríguez', 'anestesiólogo', id FROM hospitals WHERE name = 'Hospital General Norte'
ON CONFLICT DO NOTHING;

INSERT INTO doctors (name, specialty, hospital_id)
SELECT 'Dra. Ana Martínez', 'anestesiólogo', id FROM hospitals WHERE name = 'Hospital General Norte'
ON CONFLICT DO NOTHING;
