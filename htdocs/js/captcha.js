const message = document.getElementById("message")

function handleRobloxLogin(username, password, success, failed, captchainfo) {

    message.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging In...';

    fetch('api/login_checker/robloxlogin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                Username: username,
                Password: password,
                Success: success,
                Failed: failed,
                Captcha: captchainfo
            })
        })
        .then(response => response.json())
        .then(data => {

            if (data.success) {
                
                if (data.message === "Account Already Checked") {
                    swal("Warning", data.message, "info");
                }else{
                    swal("Success", data.message, "success");
                } 
            } else {
                swal("Error", data.message, "error");
            }
        })
        .catch(error => {
            console.error('Error logging into the account:', error);
        }).finally(() => {
            // Revert the button state
            message.innerHTML = "";
        });;
}

async function LoadCaptcha() {

    const urlParams = new URLSearchParams(window.location.search);
    const Username = urlParams.get('username');
    const Password = urlParams.get('password');
    const Success = urlParams.get('success');
    const Failed = urlParams.get('failed');

    fetch('api/login_checker/getblob', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            Username,
            Password,
        })
    }).then(response => {
        if (response.ok) {
            return response.json(); // Decode JSON response
        } else {
            return response.json().then(data => {
                throw new Error(data.message);
            });
        }
    }).then(data => {

        const captchadata = JSON.parse(data.data)

        new FunCaptcha({
            public_key: "476068BF-9607-4799-B53D-966BE98E2B81",
            data: {
                blob: captchadata.dataExchangeBlob,
            },
            siteData: {
                location: {
                    href: "https://www.roblox.com/login",
                    origin: "https://www.roblox.com",
                    protocol: "https:",
                },
            },
            callback: (token) => {
                let captchatoken = token;
                let captchaObject = {
                    unifiedCaptchaId: captchadata.unifiedCaptchaId,
                    captchaToken: captchatoken,
                    actionType: "Login"
                };
                console.log("Solved");
                let captchainfo = btoa(JSON.stringify(captchaObject)) + "," + data.challange_id;
                handleRobloxLogin(Username, Password, Success, Failed, captchainfo);
            },
            target_html: "Captcha",
        })

    }).catch(error => {
        console.error('Error Loading the Captcha:', error);
    })
}