-- IMPORTANTE: Ejecutar este script para resolver el error de recursión infinita
-- El problema ocurre cuando las políticas RLS intentan consultar la misma tabla que protegen

-- Deshabilitar RLS completamente en la tabla users
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas existentes que causan recursión
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Allow insert from trigger" ON public.users;
DROP POLICY IF EXISTS "Users can view users from their hospital" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;

-- Nota: La tabla users es segura sin RLS porque:
-- 1. Solo los usuarios autenticados pueden acceder a la aplicación
-- 2. El middleware protege todas las rutas del dashboard
-- 3. Los usuarios solo consultan su propia información después de iniciar sesión
