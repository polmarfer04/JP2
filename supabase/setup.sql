-- Ejecutar en el SQL Editor de un proyecto Supabase dedicado a JAPÓN 2026.
BEGIN;
CREATE TABLE IF NOT EXISTS public.profiles (
 id text PRIMARY KEY,
 auth_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
 name text NOT NULL, color text NOT NULL
);
-- Preserve existing accounts and allow additional invited family members.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_check;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS family text NOT NULL DEFAULT 'MF';
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='profiles_family_check' AND conrelid='public.profiles'::regclass) THEN
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_family_check CHECK (family IN ('MF','HG'));
 END IF;
END $$;
UPDATE public.profiles SET family='MF' WHERE id IN ('pol','monica','leyre','joaquin') AND family IS DISTINCT FROM 'MF';
INSERT INTO public.profiles(id,name,color,family) VALUES
 ('alvaro','Álvaro','#5e8a86','HG'),('carla','Carla','#a87999','HG'),
 ('walter','Walter','#7778a5','HG'),('lourdes','Lourdes','#ad855e','HG')
 ON CONFLICT(id) DO NOTHING;
CREATE TABLE IF NOT EXISTS public.items (
 id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 type text NOT NULL CHECK (type IN ('activity','idea','task','tip','memory')),
 data jsonb NOT NULL,
 author text NOT NULL REFERENCES public.profiles(id),
 created timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.comments (
 id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 item_id text NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
 author text NOT NULL REFERENCES public.profiles(id),
 body text NOT NULL CHECK (char_length(trim(body)) BETWEEN 1 AND 2000),
 created timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.votes (
 item_id text NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
 user_id text NOT NULL REFERENCES public.profiles(id),
 value text NOT NULL CHECK (value IN ('interesa','encanta','no')),
 PRIMARY KEY(item_id,user_id)
);
CREATE TABLE IF NOT EXISTS public.favorites (
 item_id text NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
 user_id text NOT NULL REFERENCES public.profiles(id),
 PRIMARY KEY(item_id,user_id)
);
CREATE TABLE IF NOT EXISTS public.trip_meta (key text PRIMARY KEY);
INSERT INTO public.profiles(id,name,color) VALUES
 ('pol','Pol','#b64136'),('monica','Mónica','#c78b48'),('leyre','Leyre','#808c68'),('joaquin','Joaquín','#647e96') ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.current_member() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT id FROM public.profiles WHERE auth_id = (SELECT auth.uid()) $$;
REVOKE ALL ON FUNCTION public.current_member() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_member() TO authenticated;

CREATE OR REPLACE FUNCTION public.validate_trip_item() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE k text; v jsonb;
BEGIN
 IF TG_OP='UPDATE' AND (NEW.id,NEW.author,NEW.type,NEW.created) IS DISTINCT FROM (OLD.id,OLD.author,OLD.type,OLD.created) THEN
  RAISE EXCEPTION 'No se puede cambiar la autoría o el tipo';
 END IF;
 IF jsonb_typeof(NEW.data) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Datos no válidos'; END IF;
 FOR k,v IN SELECT * FROM jsonb_each(NEW.data) LOOP
  IF k NOT IN ('title','url','city','category','status','date','time','notes','participants','description','family') THEN RAISE EXCEPTION 'Campo no válido: %',k; END IF;
  IF k='participants' THEN
   IF jsonb_typeof(v) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Participantes no válidos'; END IF;
   IF EXISTS (SELECT 1 FROM jsonb_array_elements_text(v) AS participant(id) WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=participant.id)) THEN RAISE EXCEPTION 'Participantes no válidos'; END IF;
  ELSIF jsonb_typeof(v) IS DISTINCT FROM 'string' OR char_length(v #>> '{}') > 5000 THEN RAISE EXCEPTION 'Texto no válido o demasiado largo';
  END IF;
 END LOOP;
 IF coalesce(char_length(trim(NEW.data->>'title')),0) NOT BETWEEN 1 AND 180 THEN RAISE EXCEPTION 'Título obligatorio (máximo 180 caracteres)'; END IF;
 IF coalesce(NEW.data->>'url','') <> '' AND (NEW.data->>'url') !~* '^https?://[^/@[:space:]]+([/?#][^[:space:]]*)?$' THEN RAISE EXCEPTION 'El enlace debe ser http o https'; END IF;
 IF NEW.type='idea' AND coalesce(NEW.data->>'url','')='' THEN RAISE EXCEPTION 'La idea necesita un enlace'; END IF;
 IF NEW.data ? 'family' AND NEW.data->>'family' NOT IN ('MF','HG','Todos') THEN RAISE EXCEPTION 'Familia no válida'; END IF;
 IF NEW.type='activity' THEN
  IF coalesce(NEW.data->>'date','') !~ '^2026-(11|12)-[0-9]{2}$' THEN RAISE EXCEPTION 'Fecha obligatoria'; END IF;
  IF (NEW.data->>'date')::date NOT BETWEEN DATE '2026-11-28' AND DATE '2026-12-15' THEN RAISE EXCEPTION 'Fecha fuera del viaje'; END IF;
  IF NEW.data->>'family'='Todos' AND NOT (((NEW.data->>'date') BETWEEN '2026-12-01' AND '2026-12-06') OR ((NEW.data->>'date') BETWEEN '2026-12-09' AND '2026-12-14')) THEN RAISE EXCEPTION 'Todos solo admite los días compartidos (1–6 y 9–14 de diciembre)'; END IF;
 END IF;
 IF coalesce(NEW.data->>'time','')<>'' AND (NEW.data->>'time') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' THEN RAISE EXCEPTION 'Hora incorrecta'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.validate_trip_item() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS validate_trip_item ON public.items;
CREATE TRIGGER validate_trip_item BEFORE INSERT OR UPDATE ON public.items FOR EACH ROW EXECUTE FUNCTION public.validate_trip_item();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_meta ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.profiles,public.items,public.comments,public.votes,public.favorites,public.trip_meta FROM anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.items TO authenticated;
GRANT SELECT,INSERT ON public.comments TO authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.votes,public.favorites TO authenticated;
DROP POLICY IF EXISTS profiles_read ON public.profiles;
CREATE POLICY profiles_read ON public.profiles FOR SELECT TO authenticated USING ((SELECT public.current_member()) IS NOT NULL);
DROP POLICY IF EXISTS items_read ON public.items;
CREATE POLICY items_read ON public.items FOR SELECT TO authenticated USING ((SELECT public.current_member()) IS NOT NULL);
DROP POLICY IF EXISTS items_insert ON public.items;
CREATE POLICY items_insert ON public.items FOR INSERT TO authenticated WITH CHECK (author=(SELECT public.current_member()));
DROP POLICY IF EXISTS items_update ON public.items;
CREATE POLICY items_update ON public.items FOR UPDATE TO authenticated USING ((SELECT public.current_member()) IS NOT NULL) WITH CHECK ((SELECT public.current_member()) IS NOT NULL);
DROP POLICY IF EXISTS items_delete ON public.items;
CREATE POLICY items_delete ON public.items FOR DELETE TO authenticated USING ((SELECT public.current_member()) IS NOT NULL);
DROP POLICY IF EXISTS comments_read ON public.comments;
CREATE POLICY comments_read ON public.comments FOR SELECT TO authenticated USING ((SELECT public.current_member()) IS NOT NULL);
DROP POLICY IF EXISTS comments_insert ON public.comments;
CREATE POLICY comments_insert ON public.comments FOR INSERT TO authenticated WITH CHECK (author=(SELECT public.current_member()));
DROP POLICY IF EXISTS votes_read ON public.votes;
CREATE POLICY votes_read ON public.votes FOR SELECT TO authenticated USING ((SELECT public.current_member()) IS NOT NULL);
DROP POLICY IF EXISTS votes_insert ON public.votes;
CREATE POLICY votes_insert ON public.votes FOR INSERT TO authenticated WITH CHECK (user_id=(SELECT public.current_member()));
DROP POLICY IF EXISTS votes_update ON public.votes;
CREATE POLICY votes_update ON public.votes FOR UPDATE TO authenticated USING (user_id=(SELECT public.current_member())) WITH CHECK (user_id=(SELECT public.current_member()));
DROP POLICY IF EXISTS votes_delete ON public.votes;
CREATE POLICY votes_delete ON public.votes FOR DELETE TO authenticated USING (user_id=(SELECT public.current_member()));
DROP POLICY IF EXISTS favorites_own ON public.favorites;
CREATE POLICY favorites_own ON public.favorites FOR ALL TO authenticated USING (user_id=(SELECT public.current_member())) WITH CHECK (user_id=(SELECT public.current_member()));

CREATE OR REPLACE FUNCTION public.edit_item(item_id text, patch jsonb) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE old_data jsonb;
BEGIN
 SELECT data INTO old_data FROM public.items WHERE id=item_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Elemento no encontrado'; END IF;
 -- The UI includes the type; it cannot be edited.
 UPDATE public.items SET data=old_data || (patch - 'type') WHERE id=item_id;
END $$;
REVOKE ALL ON FUNCTION public.edit_item(text,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.edit_item(text,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.schedule_idea(idea_id text,activity_data jsonb) RETURNS text
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE idea jsonb; new_id text;
BEGIN
 SELECT data INTO idea FROM public.items WHERE id=idea_id AND type='idea' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Idea no encontrada'; END IF;
 IF idea->>'status'='Añadida al itinerario' THEN RAISE EXCEPTION 'La idea ya está en el itinerario'; END IF;
 INSERT INTO public.items(type,data,author) VALUES('activity',activity_data,public.current_member()) RETURNING id INTO new_id;
 UPDATE public.items SET data=idea || '{"status":"Añadida al itinerario"}'::jsonb WHERE id=idea_id;
 RETURN new_id;
END $$;
REVOKE ALL ON FUNCTION public.schedule_idea(text,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.schedule_idea(text,jsonb) TO authenticated;

CREATE INDEX IF NOT EXISTS comments_item_idx ON public.comments(item_id);
CREATE INDEX IF NOT EXISTS favorites_user_idx ON public.favorites(user_id);
-- Realtime respects the same SELECT policies. Favorites remain personal.
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['profiles','items','comments','votes','favorites'] LOOP
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename=t) THEN
   EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I',t);
  END IF;
 END LOOP;
END $$;

-- New trips start with an empty itinerary; existing activities require the explicit migration.
INSERT INTO public.trip_meta(key) VALUES('seeded') ON CONFLICT DO NOTHING;
COMMIT;
