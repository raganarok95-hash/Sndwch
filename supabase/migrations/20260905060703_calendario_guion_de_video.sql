-- El calendario de marketing ya sabía guardar un VIDEO (media_type='video', video_url) y
-- publicarlo solo a IG/FB, pero no dónde guardar QUÉ grabar: el único campo creativo era
-- photo_idea. O sea que la parte que cuesta trabajo —decidir el plano— solo estaba resuelta
-- para el formato que la pauta no usa.
--
-- Nullable a propósito: las entradas que el dueño ya planeó a mano y las semanas de foto
-- pura no tienen guion, y un default vacío se leería como "no hay nada que grabar" en vez
-- de "esta entrada no es de video".
alter table marketing_calendar add column if not exists video_idea text;

comment on column marketing_calendar.video_idea is
  'Guion rodable del video (formato A..E de FLUJO_VIDEO_ANUNCIOS.md, duración y tramos). Lo llena marketingContent() al generar borradores; editable desde el panel. Null = esta entrada no es de video.';
