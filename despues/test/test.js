var val = require('../libs/unalib');
var assert = require('assert');

function published(mensaje, extra) {
  var payload = {
    nombre: 'Ana',
    mensaje: mensaje,
    color: '#112233'
  };
  if (extra) {
    Object.keys(extra).forEach(function (key) {
      payload[key] = extra[key];
    });
  }
  return JSON.parse(val.validateMessage(JSON.stringify(payload)));
}

describe('unalib', function () {

  describe('funcion is_valid_phone', function () {

    it('deberia devolver true para 8297-8547', function () {
      assert.equal(val.is_valid_phone('8297-8547'), true);
    });

    it('deberia devolver false para 8297p-8547', function () {
      assert.equal(val.is_valid_phone('8297p-8547'), false);
    });

  });

  describe('funcion is_valid_url_image', function () {

    it('deberia devolver true para http://image.com/image.jpg', function () {
      assert.equal(val.is_valid_url_image('http://image.com/image.jpg'), true);
    });

    it('deberia devolver true para http://image.com/image.gif', function () {
      assert.equal(val.is_valid_url_image('http://image.com/image.gif'), true);
    });

  });

  describe('funcion is_valid_yt_video', function () {

    it('deberia devolver true para http://image.com/image.jpg', function () {
      assert.equal(val.is_valid_yt_video('https://www.youtube.com/watch?v=qYwlqx-JLok'), true);
    });

  });

  describe('imagen valida', function () {

    it('muestra jpg con https', function () {
      var msg = published('https://example.com/foto.jpg');
      assert.strictEqual(msg.type, 'image');
      assert.strictEqual(msg.url, 'https://example.com/foto.jpg');
    });

    it('muestra gif con http', function () {
      var msg = published('http://example.com/animacion.gif');
      assert.strictEqual(msg.type, 'image');
      assert.strictEqual(msg.url, 'http://example.com/animacion.gif');
    });

    it('acepta la extension en mayusculas', function () {
      var msg = published('https://example.com/foto.PNG');
      assert.strictEqual(msg.type, 'image');
      assert.strictEqual(msg.url, 'https://example.com/foto.PNG');
    });

    it('acepta jpeg y bmp', function () {
      assert.strictEqual(published('https://example.com/foto.jpeg').type, 'image');
      assert.strictEqual(published('https://example.com/foto.bmp').type, 'image');
    });

    it('acepta una imagen con query', function () {
      var msg = published('https://example.com/foto.jpg?size=large');
      assert.strictEqual(msg.type, 'image');
      assert.strictEqual(msg.url, 'https://example.com/foto.jpg?size=large');
    });

  });

  describe('video de YouTube', function () {

    it('acepta watch y devuelve el identificador', function () {
      var msg = published('https://www.youtube.com/watch?v=qYwlqx-JLok');
      assert.strictEqual(msg.type, 'youtube');
      assert.strictEqual(msg.videoId, 'qYwlqx-JLok');
    });

    it('acepta youtu.be', function () {
      var msg = published('https://youtu.be/qYwlqx-JLok');
      assert.strictEqual(msg.type, 'youtube');
      assert.strictEqual(msg.videoId, 'qYwlqx-JLok');
    });

    it('acepta embed', function () {
      var msg = published('https://www.youtube.com/embed/qYwlqx-JLok');
      assert.strictEqual(msg.type, 'youtube');
      assert.strictEqual(msg.videoId, 'qYwlqx-JLok');
    });

  });

  describe('mensaje normal', function () {

    it('conserva un saludo como texto', function () {
      var text = 'Hola, este es un mensaje normal';
      var msg = published(text);
      assert.strictEqual(msg.type, 'text');
      assert.strictEqual(msg.mensaje, text);
    });

    it('conserva el texto cuando la URL va acompanada de palabras', function () {
      var text = 'mira esta foto https://example.com/foto.jpg';
      var msg = published(text);
      assert.strictEqual(msg.type, 'text');
      assert.strictEqual(msg.mensaje, text);
    });

  });

  describe('URL no permitida', function () {

    it('deja una pagina html como texto', function () {
      var text = 'https://example.com/pagina.html';
      var msg = published(text);
      assert.strictEqual(msg.type, 'text');
      assert.strictEqual(msg.mensaje, text);
    });

    it('deja javascript: como texto', function () {
      var text = 'javascript:alert(1)';
      var msg = published(text);
      assert.strictEqual(msg.type, 'text');
      assert.strictEqual(msg.mensaje, text);
    });

    it('deja data: como texto', function () {
      var text = 'data:text/html,<script>alert(1)</script>';
      var msg = published(text);
      assert.strictEqual(msg.type, 'text');
      assert.strictEqual(msg.mensaje, text);
    });

    it('deja un mp4 como texto', function () {
      var text = 'https://example.com/clip.mp4';
      var msg = published(text);
      assert.strictEqual(msg.type, 'text');
      assert.strictEqual(msg.mensaje, text);
    });

    it('deja un YouTube sin identificador como texto', function () {
      var text = 'https://www.youtube.com/watch?v=';
      var msg = published(text);
      assert.strictEqual(msg.type, 'text');
      assert.strictEqual(msg.mensaje, text);
    });

  });

  describe('contenido que no ejecuta JavaScript', function () {

    it('conserva una etiqueta script como texto', function () {
      var text = '<script>alert(1)</script>';
      var msg = published(text);
      assert.strictEqual(msg.type, 'text');
      assert.strictEqual(msg.mensaje, text);
    });

    it('conserva un controlador de evento como texto', function () {
      var text = '<img src=x onerror=alert(1)>';
      var msg = published(text);
      assert.strictEqual(msg.type, 'text');
      assert.strictEqual(msg.mensaje, text);
    });

    it('conserva el nombre como dato', function () {
      var msg = published('hola', { nombre: '<script>alert(1)</script>' });
      assert.strictEqual(msg.nombre, '<script>alert(1)</script>');
      assert.strictEqual(msg.type, 'text');
      assert.strictEqual(msg.mensaje, 'hola');
    });

    it('no convierte en imagen una URL que cierra un atributo', function () {
      var text = 'https://example.com/foto.jpg" onerror="alert(1)';
      var msg = published(text);
      assert.strictEqual(msg.type, 'text');
      assert.strictEqual(msg.mensaje, text);
    });

    it('reemplaza un color con marcado', function () {
      var msg = published('hola', { color: 'red" onmouseover="alert(1)' });
      assert.strictEqual(msg.color, '#333333');
      assert.strictEqual(msg.mensaje, 'hola');
    });

    it('neutraliza un payload que no es el mensaje esperado', function () {
      var msg = JSON.parse(val.validateMessage('<script>alert(1)</script>'));
      assert.strictEqual(msg.type, 'text');
      assert.strictEqual(msg.mensaje, '');
      assert.strictEqual(msg.nombre, '');
    });

  });

});
