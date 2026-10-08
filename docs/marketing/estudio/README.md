# El Estudio: cómo le encarga la agencia una imagen a Flow (2026-10-08)

Dueño: «Ese equipo es el que debe llamar a Flow para el proceso». La agencia (`../AGENCIA.md` §5)
deja **encargos** aquí. Tu laptop los cumple sola con el MCP de Flow, a las 7:30 y a las 19:30
(`scripts/estudio/LIBRETO.md`, instalación en `INSTALAR.md`), y sube el resultado a la rama `estudio`.

```
docs/marketing/estudio/
  encargos/<id>.md        ← lo escribe Creatividad
  hecho/<id>/v1.png …     ← lo escribe el Estudio (tu laptop, rama estudio → main)
  hecho/<id>/estado.json  ← {"estado":"listo"|"fallo","motivo":…,"creditos":0,"hecho":"<fecha>"}
```

Un encargo está **pendiente** mientras no exista su `hecho/<id>/estado.json`. Para repetir uno,
se borra su carpeta en `hecho/` o se escribe uno nuevo con otro `id`.

## El formato de un encargo

```markdown
---
id: 2026-10-13-puerta-1          # = nombre del archivo, sin .md
pieza: historia «La puerta», cuadro 1
tipo: imagen                      # imagen | video
formato: "9:16"                   # 9:16 historia o reel · 4:5 feed · 1:1
personajes: [WICHO]               # los personajes YA creados en Flow; [] si no sale ninguno
variantes: 2                      # cuántas versiones bajar (para elegir)
creditos_max: 0                   # imagen = 0. Video: lo que se autorice, dentro de los 50 gratis del día
---
La escena, en inglés, SIN describir a los personajes (Flow ya los conoce):
qué pasa, dónde, la luz, el encuadre. Termina con el bloque fijo de abajo.
```

**El bloque fijo** (va al final de cada escena):

```
No text, no letters, no logos, no watermark. Leave the top 25% and the bottom 20% calm
(text and stickers go there). Any sandwich shown is a long sub roll with exactly the real
recipe stated in this order; real portion, never overfilled.
```

## Las reglas que Creatividad cumple al encargar

- **Los personajes se eligen en Flow, no se describen** (dueño, 2026-10-07). Un hermano por
  referencia; nunca los dos fusionados.
- **La gramática de cámara** (`UNIVERSO_SNDWCH.md` §4): SANDO quieto y la cámara se mueve;
  WICHO se mueve y la cámara no. Ninguno habla.
- **El sándwich, fiel a la receta y a la porción** de `_shared/carta.ts` (INDECOPI).
- **Sin texto en la imagen**: el texto, el precio y la marca los pone el código después, con las
  fuentes de la marca y los datos vivos.
- Un encargo de **video** solo con `creditos_max` > 0, y la suma del día no pasa de 50.
