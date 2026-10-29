var path = require('path');
var { spawn } = require('child_process');
var WebSocket = require('ws');

function startServer(port) {
  return new Promise(function (resolve, reject) {
    var proc = spawn(process.execPath, ['server.js'], {
      cwd: path.join(__dirname, '..'),
      env: Object.assign({}, process.env, { PORT: String(port) }),
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

function publish(port, payload) {
  return new Promise(function (resolve, reject) {
    var ws = new WebSocket('ws://127.0.0.1:' + port + '/socket.io/?EIO=4&transport=websocket');
    var timer = setTimeout(function () {
      ws.close();
      reject(new Error('sin respuesta del socket'));
    }, 5000);

    function fail(err) {
      clearTimeout(timer);
      ws.close();
      reject(err);
    }

    ws.on('error', fail);
    ws.on('message', function (data) {
      var text = data.toString();
      if (text.charAt(0) === '0') {
        ws.send('40');
        return;
      }
      if (text.slice(0, 2) === '40') {
        ws.send('42' + JSON.stringify(['Evento-Mensaje-Server', JSON.stringify(payload)]));
        return;
      }
      if (text.charAt(0) === '2') {
        ws.send('3');
        return;
      }
      if (text.slice(0, 2) === '42') {
        clearTimeout(timer);
        var packet = JSON.parse(text.slice(2));
        ws.close();
        resolve(JSON.parse(packet[1]));
      }
    });
  });
}

module.exports = {
  startServer: startServer,
  publish: publish
};
