-- 011_assign_supervisors_to_hospitals.sql
-- Asigna hospitales a los 3 supervisores de demo

DO $$
DECLARE
  sup1 uuid;
  sup2 uuid;
  sup3 uuid;
BEGIN
  SELECT id INTO sup1 FROM users WHERE email = 'supervisor_grupo1@demo.com';
  SELECT id INTO sup2 FROM users WHERE email = 'supervisor_grupo2@demo.com';
  SELECT id INTO sup3 FROM users WHERE email = 'supervisor_grupo3@demo.com';

  -- Grupo 1
  INSERT INTO supervisor_hospitals (supervisor_id, hospital_id)
  SELECT sup1, h.id
  FROM hospitals h
  WHERE h.name IN (
    'Hospital Cardiovascular Este',
    'Hospital Central',
    'Hospital de Especialidades Poniente',
    'Hospital General Norte'
  )
  ON CONFLICT (supervisor_id, hospital_id) DO NOTHING;

  -- Grupo 2
  INSERT INTO supervisor_hospitals (supervisor_id, hospital_id)
  SELECT sup2, h.id
  FROM hospitals h
  WHERE h.name IN (
    'Hospital Materno Infantil Norte',
    'Hospital Neurológico Occidente',
    'Hospital Oncológico Bajío',
    'Hospital Pediátrico Oriente'
  )
  ON CONFLICT (supervisor_id, hospital_id) DO NOTHING;

  -- Grupo 3
  INSERT INTO supervisor_hospitals (supervisor_id, hospital_id)
  SELECT sup3, h.id
  FROM hospitals h
  WHERE h.name IN (
    'Hospital Regional Centro',
    'Hospital Regional Sur',
    'Hospital Traumatológico Sur'
  )
  ON CONFLICT (supervisor_id, hospital_id) DO NOTHING;
END $$;
