import { isLoggedIn, ajax, redirectTo } from './common.js'

const login = (user, password) => {
// function login(user, password) {
  const url = `login/`;

  const body = {
    username: user,
    password: password
  };

  const headers = {
    'Content-Type': 'application/json'
  };

  const success = (response) => {
    // function success(response) {
    console.log('This is success function')
    if (response.access && response.refresh) {
      sessionStorage.setItem('access', response.access);
      sessionStorage.setItem('refresh', response.refresh);

      window.location.href = '/';
    } else {
      console.error('Login response does not contain access or refresh');
    }
  };

  ajax('POST', url, headers, body, success);
};

$( document ).ready( async () => {
    if (await isLoggedIn()) {
        window.location.href = '/'
    }
    $('#btn-login').click(async () => {
        console.log('button pressed')
        const username = $('#username').val()
        const password = $('#password').val()
        login(username, password)
    })
    console.log( "ready login" );
});