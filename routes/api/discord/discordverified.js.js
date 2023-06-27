const axios = require('axios');
require('dotenv').config();
const bcrypt = require('bcrypt');
const faunadb = require('faunadb');
const client = new faunadb.Client({
    secret: process.env.FAUNADB_SECRET,
});
const q = faunadb.query;

async function discordverifiedapi(req, res) {
    const {
        code
    } = req.query;

    // Check for empty fields
    const requiredFields = ['code'];
    const missingFields = requiredFields.filter((field) => !req.query[field]);

    if (missingFields.length > 0) {
        return res.status(400).json({
            message: `Missing required fields: ${missingFields.join(', ')}`
        });
    }

    const sessionToken = req.cookies.Account_Session;

    const userRefFromSession = await client.query(
        q.Map(
            q.Paginate(q.Match(q.Index('sessions_by_token'), sessionToken)),
            q.Lambda(x => ({
                ref: q.Select(['data', 'user'], q.Get(x)),
            }))
        )
    );

    const refId = userRefFromSession.data[0].ref.value.id;

    const userData = await client.query(
        q.Map(
            q.Paginate(q.Ref(q.Collection('users'), refId)),
            q.Lambda(x => ({
                user_id: q.Select(['ref', 'id'], q.Get(x)),
            }))
        )
    );

    const user_id = userData.data[0].user_id;

    try {
        const tokenUrl = 'https://discord.com/api/oauth2/token';
        const data = {
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: process.env.REDIRECT_URI_VERIFICATION,
            scope: 'identify'
        };

        const tokenResponse = await axios.post(tokenUrl, new URLSearchParams(data), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const {
            access_token
        } = tokenResponse.data;

        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });

        const {
            id
        } = userResponse.data;

        const DiscordTaken = await client.query(
            q.Exists(q.Match(q.Index('users_by_discord_id'), id))
        );

        if (DiscordTaken) {
            return res.redirect('/discord-verification?err=Discord Account Already Taken');
        }

        const user = await client.query(q.Get(q.Ref(q.Collection('users'), user_id)));

        await client.query(
            q.Update(user.ref, {
                data: {
                    discord_id: id,
                },
            })
        );

        return res.redirect('/index');

    } catch (error) {
        if (error.response && error.response.status === 404) {
            return res.redirect('/discord-verification?err=Discord User not found');
        } else {
            console.error('An error occurred during Discord Verifying:', error);
            return res.redirect('/discord-verification?err=An error occurred');
        }
    }
}

module.exports = discordverifiedapi;