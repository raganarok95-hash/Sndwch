# Plan de crecimiento: del 4 de noviembre al 19 de diciembre de 2026

Dueño (2026-11-04): «Hazlo y necesito un plan de acción conforme y correcto, realista para un fuerte crecimiento y
que dejes todo conforme para hacerlo». Reúne lo que ya estaba decidido (`APERTURA.md`, `PLAN_COSTO_POR_CLIENTE.md`,
`OTRA_PUBLICIDAD.md`, `PRIMER_MES.md`, `modelo/desde_cero.py`) en un solo orden de trabajo. Las cifras en soles de
ventas y utilidad van solo en la respuesta al dueño, nunca acá.

## 0 · La verdad primero

- **Con solo contenido no alcanza.** El modelo desde cero (2026-11-02) pide **~8 clientes nuevos al día** desde la
  apertura para llegar a la meta en el mes 3. Un negocio nuevo, sin local a la calle, no saca eso solo de Instagram
  orgánico. Hacen falta **tres motores a la vez**: Instagram, la red del dueño (oficinas y embajadores) y publicidad
  pagada medida.
- **Las metas de control** (no son el camino completo, son el piso para saber si vamos bien):
  3 pedidos al día del 20 al 29-nov · 4 al día al 6-dic · 5 al día al 19-dic. La primera semana con pedidos reales
  corrige todo lo demás.
- **Lo que hoy frena:** Meta marcó la cuenta @snd__wch («Esta cuenta comercial no cumplió nuestras Políticas de
  publicidad», visto el 2026-10-08). Mientras siga marcada, **ningún anuncio sale con la cara del Instagram** y el
  Instagram no se une a la página ni a la cuenta publicitaria. El dueño no quiere anunciar con la página de Facebook
  como cara (2026-11-04: «la página de fb esta vacía y no es util»). Por eso el paso 1 es pedir la revisión.

## 1 · Los tres motores, en orden de peso

| motor | qué es | qué está listo | qué falta | se mide con |
|---|---|---|---|---|
| **A. Instagram → app** | 3 publicaciones por semana + historias + el video del día desde el 20 | Instagram publica desde el sistema (2026-11-03); feed hasta el 14-nov producido; el video del día sale solo desde el 20; respuestas de mensajes escritas (`RESPUESTAS_IG.md`) | concepto de «Ya hay día»; pegar la biografía con la fecha; preguntas frecuentes en la app | seguidores, guardados, compartidos, visitas `?src=ig-*` y pedidos |
| **B. La red del dueño** | oficinas cercanas (pedido en grupo), embajadores pagados por resultado, referidos, el QR de la bolsa | las 10 oficinas (`OFICINAS_CERCANAS.md`); aviso de embajadores en el panel; referidos y pedido en grupo en la app; sticker de la bolsa | que el dueño mande los mensajes (nada masivo sale solo) | pedidos con `group_code`, con referido, `emb-*`, `qr-bolsa` |
| **C. Publicidad pagada** | Meta con la cara de @snd__wch; Google (búsqueda y Maps); anuncios dentro de Rappi y PedidosYa | 4 anuncios de Meta armados en pausa (`PAUTA_BARATA.md`); Google listo para pegar (`OTRA_PUBLICIDAD.md`); reglas de corte (`pauta-medible`) | revisión de Meta; el sí del dueño a cada gasto | costo por cliente contra los techos del panel |

Por qué este orden: el cliente que llega por alguien que conoce cuesta menos y se queda más (Schmitt, Skiera y Van den
Bulte, *Journal of Marketing*, 2011); el pedido de oficina trae 5 o más clientes nuevos de una vez; la publicidad
escala lo que ya funciona, no lo reemplaza. No hay estudio de Trujillo sobre qué canal trae más clientes a un
delivery nuevo: el orden es una hipótesis y la corrigen los `?src=` de la primera semana.

## 2 · El calendario

### Esta semana (4 al 8 de nov): destrabar
| qué | quién | tiempo | estado |
|---|---|---|---|
| **Pedir la revisión de la marca de @snd__wch** (☰ → Estado de la cuenta; o facebook.com/accountquality con «Iniciar sesión con Instagram») | dueño | 5 min | **lo más urgente**: Meta tarda ~48 h |
| Pegar la biografía: «Abrimos el viernes 20 de noviembre, 11:00.» con `sndwch.app/?src=ig-bio` | dueño | 2 min | texto listo |
| Elegir el concepto de «Ya hay día» (A recomendado) | dueño | 1 min | tarjeta en el hilo |
| Poner las 4 preguntas frecuentes y las respuestas guardadas en la app de Instagram | dueño (o Claude en su Chrome) | 5 min | texto listo, espera su sí |
| Reclutar embajadores: elegir 10 personas (oficina o universidad) y mandarles el aviso del panel | dueño | 15 min | aviso listo |
| Si la revisión pasa: unir @snd__wch al portafolio, la página, la cuenta publicitaria y `sndwch-bot`; rehacer los 4 anuncios con su cara, **en pausa** | Claude | 1 h | preparado |

