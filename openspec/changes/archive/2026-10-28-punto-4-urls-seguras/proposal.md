## Why

UNA Chat ya recibe texto libre y lo inserta como HTML, así que un mensaje puede ejecutar JavaScript en el navegador de quien lo ve. El punto 4 necesita que una URL de imagen o de video se vea en el chat, y que el resto del contenido siga siendo texto, sin ejecutar código introducido por el usuario.

## What Changes

- Un mensaje cuyo contenido, ya recortado, es exactamente una URL de imagen permitida se muestra como imagen.
- Un mensaje cuyo contenido, ya recortado, es exactamente una URL de YouTube permitida se muestra en un reproductor embebido.
- Los mensajes de texto, incluidos los que solo mencionan una URL o usan una URL no permitida, se muestran como texto.
- El nombre, el color y el mensaje enviados por el usuario no pueden ejecutar JavaScript ni alterar el HTML de la página.
- **BREAKING:** el cliente deja de interpretar el mensaje recibido como HTML arbitrario. El contenido visible se construye solo a partir de texto escapado o de medios previamente clasificados.

Supuestos de esta propuesta, tomados del código actual de `despues`:

- La imagen válida usa `http` o `https` y su ruta termina en `jpg`, `jpeg`, `png`, `gif` o `bmp`, sin distinguir mayúsculas. Puede llevar query o fragmento.
- El video válido es una URL de YouTube (`youtube.com` o `youtu.be`) con un identificador de 11 caracteres. Un archivo directo como `.mp4` no se trata como video en este punto.
- Una URL solo se renderiza como medio cuando el mensaje completo es esa URL. Si va acompañada de otro texto, todo el mensaje permanece como texto.

## Capabilities

### New Capabilities

- `secure-chat-messages`: clasificación visible de mensajes de texto, imágenes y videos, y rechazo de HTML o JavaScript introducido por el usuario.

### Modified Capabilities

- Ninguna. El repositorio todavía no tiene especificaciones en `openspec/specs/`.

## Impact

- Comportamiento observable de UNA Chat en `despues`: publicación y visualización de mensajes.
- Archivos de código que esta propuesta prevé modificar después, y que no se tocan en esta fase: `despues/libs/unalib.js`, `despues/index.html` y `despues/test/test.js`.
- `despues/server.js` solo se modificaría si el reenvío del mensaje deja de poder usar el resultado ya validado. La expectativa es conservarlo como punto de paso.
- `antes/` permanece intacta.
- No se agregan dependencias.
- Las pruebas unitarias, de integración y E2E quedan planificadas para la implementación. Ningún pull request debe abrirse sin las pruebas unitarias ejecutadas correctamente.
