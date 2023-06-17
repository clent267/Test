// Function to send a POST request to the logout endpoint
async function logout() {
    try {
        const response = await fetch('/api/logout', {
            method: 'GET',
            credentials: 'same-origin', // Include cookies in the request
        });
        if (response.ok) {
            // Redirect to the login page after successful logout
            window.location.href = '/login';
        } else {
            const errorMessage = await response.text();
            console.error(errorMessage);
            // Display an error message to the user
            alert('Logout failed');
        }
    } catch (error) {
        console.error(error);
        // Display an error message to the user
        alert('Logout failed');
    }
}
// Add event listener to the logout button
const logoutButton = document.getElementById('logoutButton');
logoutButton.addEventListener('click', logout);