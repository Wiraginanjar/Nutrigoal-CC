const { 
  registerUser,
  loginUser,
  updateUser,
  getpredict,
  getHistory
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
    path: '/history',
    handler: getHistory,
  },
];
  
module.exports = routes;