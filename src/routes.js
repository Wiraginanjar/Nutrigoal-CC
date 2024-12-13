const { 
  registerUser,
  loginUser,
  updateUser,
  getpredict,
  getallHistory,
  getbyHistory
} = require('./handler');

const routes = [
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
    path: '/predict',
    handler: getpredict,
  },
  {
    method: 'GET',
    path: '/history/{documentId}',
    handler: getbyHistory,
  },
  {
    method: 'GET',
    path: '/history',
    handler: getallHistory,
  },
];
  
module.exports = routes;