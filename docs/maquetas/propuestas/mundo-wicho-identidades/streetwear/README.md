# «Arma el tuyo» en lenguaje streetwear (elegido por el dueño, 2026-10-25)

Dueño: «Imagina que no existe nada de la parte de WICHO: solo tienes el concepto y las
funcionalidades». Para su mundo **se descarta todo el sistema visual actual, incluido el `//`**.
De tres lenguajes nuevos (juego, streetwear y juguete 3D) eligió el **2 · Streetwear**.

- **Look:** negro `#0B0B0B`, blanco hueso `#F2F0EB` y rojo `#FF3B1F`. Letra Barlow Condensed
  cursiva 900 para todo lo grande y Barlow para lo chico. Esquinas rectas.
- **Concepto:** «empieza con todo». La foto real a sangre y «CON TODO.» enorme.
- **Cómo funciona:**
  - las proteínas son pestañas, y cada una cambia la foto y el precio;
  - **el pan va siempre** (dueño, 2026-10-25: «No se debería pedir sin pan»): se elige Classic o
    Focaccia (+S/0.50), nunca se quita;
  - «Lo que lleva» se tacha con una raya roja al tocarlo;
  - «Agrégale» lo suma; lo picante viene aparte y avisa «pica»;
  - las salsas, hasta 3 incluidas;
  - la doble proteína va con su interruptor;
  - siguen «¿Son varios?», «¿Ya resuelto?» (la estrella de SANDO) y el secreto.
- **El pie:** el tamaño, como «15 / 30» con el elegido relleno, y «Lo quiero» con el total vivo.

`calle.template.html` es el prototipo: las fuentes y las fotos se le meten adentro para que
funcione solo en el celular. **Las fotos son de ejemplo**: van las «con todo» de cada proteína
(`../empieza-con-todo/FOTOS.md`). **Falta su aprobación antes de tocar la app.**

## Con los colores de WICHO (2026-10-25)

Dueño: «Conserva la idea. Ahora mezcla esa idea con una abstracción de los colores de wicho».
La estructura, la letra y el concepto quedan iguales; el rojo y el negro se van y entra WICHO
reducido a sus colores, muestreados de `img/wicho.png`: pelaje celeste `#90CCF0`, máscara durazno
`#F0D8CC`, polo gris-azul, tinta `#1E2F3A` y ojos lila `#C3A6D2` sobre `#4A3D62`.

- **Noche:** su tinta de fondo, el celeste es la acción y el punto de «CON TODO.» es lila, como su ojo.
- **Pelaje:** todo celeste, tinta para leer y lila oscuro para actuar.
- **Bloques:** de arriba abajo se recorre a WICHO: pelo (proteína y pan), máscara (lo que lleva),
  ojos (agrégale), polo (lo demás).
- **En los tres:**
  - **La tira** sobre el botón es WICHO en la proporción en que ocupa cada color de su dibujo
    (27 % celeste, 30 % durazno, 18 % polo, 17 % tinta y 8 % lila).
  - **La foto termina en seco:** ningún color pasa por encima de la comida (regla de
    `docs/LOS_DOS_HERMANOS.md`).

`calle-wicho.template.html` trae arriba una barra de prueba para cambiar de combinación en el
celular; esa barra no va a la app. Comparación: `los-tres-colorways.jpg`. **Falta que el dueño
elija una antes de tocar la app.**

## Elegido: Noche, mejorado (2026-10-25)

Dueño: «Me gusta el noche, pero sí deberías tocar para agregar». `calle-noche.template.html`:

- «Agrégale» dice **«tócalo para agregarlo»**; la cuenta de salsas baja a una nota.
- **Lo agregado entra a «Lo que lleva»** en celeste: una sola lista es el sándwich entero; se
  quita tocándolo ahí mismo.
- **La raya de tachar se dibuja** al tocar, y cada ingrediente mide 40 px de alto.
- La nota resume: «Sin cheddar. Le sumaste jalapeño».
- Tamaños de letra en la escala del sistema (22 y 28), salvo «CON TODO.» a 112.
- **Sin Embutido**: en la carta es `soloEnSignature`, no se arma (error de las versiones anteriores).
