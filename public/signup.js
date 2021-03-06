'use strict';

$('.js-SignUpForm').submit(event => {
    event.preventDefault();    
    let email = $(event.currentTarget).find('#email').val();
    let pass = $(event.currentTarget).find('#password').val();
    createUser(email, pass)
      .then(() => {        
        location.href = "/login";
      });
  });

function createUser(userEmail, userPass) {
  return new Promise((resolve, reject) => {
    const settings = {
      url: '/api/users',
      data: JSON.stringify({
        email: userEmail,
        password: userPass
      }),
      dataType: 'json',
      type: 'POST',
      contentType: 'application/json; charset=utf-8',
    };
    let results = $.ajax(settings);    
    resolve(results);    
  });
};

$(".auth-container").hide().fadeIn(1500);