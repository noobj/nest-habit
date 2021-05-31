import '/resources/css/app.css'

document.querySelector('.login-form').addEventListener('submit', (e) => {
    e.preventDefault()
    const url = '/auth/login'
    const account = document.querySelector('form.login-form > [name=account]')
    const password = document.querySelector('form.login-form > [name=password]')
    fetch(url, {
        method: 'POST',
        credentials: 'include',
        body: new URLSearchParams({
            'account': account.value,
            'password': password.value
        }),
    }).then((res) => {
        if (res.status != 201) throw new Error()
        window.location.href = '/'
    }).catch(() => {
        alert('login failed')
    })
})
