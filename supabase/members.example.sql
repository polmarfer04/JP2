-- Después de crear los cuatro usuarios en Authentication > Users,
-- sustituye cada UUID por el User UID correspondiente y ejecuta en SQL Editor.
-- Los UID no son contraseñas. No uses la clave service_role en el navegador.
BEGIN;
UPDATE public.profiles SET auth_id='UUID_DE_POL'::uuid WHERE id='pol';
UPDATE public.profiles SET auth_id='UUID_DE_MONICA'::uuid WHERE id='monica';
UPDATE public.profiles SET auth_id='UUID_DE_LEYRE'::uuid WHERE id='leyre';
UPDATE public.profiles SET auth_id='UUID_DE_JOAQUIN'::uuid WHERE id='joaquin';
DO $$ BEGIN
 IF (SELECT count(*) FROM public.profiles WHERE auth_id IS NOT NULL) <> 4 THEN
  RAISE EXCEPTION 'Falta vincular algún viajero';
 END IF;
END $$;
COMMIT;
