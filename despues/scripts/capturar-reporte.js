var fs = require('fs');
var http = require('http');
var path = require('path');
var { chromium } = require('playwright');

function contentType(file) {
  var ext = path.extname(file).toLowerCase();
  if (ext === '.html') return 'text/html; charset=utf-8';
  if (ext === '.js') return 'text/javascript; charset=utf-8';
  if (ext === '.css') return 'text/css; charset=utf-8';
  if (ext === '.json') return 'application/json; charset=utf-8';
  if (ext === '.png') return 'image/png';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.woff') return 'font/woff';
  if (ext === '.woff2') return 'font/woff2';
  return 'application/octet-stream';
}

function serve(root) {
  var rootNorm = path.normalize(root + path.sep);
  return new Promise(function (resolve, reject) {
    var server = http.createServer(function (req, res) {
      var urlPath = decodeURIComponent(req.url.split('?')[0]);
      if (urlPath === '/') urlPath = '/index.html';
      var file = path.normalize(path.join(root, urlPath));
      if (file !== path.normalize(root) && file.indexOf(rootNorm) !== 0) {
        res.writeHead(403);
        res.end();
        return;
      }
      fs.readFile(file, function (err, data) {
        if (err) {
          res.writeHead(404);
          res.end('not found');
          return;
        }
        res.writeHead(200, { 'Content-Type': contentType(file) });
        res.end(data);
      });
    });
    server.listen(0, '127.0.0.1', function () {
      resolve(server);
    });
    server.on('error', reject);
  });
}

async function main() {
  var target = process.argv[2];
  var jpgPath = process.argv[3];
  var waitText = process.argv[4] || '';
  if (!target || !jpgPath) {
    throw new Error('uso: node scripts/capturar-reporte.js <html-o-url> <jpg> [texto]');
  }

  var server = null;
  var url = target;
  if (!/^https?:\/\//i.test(target)) {
    var htmlFile = path.resolve(target);
    server = await serve(path.dirname(htmlFile));
    url = 'http://127.0.0.1:' + server.address().port + '/' + path.basename(htmlFile);
  }

  var browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    var page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    if (waitText) {
      await page.getByText(waitText, { exact: false }).first().waitFor({ timeout: 20000 });
    }
    await page.screenshot({ path: path.resolve(jpgPath), type: 'jpeg', quality: 90 });
    console.log(url + ' -> ' + path.resolve(jpgPath));
  } finally {
    await browser.close();
    if (server) {
      await new Promise(function (resolve) { server.close(resolve); });
    }
  }
}

main().catch(function (err) {
  console.error(err);
  process.exit(1);
});
