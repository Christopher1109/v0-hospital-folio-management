-- SCRIPT 008: Crear usuarios adicionales para los 8 hospitales nuevos
-- Este script crea Auxiliar, Líder y Almacenista para cada hospital nuevo
-- Y crea 2 supervisores adicionales para cubrir los hospitales

-- Obtener IDs de los nuevos hospitales para referencia
DO $$
DECLARE
  h4_id uuid;
  h5_id uuid;
  h6_id uuid;
  h7_id uuid;
  h8_id uuid;
  h9_id uuid;
  h10_id uuid;
  h11_id uuid;
BEGIN
  -- Obtener IDs de hospitales (4 al 11, los primeros 3 ya existen)
  SELECT id INTO h4_id FROM hospitals WHERE name = 'Hospital Pediátrico Oriente';
  SELECT id INTO h5_id FROM hospitals WHERE name = 'Hospital de Especialidades Poniente';
  SELECT id INTO h6_id FROM hospitals WHERE name = 'Hospital Materno Infantil Norte';
  SELECT id INTO h7_id FROM hospitals WHERE name = 'Hospital Regional Centro';
  SELECT id INTO h8_id FROM hospitals WHERE name = 'Hospital Traumatológico Sur';
  SELECT id INTO h9_id FROM hospitals WHERE name = 'Hospital Cardiovascular Este';
  SELECT id INTO h10_id FROM hospitals WHERE name = 'Hospital Neurológico Occidente';
  SELECT id INTO h11_id FROM hospitals WHERE name = 'Hospital Oncológico Bajío';

  RAISE NOTICE 'IDs de hospitales obtenidos. Ahora crear usuarios manualmente en auth.users';
END $$;

-- Nota: Los usuarios deben crearse en auth.users primero con las credenciales
-- Luego se pueden asociar con los hospitales en public.users

-- Listado de usuarios a crear:
-- HOSPITAL 4 (Pediátrico Oriente):
-- - auxiliar4@hospital.com / auxiliar123
-- - lider4@hospital.com / lider123
-- - almacen4@hospital.com / almacen123

-- HOSPITAL 5 (Especialidades Poniente):
-- - auxiliar5@hospital.com / auxiliar123
-- - lider5@hospital.com / lider123
-- - almacen5@hospital.com / almacen123

-- HOSPITAL 6 (Materno Infantil Norte):
-- - auxiliar6@hospital.com / auxiliar123
-- - lider6@hospital.com / lider123
-- - almacen6@hospital.com / almacen123

-- HOSPITAL 7 (Regional Centro):
-- - auxiliar7@hospital.com / auxiliar123
-- - lider7@hospital.com / lider123
-- - almacen7@hospital.com / almacen123

-- HOSPITAL 8 (Traumatológico Sur):
-- - auxiliar8@hospital.com / auxiliar123
-- - lider8@hospital.com / lider123
-- - almacen8@hospital.com / almacen123

-- HOSPITAL 9 (Cardiovascular Este):
-- - auxiliar9@hospital.com / auxiliar123
-- - lider9@hospital.com / lider123
-- - almacen9@hospital.com / almacen123

-- HOSPITAL 10 (Neurológico Occidente):
-- - auxiliar10@hospital.com / auxiliar123
-- - lider10@hospital.com / lider123
-- - almacen10@hospital.com / almacen123

-- HOSPITAL 11 (Oncológico Bajío):
-- - auxiliar11@hospital.com / auxiliar123
-- - lider11@hospital.com / lider123
-- - almacen11@hospital.com / almacen123

-- SUPERVISORES ADICIONALES:
-- - supervisor2@hospital.com / supervisor123 (Hospitales 5-8)
-- - supervisor3@hospital.com / supervisor123 (Hospitales 9-11 + Hospital Regional Sur)
