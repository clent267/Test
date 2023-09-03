// Function to send a GET request to the logout endpoint
function logout() {
    fetch('/api/logout', {
      method: 'GET',
      credentials: 'same-origin' // Include cookies in the request
    })
      .then(response => {
        if (response.ok) {
          // Redirect to the login page after successful logout
          window.location.href = '/login';
        } else {
          return response.text().then(errorMessage => {
            throw new Error(errorMessage);
          });
        }
      })
      .catch(error => {
        console.error('Logout failed:', error);
        // Display an error message to the user
        alert('Logout failed');
      });
  }
  
  // Add event listener to the logout button
  const logoutButton = document.getElementById('logoutButton');
  logoutButton.addEventListener('click', logout);
  