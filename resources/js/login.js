import '/resources/css/app.css';

document.querySelector('.login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const url = '/auth/login';
    const account = document.querySelector('form.login-form > [name=account]');
    const password = document.querySelector('form.login-form > [name=password]');
    fetch(url, {
        method: 'POST',
        credentials: 'include',
        body: new URLSearchParams({
            account: account.value,
            password: password.value,
        }),
    })
        .then((res) => {
            if (res.status != 201) throw new Error();
            window.location.href = '/';
        })
        .catch(() => {
            alert('login failed');
        });
});

// Check if access token or refresh token is still valid
fetch(`/summaries`, {
    method: 'GET',
    credentials: 'include',
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
}).then(async function (response) {
    if (response.status != 401) window.location.href = '/';

    return await fetch('/refresh', {
        credentials: 'include',
    }).then((res) => {
        if (res.status == 200) {
            window.location.href = '/';
        }
    });
});
