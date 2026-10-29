## Context

Ver `proposal.md` para la motivación. Hoy `despues/server.js` reenvía el resultado de `validateMessage`, y `despues/index.html` inserta nombre y mensaje con HTML. `despues/libs/unalib.js` intenta distinguir imágenes y videos de YouTube, pero la clasificación no usa el argumento recibido y el cliente confía en el HTML resultante. La carpeta `antes/` es la evidencia del estado inicial y no forma parte de este cambio. No se agregan dependencias.

## Goals / Non-Goals

**Goals:**

- Clasificar el mensaje en el servidor, antes de reenviarlo, para que todos los clientes reciban la misma decisión.
- Renderizar en el cliente solo tres salidas: texto, imagen o reproductor de YouTube.
- Hacer que nombre, color y mensaje sean datos, no fragmentos de HTML.
- Dejar escenarios de `specs/secure-chat-messages/spec.md` cubiertos por pruebas unitarias y, después, de integración y E2E.

**Non-Goals:**

- Modificar `antes/`.
- Aceptar archivos de video directos, otros proveedores o URLs mezcladas con texto.
- Cambiar la validación de teléfonos ni el estilo visual general del chat.
- Instalar librerías nuevas de saneamiento.

## Decisions

1. **El servidor clasifica y el cliente dibuja.** `validateMessage` devuelve un objeto con el tipo `text`, `image` o `youtube`, más el nombre y el color ya revisados. El cliente crea nodos de DOM según ese tipo. Se descarta devolver etiquetas armadas con concatenación: un atributo mal cerrado volvería a ejecutar código en cuanto el cliente use HTML. La alternativa de sanear HTML en el navegador deja la decisión de seguridad en cada cliente y no corrige el contrato actual.

2. **La URL se interpreta con el parser de URL, no con una expresión regular sola.** Para una imagen, el esquema debe ser `http` o `https`, no debe haber usuario ni contraseña en la URL, y el último segmento de la ruta debe terminar en una extensión permitida. Para YouTube, el host debe ser `youtube.com`, `www.youtube.com`, `m.youtube.com` o `youtu.be`, y el identificador debe ser exactamente 11 caracteres de letra, número, `_` o `-`. El `src` del reproductor se arma solo como `https://www.youtube.com/embed/` más ese identificador. Así `watch`, `embed` y `youtu.be` producen el mismo reproductor sin copiar la URL original dentro del HTML.

3. **Todo lo que no clasifica queda como texto.** Eso cubre texto normal, URL acompañada de palabras, `.mp4`, HTML, `javascript:` y `data:`. El cliente asigna ese valor con una API de texto, no con HTML.

4. **El color solo se aplica si es `#` seguido de 6 hexadecimales.** Cualquier otro valor usa un color por defecto. El nombre siempre se inserta como texto.

5. **Un payload ilegible no se reinyecta como HTML.** Si el mensaje no es el objeto esperado, el servidor responde con un mensaje de texto vacío o neutro, y el cliente ignora tipos desconocidos.

6. **`server.js` se mantiene como relay** mientras siga llamando a `validateMessage` y emitiendo su resultado JSON. Solo se toca si esa llamada deja de ser suficiente.

## Risks / Trade-offs

- [Una imagen permitida se carga desde cualquier host http(s)] → Se acepta para el laboratorio. El origen se asigna como URL de imagen, nunca como documento HTML.
- [El reproductor de YouTube es contenido de un tercero] → Solo entra el identificador validado; no se reutiliza la URL escrita por el usuario.
- [Las expresiones actuales prueban la variable equivocada y aceptan un id de YouTube vacío] → Se reemplaza esa clasificación. No se corrige la expresión regular en el lugar.
- [Un cliente antiguo que esperaba HTML dentro del mensaje dejaría de renderizar medios] → En este laboratorio el único cliente es `despues/index.html`, y se actualiza junto con la librería.

## Migration Plan

1. Implementar la clasificación y el renderizado solo en `despues`.
2. Ejecutar las pruebas unitarias y no abrir un pull request si fallan.
3. Añadir después las pruebas de integración y E2E previstas en `tasks.md`.
4. Para revertir, restaurar `despues/libs/unalib.js`, `despues/index.html` y `despues/test/test.js` al commit anterior. `antes/` no entra en el despliegue ni en el rollback.
