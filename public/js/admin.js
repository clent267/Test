// Token Generation

function handleGenerateToken(event) {
  event.preventDefault();
  const submitButton = document.getElementById('generatokenButton');
  submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Generating...';
  submitButton.disabled = true;

  fetch('/api/admin/gentoken', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  })
    .then(response => {
      if (response.ok) {
        // Token generated successfully, display success message
        response.json().then(data => {
          const successtoken = document.getElementById("token");
          successtoken.innerHTML = `
            <div class="alert alert-success" role="alert">
              <strong>Well done!</strong> You successfully generated token ${data.token}
            </div>
          `;

          swal("Success", "Token Generated: " + data.token, "success");
        });
      } else {
        return response.json().then(data => {
          throw new Error(data.message);
        });
      }
    })
    .catch(error => {
      console.error('Error during token generation:', error);
      swal("Error", error.message || "Token Generation Error", "error");
    })
    .finally(() => {
      // Revert the button state
      submitButton.innerHTML = 'Generate Token';
      submitButton.disabled = false;
    });
}

// Token Generation Purchase

function handleGenerateTokenPurchase(event) {

  event.preventDefault();
  const submitButton = document.getElementById('generatokenButton1');
  submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Generating...';
  submitButton.disabled = true;

  const email = document.getElementById('email').value;
  const purchaseMethod = document.getElementById('purchaseMethod').value;

  fetch('/api/admin/gentokenpurchase', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({email,purchaseMethod})
  })
    .then(response => {
      if (response.ok) {
        // Token generated successfully, display success message
        response.json().then(data => {
          const successtoken = document.getElementById("token1");
          successtoken.innerHTML = `
            <div class="alert alert-success" role="alert">
              <strong>Well done!</strong> You successfully generated token ${data.token}
            </div>
          `;

          swal("Success", "Token Generated: " + data.token, "success");
        });
      } else {
        return response.json().then(data => {
          throw new Error(data.message);
        });
      }
    })
    .catch(error => {
      console.error('Error during token generation:', error);
      swal("Error", error.message || "Token Generation Error", "error");
    })
    .finally(() => {
      // Revert the button state
      submitButton.innerHTML = 'Generate Token';
      submitButton.disabled = false;
    });
}

//Membership Changer

function handleMembershipOptionChange() {
  const selectedOption = document.getElementById("membership").value;
  const blacklistReasonContainer = document.getElementById("blacklistReasonContainer");

  if (selectedOption === "Blacklist") {
    blacklistReasonContainer.style.display = "block";
  } else {
    blacklistReasonContainer.style.display = "none";
  }
}

function handleMembershipChanger(event){

  event.preventDefault();

  const membershipType = document.getElementById("membership").value;
  const username = document.getElementById("siteusername").value

  let blacklistReason = "None"
  if (membershipType === "Blacklist") {
    blacklistReason = document.getElementById("blacklistReason").value
  }

  event.preventDefault();
  const submitButton = document.getElementById('changemembersip');
  submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Updating Membership...';
  submitButton.disabled = true;


  fetch('/api/admin/changemembership', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({username,membershipType,blacklistReason})
  })
    .then(response => {
      if (response.ok) {
        // membership change successfully, display success message
        response.json().then(data => {
          
          swal("Success", "Membership Changed to : " + membershipType, "success");
        });
      } else {
        return response.json().then(data => {
          throw new Error(data.message);
        });
      }
    })
    .catch(error => {
      console.error('Error changing membership:', error);
      swal("Error", error.message || "Membership Changer have a problem", "error");
    })
    .finally(() => {
      // Revert the button state
      submitButton.innerHTML = 'Change Memberhsip';
      submitButton.disabled = false;
    });

}
