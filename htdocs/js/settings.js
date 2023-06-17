function handleChangePassword(event) {
    event.preventDefault();
    const oldPassword = document.getElementById('oldpassword').value;
    const newPassword = document.getElementById('newpassword').value;
    const confirmPassword = document.getElementById('confirmpassword').value;
    // Check if the new password and confirm password match
    if (newPassword !== confirmPassword) {
        swal("Error", "New password and confirm password do not match", "error");
        return;
    }
    const changepasswordbutton = document.getElementById('changepasswordbutton');
    changepasswordbutton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Changing...';
    changepasswordbutton.disabled = true;
    // Perform password change request
    fetch('/api/updatepassword', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            oldPassword,
            newPassword
        })
    }).then(response => {
        if (response.ok) {
            swal("Success", "Password Change successfully", "success");
        } else {
            return response.json().then(data => {
                throw new Error(data.message);
            });
        }
    }).catch(error => {
        console.error('Error during password change:', error);
        swal("Error", error.message || "Password Change Error. Please try again.", "error");
    }).finally(() => {
        // Revert the button state
        changepasswordbutton.innerHTML = 'Change Password';
        changepasswordbutton.disabled = false;
    });;
}

function checkPasswordMatch() {
    const password = document.getElementById('newpassword').value;
    const confirmPassword = document.getElementById('confirmpassword').value;
    const passwordMatchText = document.getElementById('passwordMatchText');
    if (password !== confirmPassword) {
        passwordMatchText.textContent = 'Passwords do not match';
        passwordMatchText.style.color = 'red';
    } else {
        passwordMatchText.textContent = 'Passwords match';
        passwordMatchText.style.color = 'green';
    }
}

function handleChangeUsername(event) {
    event.preventDefault();
    const password = document.getElementById('usernamepassword').value;
    const newUsername = document.getElementById('newusername').value;
    const changeusernamebutton = document.getElementById('changeusernamebutton');
    changeusernamebutton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Changing...';
    changeusernamebutton.disabled = true;
    // Perform username change request
    fetch('/api/updateusername', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            password,
            newUsername
        })
    }).then(response => {
        if (response.ok) {
            swal("Success", "Username changed successfully", "success");
        } else {
            return response.json().then(data => {
                throw new Error(data.message);
            });
        }
    }).catch(error => {
        console.error('Error during username change:', error);
        swal("Error", error.message || "Username change error. Please try again.", "error");
    }).finally(() => {
        // Revert the button state
        changeusernamebutton.innerHTML = 'Change Username';
        changeusernamebutton.disabled = false;
    });
}

function handleChangeEmail(event) {
    event.preventDefault();
    const password = document.getElementById('emailpassword').value;
    const newEmail = document.getElementById('newemail').value;

    const changeemailbutton = document.getElementById('changeemailbutton');
    changeemailbutton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Updating...';
    changeemailbutton.disabled = true;

    // Perform email update request
    fetch('/api/updatemeail', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                password,
                newEmail
            })
        })
        .then(response => {
            if (response.ok) {
                swal("Success", "Email updated successfully", "success");
            } else {
                return response.json().then(data => {
                    throw new Error(data.message);
                });
            }
        })
        .catch(error => {
            console.error('Error during email update:', error);
            swal("Error", error.message || "Email Update Error. Please try again.", "error");
        })
        .finally(() => {
            // Revert the button state
            changeemailbutton.innerHTML = 'Update Email';
            changeemailbutton.disabled = false;
        });
}


function handleUpdateProfilePicture(event) {
    event.preventDefault();
    const profilePicture = document.getElementById('profilepicture').files[0];

    const updateprofilepicturebutton = document.getElementById('updateprofilepicturebutton');
    updateprofilepicturebutton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Updating...';
    updateprofilepicturebutton.disabled = true;

    // Prepare form data
    const formData = new FormData();
    formData.append('profilePicture', profilePicture);

    // Perform profile picture update request
    fetch('/api/updateprofilepicture', {
        method: 'POST',
        body: formData
      })
        .then(response => {
          if (response.ok) {
            return response.json();
          } else {
            return response.json().then(data => {
              throw new Error(data.message);
            });
          }
        })
        .then(data => {
          // Process the response data if needed
          // Display a success message
          const profile_pic = document.getElementById('profile_pic');
		  profile_pic.setAttribute("src", data.imageUrl);
          swal("Success", "Profile picture updated successfully", "success");
        })
        .catch(error => {
          console.error('Error during profile picture update:', error);
          swal("Error", error.message || "Profile Picture Update Error. Please try again.", "error");
        })
        .finally(() => {
          // Revert the button state
          updateprofilepicturebutton.innerHTML = 'Update Profile Picture';
          updateprofilepicturebutton.disabled = false;
        });
}

function handleLogoutSession(event) {
    event.preventDefault();

    const logoutbutton = document.getElementById('logoutsessionbutton');
    logoutbutton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging out...';
    logoutbutton.disabled = true;

    // Perform email update request
    fetch('/api/logoutallsession', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        })
        .then(response => {
            if (response.ok) {
                swal("Success", "Logout successfully", "success");
            } else {
                return response.json().then(data => {
                    throw new Error(data.message);
                });
            }
        })
        .catch(error => {
            console.error('Error during Logging out your session:', error);
            swal("Error", error.message || "Logout Error. Please try again.", "error");
        })
        .finally(() => {
            // Revert the button state
            logoutbutton.innerHTML = 'Logout All Sessions';
            logoutbutton.disabled = false;
        });
}    