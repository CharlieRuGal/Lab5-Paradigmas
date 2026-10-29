# Laboratorio 5 – Primera parte

## 1. TL;DR

UNA Chat, en `despues/`, clasifica cada mensaje como texto, imagen o video de YouTube antes de reenviarlo. La página muestra esos datos con elementos del documento y no inserta HTML escrito por el usuario. La carpeta `antes/` conserva la versión original y no se modificó.

En esta sesión se volvió a ejecutar la suite Mocha: 32 pruebas aprobadas, 0 fallidas. Se agregaron 3 pruebas de integración con Jest y `socket.io-client`, y 3 pruebas de extremo a extremo con Playwright. Las tres suites siguieron en verde después de actualizar las dependencias. La evidencia del XSS original se obtuvo ejecutando `antes/` sin editar sus archivos.

Snyk, ya autenticado, analizó primero 147 dependencias y encontró 54 problemas en 76 rutas, incluida una vulnerabilidad crítica en `proxy-addr@2.0.7`. Tras actualizar Express, Socket.IO y Mocha, y luego los parches transitivos que seguían dentro de sus rangos, el análisis final probó 112 dependencias y no encontró rutas vulnerables.

## 2. Arquitectura

UNA Chat tiene una página y un servidor Node.js. El formulario envía nombre, mensaje y color por Socket.IO, en el evento `Evento-Mensaje-Server`. El servidor llama a `validateMessage` en `despues/libs/unalib.js` y reenvía el resultado. No existe una ruta HTTP para publicar mensajes. La única ruta HTTP es `GET /`, que entrega `index.html`.

`antes/` es la copia inicial. Ahí el cliente inserta el mensaje con jQuery `.html()`. `despues/` es la versión de trabajo: la librería clasifica y el cliente asigna el nombre y el texto con `textContent`.

## 3. Cambios realizados

La clasificación segura y las pruebas Mocha de `despues/test/` ya estaban en el repositorio. Esta sesión agregó, sin tocar `antes/`:

- `despues/integration/chat.integration.test.js` y `despues/jest.integration.config.js`
- `despues/e2e/chat.spec.js` y `despues/playwright.config.js`
- scripts de captura en `despues/scripts/`
- reportes y JPG en `despues/evidencias-laboratorio5/`
- `repositorio.txt` en la raíz, con el enlace de `origin`

Las dependencias de prueba quedaron en `devDependencies`: Jest 29.7.0, socket.io-client 4.8.0, Playwright 1.64.1, Mochawesome y jest-html-reporters. Express quedó en 4.22.3, Socket.IO en 4.8.0 y Mocha en 12.0.0. Node.js v24.14.0 cumple el motor de Mocha 12 (`^20.19.0 || >=22.12.0`).

## 4. OpenSpec

El cambio `punto-4-urls-seguras` está archivado en `openspec/changes/archive/2026-10-28-punto-4-urls-seguras`. La especificación vigente es `openspec/specs/secure-chat-messages/spec.md`. Este trabajo no modificó ese archivo archivado ni repitió la validación de OpenSpec.

## 5. Seguridad

En `despues/`, una imagen se acepta solo si el mensaje completo es una URL `http` o `https` cuya ruta termina en `jpg`, `jpeg`, `png`, `gif` o `bmp`. Un video se acepta solo si el sitio es YouTube o `youtu.be` y el identificador tiene 11 caracteres. El reproductor se arma como `https://www.youtube.com/embed/` más ese identificador. El color solo se conserva si es `#` seguido de seis hexadecimales; si no, queda `#333333`.

En `antes/index.html`, el mensaje recibido se concatena y se inserta con `.html()`. Esa es la versión vulnerable. Al reproducirla en un navegador real, un mensaje con `onerror` ejecutó JavaScript: el navegador mostró el diálogo `XSS original` y la página dibujó un aviso rojo. El registro está en `despues/evidencias-laboratorio5/xss-original-resultado.txt`.

## 6. Pruebas

Comandos, desde `despues/`:

```text
npm test
npm run test:unit
npm run test:integration
npm run test:e2e
```

Resultados de esta sesión:

| Suite | Comando | Resultado |
| --- | --- | --- |
| Mocha, todas | `npm test` | 32 aprobadas, 0 fallidas, 1 s |
| Unitarias | `npm run test:unit` | 26 aprobadas, 0 fallidas |
| Integración Jest | `npm run test:integration` | 1 suite, 3 aprobadas, 0 fallidas |
| Playwright | `npm run test:e2e` | 3 aprobadas, 0 fallidas, 14.0 s |

Esos cuatro resultados son de la ejecución posterior a los parches de `proxy-addr`, `socket.io-parser`, `socket.io-adapter` y `engine.io`. La misma cantidad ya había pasado justo después de subir Express, Socket.IO y Mocha, antes de esos parches.

Las 26 unitarias cubren imágenes, videos de YouTube y contenido que no debe ejecutarse como script. Las 3 de Jest publican por Socket.IO una imagen, un video y un mensaje malicioso, y comprueban el objeto reenviado por el servidor real. Las 3 de Playwright abren el chat, envían una imagen, un video de YouTube y dos intentos de inyección. El listener de `dialog` se registra antes de enviar el contenido malicioso; no hubo diálogos y el texto quedó visible como texto.

