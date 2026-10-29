# secure-chat-messages Specification

## Purpose
Define cómo UNA Chat muestra texto, imágenes y videos de YouTube, y cómo impide que el contenido enviado por un usuario ejecute JavaScript en el navegador de quienes leen el chat.
## Requirements
### Requirement: Imagen valida se muestra como imagen
El sistema MUST mostrar como imagen un mensaje cuyo texto, sin espacios al inicio o al final, es exactamente una URL `http` o `https` cuya ruta termina en `jpg`, `jpeg`, `png`, `gif` o `bmp`, sin distinguir mayúsculas. Una query o un fragmento no cambian esa clasificación. La imagen mostrada MUST usar esa URL como origen y MUST NOT interpretar el resto del mensaje como HTML.

#### Scenario: Imagen jpg con https
- **GIVEN** un participante envía como mensaje completo `https://example.com/foto.jpg`
- **WHEN** el mensaje se publica en el chat
- **THEN** los demás participantes ven la imagen de esa URL y no ven la URL como único texto plano

#### Scenario: Imagen gif con http
- **GIVEN** un participante envía como mensaje completo `http://example.com/animacion.gif`
- **WHEN** el mensaje se publica en el chat
- **THEN** los demás participantes ven la imagen gif de esa URL

#### Scenario: Extension de imagen en mayusculas
- **GIVEN** un participante envía como mensaje completo `https://example.com/foto.PNG`
- **WHEN** el mensaje se publica en el chat
- **THEN** los demás participantes ven la imagen de esa URL

#### Scenario: Imagen jpeg o bmp
- **GIVEN** un participante envía como mensaje completo `https://example.com/foto.jpeg` o `https://example.com/foto.bmp`
- **WHEN** el mensaje se publica en el chat
- **THEN** los demás participantes ven la imagen correspondiente

#### Scenario: Imagen con query
- **GIVEN** un participante envía como mensaje completo `https://example.com/foto.jpg?size=large`
- **WHEN** el mensaje se publica en el chat
- **THEN** los demás participantes ven la imagen y la query no se ejecuta como código

### Requirement: Video de YouTube se muestra en un reproductor
El sistema MUST mostrar un reproductor embebido cuando el mensaje, sin espacios al inicio o al final, es exactamente una URL `http` o `https` de `youtube.com` o `youtu.be` que identifica un video de 11 caracteres. El reproductor MUST construirse solo con ese identificador. Formatos aceptados: `watch?v=`, `embed/` y la ruta corta de `youtu.be`.

#### Scenario: Video watch de YouTube
- **GIVEN** un participante envía como mensaje completo `https://www.youtube.com/watch?v=qYwlqx-JLok`
- **WHEN** el mensaje se publica en el chat
- **THEN** los demás participantes ven un reproductor de ese video y no una página HTML arbitraria

#### Scenario: Video corto de youtu.be
- **GIVEN** un participante envía como mensaje completo `https://youtu.be/qYwlqx-JLok`
- **WHEN** el mensaje se publica en el chat
- **THEN** los demás participantes ven el reproductor del mismo video

#### Scenario: Video embed de YouTube
- **GIVEN** un participante envía como mensaje completo `https://www.youtube.com/embed/qYwlqx-JLok`
- **WHEN** el mensaje se publica en el chat
- **THEN** los demás participantes ven el reproductor de ese video

### Requirement: Mensaje normal permanece como texto
El sistema MUST mostrar como texto literal cualquier mensaje que no sea exactamente una URL de imagen o de video permitida. Ese texto MUST conservar el contenido visible enviado por el usuario y MUST NOT ejecutarse como HTML o JavaScript.

#### Scenario: Saludo de texto
- **GIVEN** un participante envía `Hola, este es un mensaje normal`
- **WHEN** el mensaje se publica en el chat
- **THEN** los demás participantes ven exactamente ese texto

#### Scenario: Texto que menciona una URL de imagen
- **GIVEN** un participante envía `mira esta foto https://example.com/foto.jpg`
- **WHEN** el mensaje se publica en el chat
- **THEN** los demás participantes ven la frase completa como texto y no una imagen embebida

### Requirement: URL no permitida no se convierte en medio activo
El sistema MUST tratar como texto, y MUST NOT cargar como documento, imagen, video o script, una URL que no cumpla las reglas de imagen o de YouTube. Esto incluye otros esquemas, otras extensiones y direcciones que no identifican un video de YouTube.

#### Scenario: Pagina html
- **GIVEN** un participante envía como mensaje completo `https://example.com/pagina.html`
- **WHEN** el mensaje se publica en el chat
- **THEN** los demás participantes ven esa URL como texto y el chat no carga la página

#### Scenario: Esquema javascript
- **GIVEN** un participante envía como mensaje completo `javascript:alert(1)`
- **WHEN** el mensaje se publica en el chat
- **THEN** el navegador no ejecuta JavaScript y el valor se muestra como texto o se rechaza sin efecto

#### Scenario: Esquema data
- **GIVEN** un participante envía como mensaje completo `data:text/html,<script>alert(1)</script>`
- **WHEN** el mensaje se publica en el chat
- **THEN** el navegador no ejecuta ese contenido y no lo interpreta como documento

#### Scenario: Archivo de video directo
- **GIVEN** un participante envía como mensaje completo `https://example.com/clip.mp4`
- **WHEN** el mensaje se publica en el chat
- **THEN** los demás participantes ven la URL como texto y no aparece un reproductor

#### Scenario: YouTube sin identificador
- **GIVEN** un participante envía como mensaje completo `https://www.youtube.com/watch?v=`
- **WHEN** el mensaje se publica en el chat
- **THEN** no aparece un reproductor y el valor se muestra como texto

### Requirement: El contenido del usuario no ejecuta JavaScript
El sistema MUST mostrar nombre, color y mensaje sin ejecutar JavaScript ni insertar marcado controlado por el usuario. Un intento de cerrar atributos, inyectar etiquetas o usar controladores de eventos MUST quedar neutralizado en nombre, mensaje y color.

#### Scenario: Etiqueta script en el mensaje
- **GIVEN** un participante envía `<script>alert(1)</script>`
- **WHEN** el mensaje se publica en el chat
- **THEN** no se ejecuta ningún script y los demás participantes ven el contenido como texto literal

#### Scenario: Controlador de evento en el mensaje
- **GIVEN** un participante envía `<img src=x onerror=alert(1)>`
- **WHEN** el mensaje se publica en el chat
- **THEN** no se ejecuta ningún script y el contenido se muestra como texto literal

#### Scenario: Etiqueta script en el nombre
- **GIVEN** un participante usa el nombre `<script>alert(1)</script>` y envía `hola`
- **WHEN** el mensaje se publica en el chat
- **THEN** el nombre se ve como texto y no se ejecuta ningún script

#### Scenario: URL de imagen que intenta cerrar un atributo
- **GIVEN** un participante envía `https://example.com/foto.jpg" onerror="alert(1)`
- **WHEN** el mensaje se publica en el chat
- **THEN** no se ejecuta ningún script y el valor no se convierte en una imagen con un controlador de evento

#### Scenario: Color con marcado
- **GIVEN** un participante envía un mensaje con el color `red" onmouseover="alert(1)`
- **WHEN** el mensaje se publica en el chat
- **THEN** no se ejecuta ningún script al mostrar el nombre o el mensaje

#### Scenario: Payload que no es el mensaje esperado
- **GIVEN** el chat recibe un payload que no es el objeto de mensaje esperado
- **WHEN** ese payload se procesa
- **THEN** no se interpreta como HTML y no ejecuta JavaScript

