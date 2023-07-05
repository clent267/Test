const axios = require('axios');
const fs = require('fs');
const path = require('path');
const HttpsProxyAgent = require('https-proxy-agent');
const { compareSync } = require('bcrypt');
const proxies = fs.readFileSync(path.join(__dirname, '../login_checker/proxy.txt'), 'utf8').split('\n');

async function checkProxy(proxy) {
    try {
        const agent = new HttpsProxyAgent(`http://${proxy}`);
        const response = await axios.get('https://www.roblox.com/', {
            httpsAgent: agent,
            timeout: 2000,
        });
        
        return response.status === 200;
    } catch (error) {
        return false;
    }
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

async function updateWorkingProxies() {
    shuffle(proxies);

    let foundProxy = null;

    const proxyPromises = proxies.map(async (proxy) => {
        const isWorking = await checkProxy(proxy);
        if (isWorking) {
            foundProxy = proxy;
            throw new Error('Working proxy found'); // Throw an error to stop Promise.all
        }else{
            // Remove the non-working proxy from the file
            const proxyIndex = proxies.indexOf(proxy);
            if (proxyIndex > -1) {
                proxies.splice(proxyIndex, 1);
                fs.writeFileSync(path.join(__dirname, '../login_checker/proxy.txt'), proxies.join('\n'), 'utf8');
            }
        }
    });

    try {
        await Promise.all(proxyPromises);
    } catch (error) {
        if (error.message === 'Working proxy found') {
            return foundProxy; // Return the working proxy immediately
        }
        throw error;
    }

    return null; // No working proxy found
}

let proxyUrl = null;

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
        timeout: 1700,
    };

    let responseHeaders;
    try {
        const response = await axios.post('https://auth.roblox.com/v2/login', postData, config);
        responseHeaders = response.headers;
    } catch (error) {
        if (error.response === undefined || error.response.headers === undefined) {
            console.log("Axios failed to retrieve the x-csrf-token. Refreshing the server and updating the proxy...");
            restartServer(req, res);
            return;
        } 
        responseHeaders = error.response.headers;                 
    }
    return responseHeaders['x-csrf-token'];
}

async function getarkoseblob(req, res) {

    if (req.method === 'POST') {
        try {
            const workingProxy = await updateWorkingProxies();
  
            if (workingProxy) {
                proxyUrl = `http://${workingProxy}`;
                console.log('New Proxy To This Checker:', workingProxy);
            } else {
                console.log('No working proxy found.');
            }
        } catch (error) {
            console.error('Error:', error);
            restartServer(req, res);
        }
    } else {
        if (!proxyUrl) {
            try {
                const workingProxy = await updateWorkingProxies();
  
                if (workingProxy) {
                    proxyUrl = `http://${workingProxy}`;
                    console.log('Proxy Updated:', workingProxy);
                } else {
                    console.log('No working proxy found.');
                }
            } catch (error) {
                console.error('Error:', error);
                restartServer(req, res);
            }
        }
    }
    const { Username,Password} = req.body;

    const requiredFields = ['Username','Password'];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
        return res.status(400).json({
            message: `Missing required fields: ${missingFields.join(', ')}`
        });
    }

    const token = await xcsrftoken(req,res,proxyUrl);
    const postData = {
        ctype: 'username',
        cvalue: Username,
        password: Password
    };

    const config = {
        headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': token,
        },
        httpsAgent: new HttpsProxyAgent(proxyUrl),
        timeout: 2000,
    };

    let responseHeaders;
    try {
        const response = await axios.post('https://auth.roblox.com/v2/login', postData, config);
        responseHeaders = response.headers;
    } catch (error) {

        console.log(error);
        if (error.response === undefined || error.response.headers === undefined) {
            console.log("Axios failed to retrive the rblx-challenge-metadata. Refreshing the server and updating the proxy...");
            restartServer(req, res);
            return;
        }
        responseHeaders = error.response.headers;

        if (responseHeaders["rblx-challenge-metadata"] === undefined) {
            console.log("Axios failed to retrive the rblx-challenge-metadata. Refreshing the server and updating the proxy...");
            restartServer(req, res);
            return;
        }

        const challangemetadata = responseHeaders["rblx-challenge-metadata"];
        const challangeid = responseHeaders["rblx-challenge-id"];
        const buffer = Buffer.from(challangemetadata, 'base64');
        const decodedmetadata = buffer.toString('utf-8');

        res.status(200).json({
            challange_id: challangeid,
            data: decodedmetadata,
            proxy: proxyUrl,
            xcsrftoken: token,
        });
        
    }

}

module.exports = getarkoseblob;