### Semana 1 (9 al 15): que te conozcan
- Feed: mar 10 Philly, jue 12 Frío o gratinado, sáb 14 Cómo se dice (listo). Historias con la fecha.
- **Oficinas:** el dueño escribe de noche a 3 de las 10 oficinas (mensaje en `§3`). Meta: 1 que diga «el 20 pedimos».
- **Google:** dejar la campaña de búsqueda creada **en pausa** (configuración en `OTRA_PUBLICIDAD.md`); se prende el 20.
- **Rappi y PedidosYa:** vitrina cargada con los precios de app (P56), para abrir juntos el 20.

### Semana 2 (16 al 22): la cuenta y el día
- Feed: mar 17 «Faltan 3 días», jue 19 «Mañana, 11:00», vie 20 10:30 «Hoy abrimos» (se fija arriba).
- **Vie 20:** el dueño pone su estado de WhatsApp a las 10:45 (`?src=wa-estado`); los embajadores reciben su enlace;
  se prenden, con su sí, Google y el anuncio de Meta que esté listo.
- Fotos reales de los primeros pedidos (con permiso): son la mejor pieza de la semana siguiente.

### Semanas 3 y 4 (23-nov al 6-dic): que vuelvan y traigan a otro
- **El almuerzo de la oficina** y **el 30CM**; **invita a alguien** (las cifras de cada premio salen del código).
- Volver a escribir a las oficinas que pidieron: proponer el **pedido fijo** semanal.
- Lunes 30: primera lectura de la publicidad con las reglas de corte. Con menos de 30 pedidos «todavía no se sabe».

### Semanas 5 y 6 (7 al 19-dic): diciembre en la oficina
- El almuerzo de fin de año (pedido en grupo con fecha), reseñas y fotos de clientes, recompra.
- Se sube lo que trajo clientes a menos del techo; lo demás se cambia o se apaga.
- **Creadores de comida de Trujillo (dueño, 2026-11-10):** «a los 3 o 4 semanas de abierto, para tener números reales que medir sin y con». Se invitan 2 o 3 entre el 11 y el 18 de diciembre, cada uno con su `?src=creador-<nombre>`, y se comparan pedidos y clientes nuevos de las dos semanas antes y después.

## 3 · Lo que queda listo para usar

**Mensaje a una oficina** (lo manda el dueño, de noche, a recepción o administración):
```
Hola, soy Ezra de SND//WCH, sándwiches armados al momento a domicilio, cerca de ustedes.
Abrimos el viernes 20 de noviembre. Si piden el almuerzo en grupo, cada uno elige lo suyo
desde su celular y quien organiza se lleva un premio:
sndwch.app/?grupo=1&src=oficina
```

**Respuestas de Instagram:** `RESPUESTAS_IG.md`. **Anuncios en pausa:** `PAUTA_BARATA.md`. **Google:**
`OTRA_PUBLICIDAD.md`. **Bolsa y sticker:** `bolsa/` e `imprimir/`. **Piezas nuevas:** `/pieza`, con maqueta en
Claude Design (skill `claude-design`).

## 4 · Mensajes automáticos de Instagram (estado al 2026-11-04)

- El token **lee la bandeja sin error**, pero no ve los mensajes de quien no es de la app: el mensaje de prueba del
  dueño desde su cuenta personal no apareció (0 conversaciones). Contestarle a cualquier cliente exige **la revisión
  de la app por Meta** (Advanced Access de mensajes), con la app en modo público y un video del contestador.
- Mientras tanto: preguntas frecuentes y respuestas guardadas en la app de Instagram (no dependen de Meta).

## 5 · Lo que necesita el sí del dueño (con recomendación)

| decisión | recomendación | por qué |
|---|---|---|
| Pedir la revisión de @snd__wch | **hoy** | sin eso no hay anuncios con la cara del Instagram |
| Gasto en publicidad desde el 20 | Google S/10 al día + Rappi S/10 al día desde que pasen bien los primeros pedidos; Meta con la cara de @snd__wch cuando pase la revisión, prueba chica con corte | Google y las apps llegan a quien ya busca comida; Meta se escala solo si el costo por cliente medido queda bajo el techo |
| Pedir la revisión de la app para mensajes automáticos | sí, después de abrir | tarda de días a semanas y no frena la apertura |
| Concepto de «Ya hay día» | A «20//11» | fecha concreta = se anota y se cumple (Gollwitzer, 1999) |

Nada de esto gasta, publica ni manda mensajes sin ese sí.
