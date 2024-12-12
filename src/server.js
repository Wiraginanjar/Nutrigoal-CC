const Hapi = require('@hapi/hapi');
const routes = require('./routes');
const InputError = require('./exceptions/InputError');
require('dotenv').config()

const init = async () => {
  const server = Hapi.server({
    port: 8000,
    host: process.env.NODE_ENV !== 'production' ? 'localhost' : '0.0.0.0',
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  server.route(routes);

  server.ext('onPreResponse', function (request, h) {
    const response = request.response;

    // Check for custom InputError with specific message
    if (response instanceof InputError) {
        const message = `${response.message}`;

        const newResponse = h.response({
            status: 'fail',
            message: message,
        });
        newResponse.code(response.output.statusCode || 400);
        return newResponse;
    }

    // Generic Boom error handling
    if (response.isBoom) {
        const newResponse = h.response({
            status: 'fail',
            message: 'input tidak benar!',
        });
        newResponse.code(response.output.statusCode);
        return newResponse;
    }

    return h.continue;
});

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};


init();