var assert = require('assert');
var http = require('http');
var support = require('./support');

var PORT = 41234;

describe('integracion del chat', function () {
  this.timeout(15000);
  var proc;

  before(function () {
    return support.startServer(PORT).then(function (child) {
      proc = child;
    });
  });

  after(function () {
    if (proc && !proc.killed) {
      proc.kill();
    }
  });

  it('reenvia una imagen clasificada, sin HTML', function () {
    return support.publish(PORT, {
      nombre: 'Ana',
      mensaje: 'https://example.com/foto.jpg',
      color: '#112233'
    }).then(function (msg) {
      assert.strictEqual(msg.type, 'image');
      assert.strictEqual(msg.url, 'https://example.com/foto.jpg');
      assert.strictEqual(Object.prototype.hasOwnProperty.call(msg, 'videoId'), false);
    });
  });

  it('reenvia un video de YouTube con su identificador', function () {
    return support.publish(PORT, {
      nombre: 'Ana',
      mensaje: 'https://youtu.be/qYwlqx-JLok',
      color: '#112233'
    }).then(function (msg) {
      assert.strictEqual(msg.type, 'youtube');
      assert.strictEqual(msg.videoId, 'qYwlqx-JLok');
    });
  });

  it('reenvia un script como texto', function () {
    return support.publish(PORT, {
      nombre: '<script>alert(1)</script>',
      mensaje: '<script>alert(1)</script>',
      color: 'red" onmouseover="alert(1)'
    }).then(function (msg) {
      assert.strictEqual(msg.type, 'text');
      assert.strictEqual(msg.mensaje, '<script>alert(1)</script>');
      assert.strictEqual(msg.nombre, '<script>alert(1)</script>');
      assert.strictEqual(msg.color, '#333333');
    });
  });

  it('sirve la pagina del chat', function () {
    return new Promise(function (resolve, reject) {
      http.get('http://127.0.0.1:' + PORT + '/', function (res) {
        var body = '';
        res.on('data', function (chunk) { body += chunk; });
        res.on('end', function () {
          try {
            assert.strictEqual(res.statusCode, 200);
            assert.ok(body.indexOf('Chat Socket.IO UNA') !== -1);
            assert.ok(body.indexOf('textContent') !== -1);
            assert.ok(body.indexOf('.html(') === -1);
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      }).on('error', reject);
    });
  });

});