Jest avisa, al final, que queda un handle abierto y el script usa `--forceExit`. Las pruebas igual terminan aprobadas y el `afterAll` cierra el cliente y el proceso del servidor.

Playwright está configurado con el proyecto `chromium`, pero el binario de Chromium de Playwright no se descargó: el instalador permaneció en 0 % y no abrió conexión. Las pruebas corrieron con el Google Chrome ya instalado en el equipo (`channel: 'chrome'`). El reporte las etiqueta como proyecto `chromium` por el nombre del proyecto, no porque se haya usado el Chromium empaquetado por Playwright.

El reporte HTML de Playwright quedó en `despues/evidencias-laboratorio5/reporte-playwright/`.

## 7. Snyk

El primer intento pidió `snyk auth`. Después de autenticar la cuenta, `npx snyk test` se ejecutó en `despues/` antes de cambiar dependencias.

Análisis inicial, código de salida 1:

- 147 dependencias.
- 54 problemas.
- 76 rutas vulnerables.
- Por problema: 1 crítico, 30 altos, 17 medios y 6 bajos.
- Por ruta: 1 crítica, 45 altas, 22 medias y 8 bajas.
- La crítica era suplantación de usuario en `proxy-addr@2.0.7`, introducida por Express 4.18.2.
- Snyk recomendó Express 4.22.3, Socket.IO 4.8.0 y Mocha 12.0.0.

Esas tres versiones quedaron fijadas en `despues/package.json`. El cliente de pruebas `socket.io-client` pasó a 4.8.0 para coincidir con el servidor. No se usó `npm audit fix --force`.

El segundo análisis, todavía con las dependencias transitivas antiguas, probó 113 dependencias y encontró 6 problemas, uno por ruta:

| Gravedad | Cantidad | Paquete |
| --- | --- | --- |
| Crítica | 1 | `proxy-addr@2.0.7` |
| Alta | 4 | `socket.io-parser@4.2.4` (2) y `ws@8.11.0` (2) |
| Media | 1 | `ws@8.11.0` |
| Baja | 0 | — |

Express 4.22.3 admite `proxy-addr` `~2.0.7`, así que 2.0.8 entra en ese rango. Socket.IO 4.8.0 admite `socket.io-parser` `~4.2.4`, `socket.io-adapter` `~2.5.2` y `engine.io` `~6.6.0`. Con `overrides` se instalaron las últimas versiones de esos rangos: `proxy-addr@2.0.8`, `socket.io-parser@4.2.7`, `socket.io-adapter@2.5.8` y `engine.io@6.6.11`. Esas dos últimas trajeron `ws@8.21.3`, que cubre las correcciones que Snyk pedía para `ws` (8.17.1, 8.20.1 y 8.21.0).

El análisis final terminó con código 0:

- 112 dependencias.
- 0 problemas.
- 0 rutas vulnerables.
- El JSON de Snyk marca `ok: true`.

`npm audit`, que usa otra base de avisos, todavía lista 9 hallazgos (6 bajos y 3 altos) en `brace-expansion`, `minimatch`, `picomatch` y `deepmerge` a través de Jest. Snyk no los reportó en el análisis final. No se aplicó `npm audit fix --force`: esa vía bajaría Jest a 25.1.0. Esos 9 avisos no están cerrados por Snyk porque Snyk no los señaló; siguen pendientes solo en `npm audit`.

Los reportes están en `evidencias-laboratorio5/snyk-inicial.json`, `snyk-despues-actualizacion.json` y `snyk-final.json`.

## 8. Evidencias generadas

En `despues/evidencias-laboratorio5/`:

- `evidencia-01-xss-original.jpg`: captura del chat original con el aviso producido por el script ejecutado.
- `evidencia-02-pruebas-unitarias.jpg`: reporte Mochawesome, 26 pruebas y 0 fallos.
- `evidencia-03-pruebas-integracion.jpg`: reporte de Jest, 3 pruebas y 0 fallos.
- `evidencia-04-playwright-e2e.jpg`: reporte de Playwright, 3 aprobadas y 0 fallos.
- `evidencia-05-snyk-inicial.jpg`: reporte de Snyk con 54 problemas, 76 rutas y 147 dependencias.
- `evidencia-06-snyk-final.jpg`: reporte final de Snyk con 0 problemas, 0 rutas y 112 dependencias.
- `reporte-playwright/`: reporte HTML de Playwright.
- `reports/unitarias/`, `reports/integracion/` y `reports/snyk/`: reportes HTML de las suites y de Snyk.
- `logs/`: salida de Mocha, Jest, Playwright y de los tres análisis de Snyk.
- `xss-original-resultado.txt`: diálogo `XSS original` registrado por Playwright.

## 9. Pendientes

- `npm audit` sigue mostrando 9 avisos que el análisis final de Snyk no incluye. Cerrar el de `deepmerge` exigiría bajar Jest de versión mayor.
- Descargar el Chromium de Playwright cuando la red lo permita (`npx playwright install chromium`) y quitar `channel: 'chrome'` si la guía exige ese binario.
- El aviso de handle abierto de Jest.
- La segunda parte del laboratorio no está hecha.
- No se hizo commit ni push.
