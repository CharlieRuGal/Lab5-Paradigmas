var assert = require('assert');
var http = require('http');
var support = require('./support');

var PORT = 41235;

function getPage() {
  return new Promise(function (resolve, reject) {
    http.get('http://127.0.0.1:' + PORT + '/', function (res) {
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
  var page;

  before(function () {
    return support.startServer(PORT).then(function (child) {
      proc = child;
      return getPage();
    }).then(function (result) {
      page = result;
    });
  });

  after(function () {
    if (proc && !proc.killed) {
      proc.kill();
    }
  });

  it('abre la pagina del chat sin insertar HTML arbitrario', function () {
    assert.strictEqual(page.status, 200);
    assert.ok(page.body.indexOf('id="messages"') !== -1);
    assert.ok(page.body.indexOf('id="m"') !== -1);
    assert.ok(page.body.indexOf('createElement') !== -1);
    assert.ok(page.body.indexOf('https://www.youtube.com/embed/') !== -1);
    assert.strictEqual(page.body.indexOf('.html('), -1);
    assert.strictEqual(page.body.indexOf('innerHTML'), -1);
  });

  it('publica texto, imagen, video y un script que sigue siendo texto', function () {
    var cases = [
      {
        mensaje: 'Hola, este es un mensaje normal',
        expect: function (msg) {
          assert.strictEqual(msg.type, 'text');
          assert.strictEqual(msg.mensaje, 'Hola, este es un mensaje normal');
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
          nombre: 'Ana',
          mensaje: item.mensaje,
          color: '#112233'
        }).then(item.expect);
      });
    });
    return chain;
  });

});
