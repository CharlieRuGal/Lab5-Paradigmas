var assert = require('assert');
var http = require('http');
var support = require('./support');

var PORT = 41235;

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

describe('e2e del chat', function () {
  this.timeout(20000);
  var proc;
  var welcome;
  var chat;
  var cookie;

  before(function () {
    cookie = support.sessionCookieHeader();
    return support.startServer(PORT).then(function (child) {
      proc = child;
      return getPage();
    }).then(function (result) {
      welcome = result;
      return getPage(cookie);
    }).then(function (result) {
      chat = result;
    });
  });

  after(function () {
    if (proc && !proc.killed) {
      proc.kill();
    }
  });

  it('muestra la bienvenida sin sesion', function () {
    assert.strictEqual(welcome.status, 200);
    assert.ok(welcome.body.indexOf('Continuar con Google') !== -1);
    assert.ok(welcome.body.indexOf('href="/login"') !== -1);
    assert.strictEqual(welcome.body.indexOf('id="messages"'), -1);
  });

  it('abre la pagina del chat sin insertar HTML arbitrario', function () {
    assert.strictEqual(chat.status, 200);
    assert.ok(chat.body.indexOf('id="messages"') !== -1);
    assert.ok(chat.body.indexOf('id="m"') !== -1);
    assert.ok(chat.body.indexOf('createElement') !== -1);
    assert.ok(chat.body.indexOf('https://www.youtube.com/embed/') !== -1);
    assert.strictEqual(chat.body.indexOf('.html('), -1);
    assert.strictEqual(chat.body.indexOf('innerHTML'), -1);
  });

  it('publica texto, imagen, video y un script que sigue siendo texto', function () {
    var cases = [
      {
        mensaje: 'Hola, este es un mensaje normal',
        expect: function (msg) {
          assert.strictEqual(msg.type, 'text');
          assert.strictEqual(msg.mensaje, 'Hola, este es un mensaje normal');
          assert.strictEqual(msg.nombre, support.TEST_USER.name);
        }
      },
      {
        mensaje: 'https://example.com/foto.jpg',
        expect: function (msg) {
          assert.strictEqual(msg.type, 'image');
          assert.strictEqual(msg.url, 'https://example.com/foto.jpg');
        }
      },
      {
        mensaje: 'https://www.youtube.com/watch?v=qYwlqx-JLok',
        expect: function (msg) {
          assert.strictEqual(msg.type, 'youtube');
          assert.strictEqual(msg.videoId, 'qYwlqx-JLok');
          assert.strictEqual(String(msg.mensaje).indexOf('<iframe'), -1);
        }
      },
      {
        mensaje: '<script>alert(1)</script>',
        expect: function (msg) {
          assert.strictEqual(msg.type, 'text');
          assert.strictEqual(msg.mensaje, '<script>alert(1)</script>');
        }
      }
    ];

    var chain = Promise.resolve();
    cases.forEach(function (item) {
      chain = chain.then(function () {
        return support.publish(PORT, {
          nombre: '<script>alert(1)</script>',
          mensaje: item.mensaje,
          color: '#112233'
        }, { cookie: cookie }).then(item.expect);
      });
    });
    return chain;
  });

});
