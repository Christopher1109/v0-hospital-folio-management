-- 010_supervisor_hospitals.sql
-- Tabla para asignar varios hospitales a cada supervisor

CREATE TABLE IF NOT EXISTS supervisor_hospitals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supervisor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  UNIQUE (supervisor_id, hospital_id)
);

ALTER TABLE supervisor_hospitals ENABLE ROW LEVEL SECURITY;

-- Policy simple: todos los autenticados pueden leer esta tabla (sólo se usa para filtros internos)
CREATE POLICY "All authenticated can view supervisor_hospitals"
  ON supervisor_hospitals FOR SELECT
  TO authenticated
  USING (true);

-- Opcional: sólo gerentes pueden insertar/borrar asignaciones
CREATE POLICY "Gerentes can manage supervisor_hospitals"
  ON supervisor_hospitals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'gerente'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'gerente'
    )
  );

------------------------------------------------------------
-- 🔁 Ajustar policies de HOSPITALS para soportar supervisores
------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view their hospital" ON hospitals;

-- Usuarios normales ven sólo su hospital principal
CREATE POLICY "Users can view primary hospital"
  ON hospitals FOR SELECT
  USING (
    id = (
      SELECT u.hospital_id
      FROM users u
      WHERE u.id = auth.uid()
      LIMIT 1
    )
  );

-- Supervisores ven todos los hospitales que tienen asignados
CREATE POLICY "Supervisores can view assigned hospitals"
  ON hospitals FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM supervisor_hospitals sh
      WHERE sh.supervisor_id = auth.uid()
        AND sh.hospital_id = hospitals.id
    )
  );

-- Gerentes siguen viendo todos
-- (ya tienes esta policy, la dejamos igual)
-- CREATE POLICY "Gerentes can view all hospitals" ...

------------------------------------------------------------
-- 🔁 Ajustar policies de FOLIO_REQUESTS para multi-hospital
------------------------------------------------------------

DROP POLICY IF EXISTS "Supervisores can view folios from their hospital" ON folio_requests;
DROP POLICY IF EXISTS "Supervisores can update folios from their hospital" ON folio_requests;

-- Ver folios de cualquiera de SUS hospitales asignados
CREATE POLICY "Supervisores can view folios from assigned hospitals"
  ON folio_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM supervisor_hospitals sh
      WHERE sh.supervisor_id = auth.uid()
        AND sh.hospital_id = folio_requests.hospital_id
    )
  );

-- Actualizar folios de cualquiera de SUS hospitales asignados
CREATE POLICY "Supervisores can update folios from assigned hospitals"
  ON folio_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM supervisor_hospitals sh
      WHERE sh.supervisor_id = auth.uid()
        AND sh.hospital_id = folio_requests.hospital_id
    )
  );

------------------------------------------------------------
-- 🔁 Ajustar INVENTORY (si quieres que supervisor vea inventario
--    de todos sus hospitales). Esto ayuda para InventoryManagement.
------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view inventory from their hospital" ON inventory;

CREATE POLICY "Users can view inventory from their hospital or assigned hospitals"
  ON inventory FOR SELECT
  USING (
    -- Hospital principal (líder, auxiliar, almacén)
    hospital_id = (
      SELECT u.hospital_id
      FROM users u
      WHERE u.id = auth.uid()
      LIMIT 1
    )
    OR
    -- Hospitales asignados al supervisor
    EXISTS (
      SELECT 1
      FROM supervisor_hospitals sh
      WHERE sh.supervisor_id = auth.uid()
        AND sh.hospital_id = inventory.hospital_id
    )
  );
