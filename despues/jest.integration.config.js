var path = require('path');

module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/integration/**/*.test.js'],
  testTimeout: 20000,
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: path.join(__dirname, 'evidencias-laboratorio5', 'reports', 'integracion'),
      filename: 'integracion.html',
      openReport: false,
      expand: true,
      pageTitle: 'Pruebas de integracion UNA Chat'
    }]
  ]
};
