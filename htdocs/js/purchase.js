function handlePurchase(event) {
    event.preventDefault();
    const rbxusername = document.getElementById('rbxusername').value;
    const email = document.getElementById('email').value;
    const purchaseButton = document.getElementById('purchaseButton');

    // Disable the button and show loading animation
    purchaseButton.disabled = true;
    purchaseButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Purchasing...';

    // Perform login request
    fetch('/api/purchase', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            rbxusername,
            email
        })
    }).then(response => {
        if (response.ok) {
            swal("Success", "Purchase successful. Please check your email.", "success");
        } else {
            return response.json().then(data => {
                throw new Error(data.message);
            });
        }
    }).catch(error => {
        console.error('Error during purchase:', error);
        swal("Error", error.message || "Purchase Error Please Try Again", "error");
    }).finally(() => {
        // Revert the button state
        purchaseButton.innerHTML = 'Purchase';
        purchaseButton.disabled = false;
    });
}