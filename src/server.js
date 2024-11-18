const Hapi = require('@hapi/hapi');
const routes = require('./routes');
require('dotenv').config()
const mysql = require('mysql2');

var connection  = mysql.createConnection({
  host            : process.env.HOST_DB,
  port            : 3306,
  user            : process.env.USER_DB,
  password        : process.env.PASSWORD_DB,
  database        : process.env.DB,
});
 
connection.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }
 
  console.log('connected as id ' + connection.threadId);
});

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

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};


init();