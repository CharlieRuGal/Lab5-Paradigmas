var fs = require('fs');
var path = require('path');
var { spawn } = require('child_process');
var { chromium } = require('playwright');

var PORT = 4181;
var outDir = path.join(__dirname, '..', 'evidencias-laboratorio5');
var outFile = path.join(outDir, 'evidencia-01-xss-original.jpg');
var logFile = path.join(outDir, 'xss-original-resultado.txt');

var payload = '<img src=x onerror="alert(\'XSS original\');var n=document.createElement(\'div\');n.id=\'xss-ejecutado\';n.textContent=\'XSS ejecutado en la version original. El navegador mostro alert: XSS original\';n.style.cssText=\'position:fixed;top:0;left:0;right:0;background:#9b0000;color:#fff;font:bold 22px Arial,sans-serif;padding:18px;z-index:99999\';document.body.appendChild(n)">';

function startAntes() {
  return new Promise(function (resolve, reject) {
    var proc = spawn(process.execPath, ['server.js'], {
      cwd: path.join(__dirname, '..', '..', 'antes'),
      env: Object.assign({}, process.env, {
        PORT: String(PORT),
        NODE_PATH: path.join(__dirname, '..', 'node_modules')
      }),
      stdio: ['ignore', 'pipe', 'pipe']
    });
    var output = '';
    var timer = setTimeout(function () {
      proc.kill();
      reject(new Error('el servidor original no inicio: ' + output));
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

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  var proc = await startAntes();
  var dialogs = [];
  var browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    var page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('dialog', function (dialog) {
      dialogs.push(dialog.message());
      return dialog.accept();
    });
    await page.goto('http://127.0.0.1:' + PORT + '/', { waitUntil: 'domcontentloaded' });
    await page.locator('#nombre').fill('Ana');
    await page.locator('#m').fill(payload);
    await page.getByRole('button', { name: 'Send' }).click();
    await page.locator('#xss-ejecutado').waitFor({ timeout: 8000 });
    await page.screenshot({ path: outFile, type: 'jpeg', quality: 90 });
    var visible = await page.locator('#xss-ejecutado').innerText();
    fs.writeFileSync(logFile, [
      'servidor: antes/server.js',
      'puerto: ' + PORT,
      'dialogs: ' + JSON.stringify(dialogs),
      'banner: ' + visible,
      'captura: ' + outFile
    ].join('\n'), 'utf8');
    if (dialogs.indexOf('XSS original') === -1) {
      throw new Error('el navegador no mostro el dialogo esperado: ' + JSON.stringify(dialogs));
    }
  } finally {
    await browser.close();
    if (proc && !proc.killed) {
      proc.kill();
    }
  }
}

main().catch(function (err) {
  console.error(err);
  process.exit(1);
});
