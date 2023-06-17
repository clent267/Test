const axios = require('axios');

async function xcsrftoken() {
    const postData = {};
    const config = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    let responseHeaders;
    try {
        const response = await axios.post('https://auth.roblox.com/v2/login', postData, config);
        responseHeaders = response.headers;
    } catch (error) {
        responseHeaders = error.response.headers;
    }
    return responseHeaders['x-csrf-token'];
}

async function getarkoseblob(req, res) {

    const { Username,Password} = req.body;

    const requiredFields = ['Username','Password'];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
        return res.status(400).json({
            message: `Missing required fields: ${missingFields.join(', ')}`
        });
    }

    const token = await xcsrftoken();
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
    };

    let responseHeaders;
    try {
        const response = await axios.post('https://auth.roblox.com/v2/login', postData, config);
        responseHeaders = response.headers;
    } catch (error) {
        responseHeaders = error.response.headers;
        const errorData = JSON.stringify(error.response.data);

        const challangemetadata = responseHeaders["rblx-challenge-metadata"];
        const challangeid = responseHeaders["rblx-challenge-id"];
        const buffer = Buffer.from(challangemetadata, 'base64');
        const decodedmetadata = buffer.toString('utf-8');

        res.status(200).json({
            challange_id: challangeid,
            data: decodedmetadata,
        });
    }

}

module.exports = getarkoseblob;