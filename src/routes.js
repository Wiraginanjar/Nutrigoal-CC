const { 
  registerUser,
  loginUser,
  updateUser,
  predict,
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
    handler: predict,
  },
];
  
module.exports = routes;