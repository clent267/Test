function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const loginButton = document.getElementById('loginButton');

    // Disable the button and show loading animation
    loginButton.disabled = true;
    loginButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging In...';

    // Perform login request
    fetch('/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username,
            password
        })
    }).then(response => {
        if (response.ok) {
            // Login successful, redirect to another page or perform any other action
            window.location.href = '/index';
        } else {
            return response.json().then(data => {
                throw new Error(data.message);
            });
        }
    }).catch(error => {
        console.error('Error during login:', error);
        swal("Error", error.message || "Login Error Please Try Again", "error");
    }).finally(() => {
        // Revert the button state
        loginButton.innerHTML = 'Log In';
        loginButton.disabled = false;
    });
}