var IMAGE_EXT = /\.(jpg|jpeg|png|gif|bmp)$/i;
var YT_ID = /^[A-Za-z0-9_-]{11}$/;
var HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;
var DEFAULT_COLOR = '#333333';
var YT_HOSTS = {
  'youtube.com': true,
  'www.youtube.com': true,
  'm.youtube.com': true,
  'youtu.be': true
};

function neutralMessage() {
  return { nombre: '', color: DEFAULT_COLOR, type: 'text', mensaje: '' };
}

function parseHttpUrl(value) {
  if (typeof value !== 'string' || value.indexOf(' ') !== -1) {
    return null;
  }
  var url;
  try {
    url = new URL(value);
  } catch (e) {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return null;
  }
  if (url.username || url.password) {
    return null;
  }
  return url;
}

function imageUrlOf(value) {
  var url = parseHttpUrl(value);
  if (!url) {
    return null;
  }
  var segment = url.pathname.split('/').pop();
  if (!IMAGE_EXT.test(segment)) {
    return null;
  }
  return url.href;
}

function youtubeIdOf(value) {
  var url = parseHttpUrl(value);
  if (!url || !YT_HOSTS[url.hostname.toLowerCase()]) {
    return null;
  }
  var id = null;
  var parts = url.pathname.split('/').filter(Boolean);
  if (url.hostname.toLowerCase() === 'youtu.be') {
    if (parts.length === 1) {
      id = parts[0];
    }
  } else if (url.pathname === '/watch') {
    id = url.searchParams.get('v');
  } else if (parts.length === 2 && parts[0] === 'embed') {
    id = parts[1];
  }
  if (!id || !YT_ID.test(id)) {
    return null;
  }
  return id;
}

function sanitizeColor(color) {
  if (typeof color === 'string' && HEX_COLOR.test(color)) {
    return color;
  }
  return DEFAULT_COLOR;
}

function sanitizeName(nombre) {
  return typeof nombre === 'string' ? nombre : '';
}

module.exports = {

  is_valid_phone: function (phone) {
    var isValid = false;
    var re = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/i;

    try {
      isValid = re.test(phone);
    } catch (e) {
      console.log(e);
    } finally {
      return isValid;
    }
  },

  is_valid_url_image: function (url) {
    return imageUrlOf(typeof url === 'string' ? url.trim() : '') !== null;
  },

  is_valid_yt_video: function (url) {
    return youtubeIdOf(typeof url === 'string' ? url.trim() : '') !== null;
  },

  getYTVideoId: function (url) {
    return youtubeIdOf(typeof url === 'string' ? url.trim() : '');
  },

  validateMessage: function (msg) {
    if (!msg || typeof msg !== 'string') {
      return JSON.stringify(neutralMessage());
    }

    var obj;
    try {
      obj = JSON.parse(msg);
    } catch (e) {
      return JSON.stringify(neutralMessage());
    }

    if (!obj || typeof obj !== 'object' || Array.isArray(obj) || typeof obj.mensaje !== 'string') {
      return JSON.stringify(neutralMessage());
    }

    var nombre = sanitizeName(obj.nombre);
    var color = sanitizeColor(obj.color);
    var trimmed = obj.mensaje.trim();
    var imageUrl = imageUrlOf(trimmed);
    if (imageUrl) {
      return JSON.stringify({
        nombre: nombre,
        color: color,
        type: 'image',
        url: imageUrl,
        mensaje: trimmed
      });
    }

    var videoId = youtubeIdOf(trimmed);
    if (videoId) {
      return JSON.stringify({
        nombre: nombre,
        color: color,
        type: 'youtube',
        videoId: videoId,
        mensaje: trimmed
      });
    }

    return JSON.stringify({
      nombre: nombre,
      color: color,
      type: 'text',
      mensaje: obj.mensaje
    });
  }

};
