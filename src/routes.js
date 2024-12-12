const { 
  queryTable, 
  getAllBooksModule, 
  getBookByIdModule, 
  editBookByIdModule,
  deleteBookByIdModule,
  registerUser,
  loginUser,
  updateUser,
  proxyPredict,
} = require('./handler');

const routes = [
  {
    method: 'GET',
    path: '/query',
    handler: queryTable,
  },
  {
    method: 'POST',
    path: '/register',
    handler: registerUser,
  },
  {
    method: 'POST',
    path: '/login',
    handler: loginUser,
  },
  {
    method: 'PUT',
    path: '/user/{id}',
    handler: updateUser,
  },
  {
    method: 'POST',
    path: '/proxy-predict',
    handler: proxyPredict,
  },
  {
    method: 'GET',
    path: '/books',
    handler: getAllBooksModule,
  },
  {
    method: 'GET',
    path: '/books/{id}',
    handler: getBookByIdModule,
  },
  {
    method: 'PUT',
    path: '/books/{id}',
    handler: editBookByIdModule,
  },
  {
    method: 'DELETE',
    path: '/books/{id}',
    handler: deleteBookByIdModule,
  },
];
  
module.exports = routes;