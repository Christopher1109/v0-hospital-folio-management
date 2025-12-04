-- SCRIPT 009: Crear inventario inicial para los 8 hospitales nuevos

DO $$
DECLARE
  h_id uuid;
  hospital_name text;
  product_record RECORD;
BEGIN
  -- Para cada hospital nuevo, crear inventario con todos los productos
  FOR hospital_name IN 
    SELECT name FROM hospitals 
    WHERE name IN (
      'Hospital Pediátrico Oriente',
      'Hospital de Especialidades Poniente',
      'Hospital Materno Infantil Norte',
      'Hospital Regional Centro',
      'Hospital Traumatológico Sur',
      'Hospital Cardiovascular Este',
      'Hospital Neurológico Occidente',
      'Hospital Oncológico Bajío'
    )
  LOOP
    -- Obtener ID del hospital
    SELECT id INTO h_id FROM hospitals WHERE name = hospital_name;
    
    -- Crear inventario para cada producto
    FOR product_record IN SELECT id FROM products LOOP
      INSERT INTO inventory (hospital_id, product_id, quantity)
      VALUES (
        h_id,
        product_record.id,
        FLOOR(RANDOM() * 200 + 100)::INTEGER  -- Cantidad aleatoria entre 100 y 300
      )
      ON CONFLICT (hospital_id, product_id) DO UPDATE 
      SET quantity = EXCLUDED.quantity;
    END LOOP;
    
    RAISE NOTICE 'Inventario creado para: %', hospital_name;
  END LOOP;
END $$;
