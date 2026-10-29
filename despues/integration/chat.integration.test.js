var path = require('path');
var { spawn } = require('child_process');
var { io } = require('socket.io-client');
var support = require('../test/support');

var PORT = 41236;

function startServer(port) {
  return new Promise(function (resolve, reject) {
    var proc = spawn(process.execPath, ['server.js'], {
      cwd: path.join(__dirname, '..'),
      env: Object.assign({}, process.env, support.testEnv(port)),
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

function connect(port, cookie) {
  return new Promise(function (resolve, reject) {
    var socket = io('http://127.0.0.1:' + port, {
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
      extraHeaders: cookie ? { Cookie: cookie } : {}
    });
    var timer = setTimeout(function () {
      socket.close();
      reject(new Error('timeout al conectar el cliente de Socket.IO'));
    }, 5000);
    socket.on('connect', function () {
      clearTimeout(timer);
      resolve(socket);
    });
    socket.on('connect_error', function (err) {
      clearTimeout(timer);
      socket.close();
      reject(err);
    });
  });
}

function sendAndReceive(socket, payload) {
  return new Promise(function (resolve, reject) {
    var timer = setTimeout(function () {
      reject(new Error('el servidor no reenvio el mensaje'));
    }, 5000);
    socket.once('Evento-Mensaje-Server', function (msg) {
      clearTimeout(timer);
      resolve(JSON.parse(msg));
    });
    socket.emit('Evento-Mensaje-Server', JSON.stringify(payload));
  });
}

describe('integracion Socket.IO del chat', function () {
  var proc;
  var socket;

  beforeAll(function () {
    return startServer(PORT).then(function (child) {
      proc = child;
    });
  });

  beforeEach(function () {
    return connect(PORT, support.sessionCookieHeader()).then(function (client) {
      socket = client;
    });
  });

  afterEach(function () {
    if (!socket) {
      return;
    }
    var current = socket;
    socket = null;
    return new Promise(function (resolve) {
      var timer = setTimeout(resolve, 1000);
      current.once('disconnect', function () {
        clearTimeout(timer);
        resolve();
      });
      current.close();
    });
  });

  afterAll(function () {
    if (!proc) {
      return;
    }
    return new Promise(function (resolve) {
      if (proc.exitCode !== null) {
        resolve();
        return;
      }
      var timer = setTimeout(function () {
        spawn('taskkill', ['/PID', String(proc.pid), '/T', '/F']);
      }, 2000);
      proc.once('exit', function () {
        clearTimeout(timer);
        resolve();
      });
      proc.kill();
    });
  });

  test('rechaza la conexion cuando no hay sesion', function () {
    if (socket) {
      socket.close();
      socket = null;
    }
    return connect(PORT).then(function () {
      throw new Error('la conexion sin sesion fue aceptada');
    }, function (err) {
      expect(String(err && err.message)).toMatch(/auth required|websocket error/i);
    });
  });

  test('reenvia una imagen valida ya clasificada por UNA Lib', function () {
    return sendAndReceive(socket, {
      nombre: 'No autorizado',
      mensaje: 'https://example.com/foto.jpg',
      color: '#112233'
    }).then(function (msg) {
      expect(msg.type).toBe('image');
      expect(msg.url).toBe('https://example.com/foto.jpg');
      expect(msg.mensaje).toBe('https://example.com/foto.jpg');
      expect(msg.nombre).toBe(support.TEST_USER.name);
      expect(msg.color).toBe('#112233');
      expect(msg.videoId).toBeUndefined();
    });
  });

  test('reenvia un video de YouTube con el identificador comprobado', function () {
    return sendAndReceive(socket, {
      nombre: 'Ana',
      mensaje: 'https://www.youtube.com/watch?v=qYwlqx-JLok',
      color: '#112233'
    }).then(function (msg) {
      expect(msg.type).toBe('youtube');
      expect(msg.videoId).toBe('qYwlqx-JLok');
      expect(msg.url).toBeUndefined();
      expect(String(msg.mensaje).indexOf('<iframe')).toBe(-1);
    });
  });

  test('neutraliza contenido malicioso y conserva el texto literal', function () {
    return sendAndReceive(socket, {
      nombre: '<script>alert(1)</script>',
      mensaje: '<img src=x onerror=alert(1)>',
      color: 'red" onmouseover="alert(1)'
    }).then(function (msg) {
      expect(msg.type).toBe('text');
      expect(msg.mensaje).toBe('<img src=x onerror=alert(1)>');
      expect(msg.nombre).toBe(support.TEST_USER.name);
      expect(msg.color).toBe('#333333');
      expect(msg.url).toBeUndefined();
      expect(msg.videoId).toBeUndefined();
    });
  });
});
