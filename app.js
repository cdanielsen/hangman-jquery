"use strict";

var connect = require('connect');
var serveStatic = require('serve-static');
var path = require('path');
var http = require('http');

var logger = require('morgan');
var FileStreamRotator = require('file-stream-rotator');

var swaggerTools = require('swagger-tools');
var jsyaml = require('js-yaml');
var fs = require('fs');

var serverPort = process.env.PORT || 8124;

// swaggerRouter configuration
var options = {
  swaggerUi: '/swagger.json',
  controllers: './controllers',
  useStubs: process.env.NODE_ENV === 'development' ? true : false // Conditionally turn on stubs (mock mode)
};

// The Swagger document (require it, build it programmatically, fetch it from a URL, ...)
var spec = fs.readFileSync('./api/swagger.yaml', 'utf8');
var swaggerDoc = jsyaml.safeLoad(spec);

// Set up log rotation
var logDirectory = path.join(__dirname, '/log');
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);
var accessLogStream = FileStreamRotator.getStream({
  date_format: 'YYYY-MM-DD-hh',
  filename: logDirectory + '/access-%DATE%.log',
  frequency: 'h',
  verbose: false
});

var app = connect();
// Initialize the Swagger middleware
swaggerTools.initializeMiddleware(swaggerDoc, function (middleware) {
  // Interpret Swagger resources and attach metadata to request - must be first in swagger-tools middleware chain
  app.use(middleware.swaggerMetadata());

  // Validate Swagger requests
  app.use(middleware.swaggerValidator());

  // Set up access logging against incoming requests
  app.use(logger('short', { stream: accessLogStream }));

  // Route validated requests to appropriate controller
  app.use(middleware.swaggerRouter(options));

  // Serve the Swagger documents and Swagger UI
  app.use(middleware.swaggerUi());

  app.use(serveStatic(path.join(__dirname, 'public')));

  // Start the server
  http.createServer(app).listen(serverPort, function () {
    console.log('Your server is listening on port %d (http://localhost:%d)', serverPort, serverPort);
    console.log('Swagger-ui is available on http://localhost:%d/docs', serverPort);
  });
});
