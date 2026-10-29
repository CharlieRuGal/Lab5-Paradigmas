var assert = require('assert');
var http = require('http');
var support = require('./support');

var PORT = 41234;

function getPage(cookie) {
  return new Promise(function (resolve, reject) {
    var headers = cookie ? { Cookie: cookie } : {};
    http.get({ hostname: '127.0.0.1', port: PORT, path: '/', headers: headers }, function (res) {
      var body = '';
      res.on('data', function (chunk) { body += chunk; });
      res.on('end', function () {
        resolve({ status: res.statusCode, body: body });
      });
    }).on('error', reject);
  });
}

describe('integracion del chat', function () {
  this.timeout(15000);
  var proc;
  var cookie;

  before(function () {
    cookie = support.sessionCookieHeader();
    return support.startServer(PORT).then(function (child) {
      proc = child;
    });
  });

  after(function () {
    if (proc && !proc.killed) {
      proc.kill();
    }
  });

  it('rechaza el socket cuando no hay sesion', function () {
    return support.publish(PORT, {
      nombre: 'Ana',
      mensaje: 'hola',
      color: '#112233'
    }, { expectAuthFailure: true }).then(function (result) {
      assert.strictEqual(result.rejected, true);
    });
  });

  it('reenvia una imagen clasificada, sin HTML', function () {
    return support.publish(PORT, {
      nombre: 'No autorizado',
      mensaje: 'https://example.com/foto.jpg',
      color: '#112233'
    }, { cookie: cookie }).then(function (msg) {
      assert.strictEqual(msg.type, 'image');
      assert.strictEqual(msg.url, 'https://example.com/foto.jpg');
      assert.strictEqual(Object.prototype.hasOwnProperty.call(msg, 'videoId'), false);
      assert.strictEqual(msg.nombre, support.TEST_USER.name);
    });
  });

  it('reenvia un video de YouTube con su identificador', function () {
    return support.publish(PORT, {
      nombre: 'No autorizado',
      mensaje: 'https://youtu.be/qYwlqx-JLok',
      color: '#112233'
    }, { cookie: cookie }).then(function (msg) {
      assert.strictEqual(msg.type, 'youtube');
      assert.strictEqual(msg.videoId, 'qYwlqx-JLok');
      assert.strictEqual(msg.nombre, support.TEST_USER.name);
      assert.strictEqual(String(msg.mensaje).indexOf('<iframe'), -1);
    });
  });

  it('reenvia un script como texto', function () {
    return support.publish(PORT, {
      nombre: '<script>alert(1)</script>',
      mensaje: '<script>alert(1)</script>',
      color: 'red" onmouseover="alert(1)'
    }, { cookie: cookie }).then(function (msg) {
      assert.strictEqual(msg.type, 'text');
      assert.strictEqual(msg.mensaje, '<script>alert(1)</script>');
      assert.strictEqual(msg.nombre, support.TEST_USER.name);
      assert.strictEqual(msg.color, '#333333');
    });
  });

  it('muestra la bienvenida sin sesion y el chat con sesion', function () {
    return getPage().then(function (welcome) {
      assert.strictEqual(welcome.status, 200);
      assert.ok(welcome.body.indexOf('Continuar con Google') !== -1);
      assert.strictEqual(welcome.body.indexOf('id="messages"'), -1);
      return getPage(cookie);
    }).then(function (chat) {
      assert.strictEqual(chat.status, 200);
      assert.ok(chat.body.indexOf('id="messages"') !== -1);
      assert.ok(chat.body.indexOf('textContent') !== -1);
      assert.ok(chat.body.indexOf('https://www.youtube.com/embed/') !== -1);
      assert.strictEqual(chat.body.indexOf('.html('), -1);
      assert.strictEqual(chat.body.indexOf('innerHTML'), -1);
    });
  });

});
