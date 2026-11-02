-- Después de invitarles desde Authentication > Users > Invite user,
-- copia sus User UID y reemplaza los cuatro marcadores.
BEGIN;
UPDATE public.profiles SET auth_id='UUID_DE_ALVARO'::uuid WHERE id='alvaro' AND family='HG';
UPDATE public.profiles SET auth_id='UUID_DE_CARLA'::uuid WHERE id='carla' AND family='HG';
UPDATE public.profiles SET auth_id='UUID_DE_WALTER'::uuid WHERE id='walter' AND family='HG';
UPDATE public.profiles SET auth_id='UUID_DE_LOURDES'::uuid WHERE id='lourdes' AND family='HG';
DO $$ BEGIN
 IF (SELECT count(*) FROM public.profiles WHERE family='HG' AND auth_id IS NOT NULL) <> 4 THEN
  RAISE EXCEPTION 'Falta vincular algún viajero HG';
 END IF;
END $$;
COMMIT;
