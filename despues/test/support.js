var path = require('path');
var { spawn } = require('child_process');
var WebSocket = require('ws');
var { JWE } = require('jose');
var { getKeyStore } = require('express-openid-connect/lib/crypto');

var TEST_SECRET = 'una-chat-test-secret-32-bytes-min!!';
var TEST_USER = { sub: 'auth0|test-ana', name: 'Ana' };

function testEnv(port) {
  return {
    PORT: String(port),
    SECRET: TEST_SECRET,
    BASE_URL: 'http://127.0.0.1:' + port,
    CLIENT_ID: 'test-client-id',
    ISSUER_BASE_URL: 'https://example.invalid/'
  };
}

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function sessionCookieValue() {
  var epoch = (Date.now() / 1000) | 0;
  var header = base64url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  var payload = base64url(JSON.stringify({
    sub: TEST_USER.sub,
    name: TEST_USER.name,
    sid: 'test-sid',
    iat: epoch,
    exp: epoch + 3600
  }));
  var idToken = header + '.' + payload + '.sig';
  var key = getKeyStore(TEST_SECRET, true)[0];
  return JWE.encrypt(JSON.stringify({ id_token: idToken }), key, {
    alg: 'dir',
    enc: 'A256GCM',
    iat: epoch,
    uat: epoch,
    exp: epoch + 3600
  });
}

function sessionCookieHeader() {
  return 'appSession=' + encodeURIComponent(sessionCookieValue());
}

function startServer(port) {
  return new Promise(function (resolve, reject) {
    var proc = spawn(process.execPath, ['server.js'], {
      cwd: path.join(__dirname, '..'),
      env: Object.assign({}, process.env, testEnv(port)),
      stdio: ['ignore', 'pipe', 'pipe']
    });
    var output = '';
    var timer = setTimeout(function () {
      proc.kill();
      reject(new Error('el servidor no inicio: ' + output));
    }, 8000);
    proc.stdout.on('data', function (chunk) {
      output += chunk.toString();
      if (output.indexOf('listening') !== -1) {
        clearTimeout(timer);
        resolve(proc);
      }
    });
    proc.stderr.on('data', function (chunk) {
      output += chunk.toString();
    });
    proc.on('error', function (err) {
      clearTimeout(timer);
      reject(err);
    });
  });
}

function publish(port, payload, options) {
  options = options || {};
  return new Promise(function (resolve, reject) {
    var headers = {};
    if (options.cookie) {
      headers.Cookie = options.cookie;
    }
    var ws = new WebSocket('ws://127.0.0.1:' + port + '/socket.io/?EIO=4&transport=websocket', { headers: headers });
    var settled = false;
    var timer = setTimeout(function () {
      finish(new Error('sin respuesta del socket'));
    }, 5000);

    function finish(err, value) {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      ws.close();
      if (err) {
        reject(err);
      } else {
        resolve(value);
      }
    }

    ws.on('error', function (err) {
      finish(err);
    });
    ws.on('close', function () {
      if (options.expectAuthFailure) {
        finish(null, { rejected: true });
      }
    });
    ws.on('message', function (data) {
      var text = data.toString();
      if (text.charAt(0) === '0') {
        ws.send('40');
        return;
      }
      if (text.slice(0, 2) === '44') {
        finish(null, { rejected: true });
        return;
      }
      if (text.slice(0, 2) === '40') {
        if (options.expectAuthFailure) {
          finish(new Error('la conexion sin sesion fue aceptada'));
          return;
        }
        ws.send('42' + JSON.stringify(['Evento-Mensaje-Server', JSON.stringify(payload)]));
        return;
      }
      if (text.charAt(0) === '2') {
        ws.send('3');
        return;
      }
      if (text.slice(0, 2) === '42') {
        var packet = JSON.parse(text.slice(2));
        finish(null, JSON.parse(packet[1]));
      }
    });
  });
}

module.exports = {
  TEST_SECRET: TEST_SECRET,
  TEST_USER: TEST_USER,
  testEnv: testEnv,
  sessionCookieValue: sessionCookieValue,
  sessionCookieHeader: sessionCookieHeader,
  startServer: startServer,
  publish: publish
};
