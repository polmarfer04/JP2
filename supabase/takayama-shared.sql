-- Ejecutar tras families.sql si ya se había aplicado la versión anterior.
-- Permite planes compartidos el 7 de diciembre y mantiene el 8 separado.
BEGIN;
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
  IF NEW.data->>'family'='Todos' AND NOT (((NEW.data->>'date') BETWEEN '2026-12-01' AND '2026-12-07') OR ((NEW.data->>'date') BETWEEN '2026-12-09' AND '2026-12-14')) THEN RAISE EXCEPTION 'Todos solo admite los días compartidos (1–7 y 9–14 de diciembre)'; END IF;
 END IF;
 IF coalesce(NEW.data->>'time','')<>'' AND (NEW.data->>'time') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' THEN RAISE EXCEPTION 'Hora incorrecta'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.validate_trip_item() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS validate_trip_item ON public.items;
CREATE TRIGGER validate_trip_item BEFORE INSERT OR UPDATE ON public.items FOR EACH ROW EXECUTE FUNCTION public.validate_trip_item();

COMMIT;
