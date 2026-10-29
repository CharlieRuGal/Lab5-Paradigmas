var { test, expect } = require('@playwright/test');
var support = require('../test/support');

var IMAGE_URL = 'https://upload.wikimedia.org/wikipedia/commons/3/3f/JPEG_example_flower.jpg';
var VIDEO_URL = 'https://www.youtube.com/watch?v=qYwlqx-JLok';
var VIDEO_ID = 'qYwlqx-JLok';

async function openChat(page) {
  await page.context().addCookies([{
    name: 'appSession',
    value: support.sessionCookieValue(),
    url: 'http://127.0.0.1:4173',
    httpOnly: true,
    sameSite: 'Lax'
  }]);
  await page.goto('/');
}

async function sendMessage(page, mensaje) {
  await page.locator('#m').fill(mensaje);
  await page.getByRole('button', { name: 'Enviar' }).click();
}

test('muestra la bienvenida cuando no hay sesion', async function ({ page }) {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Continuar con Google' })).toBeVisible();
  await expect(page.locator('#messages')).toHaveCount(0);
});

test('muestra una imagen cuando el mensaje es una URL valida', async function ({ page }) {
  await openChat(page);
  await sendMessage(page, IMAGE_URL);

  var img = page.locator('#messages img[alt="Imagen compartida"]');
  await expect(img).toBeVisible();
  await expect(img).toHaveAttribute('src', IMAGE_URL);
  await expect.poll(function () {
    return img.evaluate(function (el) { return el.naturalWidth; });
  }, { timeout: 15000 }).toBeGreaterThan(0);
  await expect(page.locator('#usuario')).toHaveText(support.TEST_USER.name);
});

test('muestra el reproductor cuando el mensaje es un video de YouTube', async function ({ page }) {
  await openChat(page);
  await sendMessage(page, VIDEO_URL);

  var frame = page.locator('#messages iframe[title="Video de YouTube"]');
  await expect(frame).toBeVisible();
  await expect(frame).toHaveAttribute('src', 'https://www.youtube.com/embed/' + VIDEO_ID);
  await expect(page.locator('#messages')).not.toContainText(VIDEO_URL);
});

test('no ejecuta JavaScript cuando el mensaje intenta inyectar un script', async function ({ page }) {
  var dialogs = [];
  page.on('dialog', function (dialog) {
    dialogs.push(dialog.message());
    return dialog.dismiss();
  });

  await openChat(page);
  await sendMessage(page, '<script>alert("xss")</script>');
  await expect(page.locator('#messages li').last()).toContainText('<script>alert("xss")</script>');

  await sendMessage(page, '<img src=x onerror=alert(1)>');
  await expect(page.locator('#messages li').last()).toContainText('<img src=x onerror=alert(1)>');

  await page.waitForTimeout(1000);
  expect(dialogs).toEqual([]);
  await expect(page.locator('#messages img')).toHaveCount(0);
  await expect(page.locator('#messages iframe')).toHaveCount(0);
});
