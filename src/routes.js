const { 
  addBookModule, 
  getAllBooksModule, 
  getBookByIdModule, 
  editBookByIdModule,
  deleteBookByIdModule,
} = require('./handler');

const routes = [
  {
    method: 'POST',
    path: '/books',
    handler: addBookModule,
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