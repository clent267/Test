function handleRegister(event) {
    event.preventDefault();
    const submitButton = document.getElementById('submitButton');
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Registering...';
    submitButton.disabled = true;

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const email = document.getElementById('email').value;
    const discord_id = document.getElementById('discord_id').value;
    const token = document.getElementById('token').value;

    // Perform registration request
    fetch('/api/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username,
            password,
            email,
            discord_id,
            token
        })
    }).then(response => {
        if (response.ok) {
            // Registration successful, redirect to another page or perform any other action
            window.location.href = '/index';
        } else {
            return response.json().then(data => {
                throw new Error(data.message);
            });
        }
    }).catch(error => {
        console.error('Error during registration:', error);
        swal("Error", error.message || "Registration Error. Please Try Again", "error");
    }).finally(() => {
        // Revert the button state
        submitButton.innerHTML = 'Register';
        submitButton.disabled = false;
    });
}