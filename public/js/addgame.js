function handleAddGame(event) {
    event.preventDefault();
    const submitButton = document.getElementById('submitButton');
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Adding Game...';
    submitButton.disabled = true;

    const game_id = document.getElementById('gameid').value;

    // Perform game whitelisting request
    fetch('/api/addgame', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            game_id,
        })
    }).then(response => {
        if (response.ok) {
            // Game whitelisting successful, display success message
            swal("Success", "Game Whitelisted", "success");
        } else {
            return response.json().then(data => {
                throw new Error(data.message);
            });
        }
    }).catch(error => {
        console.error('Error during game whitelisting:', error);
        swal("Error", error.message || "Game Whitelist Error. Please Try Again", "error");
    }).finally(() => {
        // Revert the button state
        submitButton.innerHTML = 'Submit';
        submitButton.disabled = false;
    });
}