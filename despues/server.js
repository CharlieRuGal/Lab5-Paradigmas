require('dotenv').config();

var validation = require('./libs/unalib');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var { auth, requiresAuth } = require('express-openid-connect');
var port = process.env.PORT || 3000;

var authConfig = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.SECRET,
  baseURL: process.env.BASE_URL,
  clientID: process.env.CLIENT_ID,
  issuerBaseURL: process.env.ISSUER_BASE_URL,
  authorizationParams: {
    connection: 'google-oauth2'
  },
  routes: {
    logout: false
  }
};

var authMiddleware = auth(authConfig);
var socketsByUser = new Map();

app.use(authMiddleware);

app.get('/logout', function (req, res) {
  var user = req.oidc && req.oidc.user;
  if (user && user.sub) {
    revokeUser(user.sub);
  }
  res.oidc.logout();
});

app.get('/profile', requiresAuth(), function (req, res) {
  res.json({ name: identityName(req.oidc.user) });
});

app.get('/', function (req, res) {
  var page = (req.oidc && req.oidc.isAuthenticated()) ? '/index.html' : '/welcome.html';
  res.sendFile(__dirname + page);
});

app.use(function (err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || err.statusCode || 500);
  res.type('html').send(
    '<p>No se pudo iniciar sesión. Puedes intentarlo de nuevo.</p>' +
    '<p><a href="/login">Iniciar sesión</a></p>'
  );
});

io.use(function (socket, next) {
  loadSession(socket.request, function (err, oidc) {
    if (err || !oidc || !oidc.isAuthenticated() || !oidc.user || !oidc.user.sub) {
      next(new Error('auth required'));
      return;
    }
    socket.data.user = {
      sub: oidc.user.sub,
      name: identityName(oidc.user)
    };
    rememberSocket(socket, socket.data.user.sub);
    next();
  });
});

io.on('connection', function (socket) {
  socket.on('Evento-Mensaje-Server', function (msg) {
    if (!sessionActive(socket)) {
      socket.disconnect(true);
      return;
    }

    var validated = validation.validateMessage(msg);
    var obj;
    try {
      obj = JSON.parse(validated);
    } catch (e) {
      return;
    }
    if (!obj || typeof obj !== 'object') {
      return;
    }

    if (!sessionActive(socket)) {
      socket.disconnect(true);
      return;
    }

    obj.nombre = socket.data.user.name;
    io.emit('Evento-Mensaje-Server', JSON.stringify(obj));
  });
});

http.listen(port, function () {
  console.log('listening on *:' + port);
});

function identityName(user) {
  if (!user) {
    return 'Usuario';
  }
  return user.name || user.nickname || user.email || 'Usuario';
}

function rememberSocket(socket, sub) {
  var group = socketsByUser.get(sub);
  if (!group) {
    group = new Set();
    socketsByUser.set(sub, group);
  }
  group.add(socket);
  socket.on('disconnect', function () {
    group.delete(socket);
    if (group.size === 0) {
      socketsByUser.delete(sub);
    }
  });
}

function revokeUser(sub) {
  var group = socketsByUser.get(sub);
  if (!group) {
    return;
  }
  group.forEach(function (socket) {
    socket.data.revoked = true;
    socket.disconnect(true);
  });
  socketsByUser.delete(sub);
}

function sessionActive(socket) {
  var user = socket.data.user;
  if (!user || socket.data.revoked) {
    return false;
  }
  var group = socketsByUser.get(user.sub);
  return !!(group && group.has(socket));
}

function loadSession(req, callback) {
  if (typeof req.get !== 'function') {
    req.get = function (name) {
      var header = req.headers && req.headers[String(name).toLowerCase()];
      if (Array.isArray(header)) {
        return header.join(', ');
      }
      return header;
    };
  }

  var originalUrl = req.url;
  var res = {
    headers: {},
    getHeader: function (name) {
      return this.headers[String(name).toLowerCase()];
    },
    setHeader: function (name, value) {
      this.headers[String(name).toLowerCase()] = value;
      return this;
    },
    removeHeader: function (name) {
      delete this.headers[String(name).toLowerCase()];
    },
    cookie: function () {
      return this;
    },
    clearCookie: function () {
      return this;
    },
    writeHead: function () {
      return this;
    },
    end: function () {
      return this;
    }
  };

  authMiddleware(req, res, function (err) {
    req.url = originalUrl;
    callback(err, req.oidc);
  });
}
