# UNA Chat

Chat local con inicio de sesión de Google a través de Auth0.

## Configurar

1. En Auth0, abre la Regular Web Application y confirma que la conexión `google-oauth2` está habilitada.
2. En la aplicación, guarda estas URLs:
   - Allowed Callback URLs: `http://localhost:3000/callback`
   - Allowed Logout URLs: `http://localhost:3000`
   - Allowed Web Origins: `http://localhost:3000`
3. Copia `.env.example` a `.env` en esta carpeta.
4. Completa `CLIENT_ID`, `ISSUER_BASE_URL` y `SECRET`. `SECRET` es una cadena aleatoria de al menos 32 bytes. No la subas al repositorio.

## Ejecutar

```bash
npm install
npm start
```

Abre `http://localhost:3000`.

## Probar el inicio de sesión

1. El navegador debe ir a Google. Si cancelas o Auth0 devuelve un error, aparece un mensaje con el enlace para intentarlo otra vez.
2. Al volver, la barra muestra tu nombre y el enlace **Cerrar sesión**.
3. Envía un mensaje. El nombre que ven los demás es el de la sesión, no un texto escrito en la página.
4. Cierra la sesión. La página del chat deja de estar disponible y el socket ya no puede publicar.
5. `npm test` ejecuta las pruebas de `libs/unalib.js`. No cubre el login.
