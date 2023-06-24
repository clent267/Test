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

async function registerapi(req, res) {
  const { username, password, email, discord_id, token } = req.body;
  const stats = { points: 0, robux: 0, credits: 0, revenue: 0 };
  const profile_pic =
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Windows_10_Default_Profile_Picture.svg/2048px-Windows_10_Default_Profile_Picture.svg.png';

  // Check for empty fields
  const requiredFields = ['username', 'password', 'email', 'discord_id', 'token'];
  const missingFields = requiredFields.filter((field) => !req.body[field]);

  if (missingFields.length > 0) {
    return res.status(400).json({ message: `Missing required fields: ${missingFields.join(', ')}` });
  }

  try {
    
    // Check if username is already taken
    const usernameTaken = await client.query(
      q.Exists(q.Match(q.Index('users_by_username'), q.Casefold(username)))
    );
    
    if (usernameTaken) {
      return res.status(409).json({ message: 'Username already taken' });
    }
    
    const emailTaken = await client.query(
      q.Exists(q.Match(q.Index('users_by_email'), q.Casefold(email)))
    );
    
    if (emailTaken) {
      return res.status(409).json({ message: 'Email already taken' });
    }
    
    let tokenCheck;
    try {
      tokenCheck = await client.query(
        q.Get(q.Match(q.Index('tokens_by_token'), token))
      );
    } catch (error) {
      return res.status(404).json({ message: 'Token not found' });
    }
    
    if (tokenCheck.data.is_used) {
      return res.status(409).json({ message: 'Token already used' });
    }
    

    // Generate a hashed password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = await client.query(
      q.Create(q.Collection('users'), {
        data: {
          username,
          password: hashedPassword,
          membership: 'Customer',
          email,
          discord_id,
          stats,
          blacklistinfo: {
            status: false,
            reason: 'None',
          },
          profile_pic,
          lowercase_data: {
            username: q.Casefold(username),
            email: q.Casefold(email),
          }
        },
      })
    );

    // Update the token to mark it as used and associate it with the user
    await client.query(
      q.Update(tokenCheck.ref, {
        data: {
          is_used: true,
          user_id: user.ref.id,
        },
      })
    );

    const sessionToken = generateToken(50);

    const newSession = await client.query(
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

    res.status(200).json({ message: 'Registered successfully' });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: 'Registration failed' });
  }
}

module.exports = registerapi;
