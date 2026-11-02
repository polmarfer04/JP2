-- Ejecutar UNA VEZ en Supabase > SQL Editor para vaciar el itinerario actual.
-- También elimina los comentarios, votos y favoritos asociados a esas actividades
-- mediante las claves foráneas; las ideas y sus datos se conservan.
BEGIN;
DELETE FROM public.items WHERE type = 'activity';
COMMIT;
