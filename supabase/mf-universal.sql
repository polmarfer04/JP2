-- Ejecutar en Supabase > SQL Editor tras la actualización de familias.
-- Repetir no duplica la actividad ni sobrescribe cambios posteriores.
INSERT INTO public.items (id, type, data, author)
VALUES (
  'mf-universal-2026-11-30',
  'activity',
  '{
    "title": "Universal Studios Japan",
    "date": "2026-11-30",
    "time": "",
    "city": "Osaka",
    "family": "MF",
    "status": "Confirmada",
    "category": "Experiencias",
    "participants": ["pol", "monica", "leyre", "joaquin"],
    "notes": "Día completo en Universal Studios Japan. Entradas ya adquiridas. Atracciones y organización interna pendientes de concretar. Horario pendiente de confirmar; horas locales de Japón (Asia/Tokyo)."
  }'::jsonb,
  'pol'
)
ON CONFLICT (id) DO NOTHING;
