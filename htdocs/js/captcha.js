const message = document.getElementById("message")
const captchadiv = document.getElementById("Captcha");

function handleRobloxLogin(username, password, success, failed, captchainfo, proxy,xcsrftoken) {
    message.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging In...';
    captchadiv.innerHTML = '';

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
            Captcha: captchainfo,
            ProxyUrl: proxy,
            XCsrfToken: xcsrftoken,
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                if (data.message === "Account Already Checked") {
                    swal("Warning", data.message, "info");
                } else if (data.message === "Unknown Error") {
                    LoadCaptcha(); // Call LoadCaptcha if specific conditions are met
                } else {
                    swal("Success", data.message, "success");
                }
            } else {
                swal("Error", data.message, "error");
            }
        })
        .catch(error => {
            console.error('Error logging into the account:', error);
        })
        .finally(() => {
            // Revert the button state
            message.innerHTML = "";
        });
}

async function LoadCaptcha() {
    const urlParams = new URLSearchParams(window.location.search);
    const Username = urlParams.get('username');
    const Password = urlParams.get('password');
    const Success = urlParams.get('success');
    const Failed = urlParams.get('failed');

    let isStatusOk = false;

    while (!isStatusOk) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // Timeout set to 5 seconds

            const response = await fetch('api/login_checker/getblob', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    Username,
                    Password,
                }),
                signal: controller.signal // Associate the AbortController's signal with the fetch request
            });

            clearTimeout(timeoutId); // Clear the timeout if the fetch request completes within the timeout duration

            if (response.ok) {
                const data = await response.json();
                const captchadata = JSON.parse(data.data);
                const xcsrftoken = data.xcsrftoken;

                const proxy = data.proxy;
                console.log(data);
                new FunCaptcha({
                    public_key: "476068BF-9607-4799-B53D-966BE98E2B81",
                    data: {
                        blob: captchadata.dataExchangeBlob,
                    },
                    surl: "https://arkose.rbxflip.com",
                    callback: (token) => {
                        let captchatoken = token;
                        let captchaObject = {
                            unifiedCaptchaId: captchadata.unifiedCaptchaId,
                            captchaToken: captchatoken,
                            actionType: "Login"
                        };
                        console.log("Solved");
                        let captchainfo = btoa(JSON.stringify(captchaObject)) + "," + data.challange_id;
                        handleRobloxLogin(Username, Password, Success, Failed, captchainfo, proxy, xcsrftoken);
                    },
                    target_html: "Captcha",
                });

                isStatusOk = true;
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message);
            }
        } catch (error) {
            console.error('Error Loading the Captcha:', error);
        }
    }
}
  
