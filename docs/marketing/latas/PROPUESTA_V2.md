# Latas: propuesta v2 de los stickers (maqueta, 2026-11-02)

Dueño, 2026-11-02, con la imagen de las cinco latas y sus reversos: «Te comparto esto respecto a las bebidas, analízalo y
mejóralo». Es un **arreglo**, no un rediseño (`docs/COMO_DISENAR_ACA.md`): se queda lo aprobado (nombres en vertical,
«Cero azúcar» entre líneas, la lata transparente, «Agítala y activa la magia», el sello de la tapa y el QR).

- Maqueta: [`propuesta-v2/lamina-v2.png`](propuesta-v2/lamina-v2.png). Piezas sueltas en PDF y PNG en la misma carpeta.
- La genera `scripts/piezas/etiquetas-latas-v2.mjs`. **No reemplaza a la v1** (`etiquetas/`) hasta que el dueño elija.
- Lo que no se sabe va entre corchetes. Nada se inventa.

## Lo que cambia, y por qué

| # | qué | por qué |
|---|---|---|
| 1 | **«355 ML» en el frente, con cifras de 4 mm** | El contenido neto va en la cara principal. Para envases de 200 a 1000 ml, la cifra mide 4 mm o más (OIML R79, base de la NMP 001 de INACAL). En la v1 medía 1.5 mm. **Confirmar con INACAL o DIGESA.** |
| 2 | **El reverso pasa de 42 × 62 a 56 × 100 mm** | En 42 × 62 no entra la tabla nutricional. Al decir «cero azúcar», la tabla es obligatoria (Codex CXG 2-1985, que el Perú usa como referencia). La lata de 55 mm tiene ~173 mm de vuelta: 66 de frente más 56 de reverso deja ~25 mm libres a cada lado. |
| 3 | **Una placa crema con texto verde atrás, igual en las cinco** | Contraste del texto crema sobre la bebida: Lemon Tea 4.1 (por debajo del 4.5 que pide la letra chica), The Cool 1.8. Con la placa, las cinco pasan de 10 y se leen igual. Cuesta tinta blanca de base: hay que cotizarlo (P67). |
| 4 | **El mismo nombre en frente, reverso y tapa** (BLOOM, no THE BLOOM) | En la v1 el frente dice BLOOM y el reverso y la tapa, THE BLOOM. La app sigue con «The Bloom». **Lo decide el dueño.** |
| 5 | **Ingredientes con su nombre y su INS** | Codex CXS 1: el aditivo va con su clase y su nombre o número. «Brillo comestible» no es un nombre: va «colorantes (mica, INS 555; dióxido de titanio, INS 171)». Sucralosa: INS 955. |
| 6 | **Tabla nutricional completa**, por 100 ml y por lata | Energía, grasa total y saturada, carbohidratos, azúcares, proteína y sodio. Todo dice [lab.] hasta el análisis (P66). La v1 ya ponía «azúcares 0 g» antes del laboratorio: no se pone hasta medirlo. |
| 7 | **«Hecho en Perú»** | El Código del Consumidor (Ley 29571, art. 10) pide el país de origen. |
| 8 | **La tapa: «HECHA / VENCE / LOTE» rotulados y con año** | La v1 decía «H 24-10 · V 31-10», sin año ni la palabra «vence». |
| 9 | **El // de la marca en vez del «·»** | En el frente («REPOSADA EN FRÍO //») y en el aro de la tapa. |
| 10 | **El lema atrás: «Para los que no se conforman //»** | No aparecía en ninguna parte de la lata. |
| 11 | **Crema #F2F0EB y verde #1E3932 de la paleta** | La v1 usaba #F4EEE2, #1C2920 y un marrón #241C10 en la tapa. The Cool en verde de la marca queda en 6.0 de contraste. |

## Lo que hay que revisar antes de imprimir (sin inventar)

- **El brillo dorado** (Chai y Cold Brew Tea): su ficha dice de qué está hecho. Si trae óxido de hierro, es INS 172.
- **La lista del chai**: sale de la caja de los filtrantes (P65). Si dice «saborizante» o «aroma», se quita «Sabor 100% natural» (§17).
- **La sal**: si la fórmula final lleva la pizca de sal (§17), va en los ingredientes.
- **El octógono**: no va si el laboratorio confirma menos de 5 g de azúcar y menos de 100 mg de sodio por 100 ml (Ley 30021).
  En el Perú no hay octógono por edulcorante; ese es de México.
- **El sello de la tapa sobre el anillo**: si lo tapa, se rompe al abrir. Sirve de precinto, pero la fecha se pierde con él. Hay que ver con DIGESA si alcanza o si el lote se repite atrás.
- **El registro sanitario y quién elabora**: razón social, RUC y dirección (P65, P60).

## Opción que no se aplicó

- **CHAI, «Té negro y especias»** en vez de «Especiado y aromático». Así las cinco nombrarían su ingrediente, como las otras cuatro. El dueño eligió la frase actual el 2026-10-24.
