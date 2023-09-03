const axios = require('axios');
require('dotenv').config();
const bcrypt = require('bcrypt');
const faunadb = require('faunadb');
const client = new faunadb.Client({
  secret: process.env.FAUNADB_SECRET,
});
const q = faunadb.query;

function generateToken(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    token += characters.charAt(randomIndex);
  }
  return token;
}

async function discordloginapi(req, res) {
  const { code } = req.query;

  // Check for empty fields
  const requiredFields = ['code'];
  const missingFields = requiredFields.filter((field) => !req.query[field]);

  if (missingFields.length > 0) {
    return res.status(400).json({ message: `Missing required fields: ${missingFields.join(', ')}` });
  }

  try {
    const tokenUrl = 'https://discord.com/api/oauth2/token';
    const data = {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: process.env.REDIRECT_URI_LOGIN,
      scope: 'identify'
    };

    const tokenResponse = await axios.post(tokenUrl, new URLSearchParams(data), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
  
    const { access_token } = tokenResponse.data;

    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const { id } = userResponse.data;

    try {
      const user = await client.query(q.Get(q.Match(q.Index('users_by_discord_id'), id)));

      // Create a new session
      const sessionToken = generateToken(32);
      client.query(
        q.Create(q.Collection('sessions'), {
          data: {
            user: user.ref,
            session_token: sessionToken,
          },
        })
      );

      const options = {
        secure: true, // Cookie will only be sent over HTTPS
        maxAge: 30 * 24 * 60 * 60 * 1000, // Cookie will expire after 30 days (in milliseconds)
      };
      res.cookie('Account_Session', sessionToken, options);
      res.redirect('/index');
    } catch (error) {
      console.error('An error occurred while creating a session:', error);

      if (error.name === 'NotFound') {
        // Handle the case where there is no match (user not found)
        return res.redirect('/discord-verification?err=User not found in this discord account');
      } else {
        // Handle other types of errors
        return res.redirect('/discord-verification?err=An error occurred');
      }
    }
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.redirect('/discord-verification?err=Discord User not found');
    } else {
      console.error('An error occurred during Discord login:', error);
      return res.redirect('/discord-verification?err=An error occurred');
    }
  }
}

module.exports = discordloginapi;
