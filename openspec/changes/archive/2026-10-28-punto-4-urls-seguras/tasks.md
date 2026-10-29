## 1. Clasificacion segura en despues

- [x] 1.1 Hacer que `despues/libs/unalib.js` clasifique el mensaje completo como `text`, `image` o `youtube`, usando el parser de URL descrito en `design.md`
- [x] 1.2 Aceptar imágenes `http`/`https` con ruta terminada en `jpg`, `jpeg`, `png`, `gif` o `bmp`, con query o fragmento opcionales
- [x] 1.3 Aceptar YouTube `watch`, `embed` y `youtu.be` solo cuando el identificador tenga 11 caracteres, y devolver ese identificador en vez de HTML
- [x] 1.4 Dejar como texto los mensajes normales, las URL no permitidas y los intentos de script, evento o esquema `javascript:`/`data:`
- [x] 1.5 Revisar nombre y color: el nombre queda como texto y el color solo se conserva si es `#` más 6 hexadecimales
- [x] 1.6 Confirmar que `despues/server.js` reenvía el objeto clasificado sin volver a construir HTML

## 2. Pruebas unitarias

- [x] 2.1 Cubrir en `despues/test/test.js` los escenarios de imagen, video, texto, URL no permitida y XSS que pueden afirmarse sin navegador
- [x] 2.2 Ejecutar `npm test` en `despues` y dejar la suite en verde antes de cualquier pull request

## 3. Renderizado en el cliente

- [x] 3.1 Cambiar `despues/index.html` para crear nodos de texto, imagen o reproductor según el tipo recibido, sin insertar HTML arbitrario
- [x] 3.2 Construir el reproductor solo con `https://www.youtube.com/embed/` y el identificador ya validado
- [x] 3.3 Mostrar el nombre como texto y aplicar el color solo cuando sea un hex válido

## 4. Pruebas de integración y E2E

- [x] 4.1 Agregar una prueba de integración que publique un mensaje por el socket y compruebe el objeto reenviado por el servidor
- [x] 4.2 Agregar una prueba E2E que abra el chat y verifique imagen, video, texto y un intento de script que no se ejecuta
- [x] 4.3 Verificar que `antes/` no tiene cambios antes de cerrar la implementación
