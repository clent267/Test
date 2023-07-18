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

async function loginapi(req, res) {
  const { username, password } = req.body;

  // Check for empty fields
  const requiredFields = ['username', 'password'];
  const missingFields = requiredFields.filter((field) => !req.body[field]);

  if (missingFields.length > 0) {
    return res.status(400).json({ message: `Missing required fields: ${missingFields.join(', ')}` });
  }

  try {
    // Retrieve the user with the given username
    const user = await client.query(
      q.Get(q.Match(q.Index('users_by_username'), q.Casefold(username)))
    );

    // Compare the provided password with the hashed password stored in the database
    const passwordMatch = await bcrypt.compare(password, user.data.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Incorrect Password' });
    }

    // Generate a new session token
    const sessionToken = generateToken(50);

    // Create a new session
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

    res.status(200).json({ message: 'Logged in successfully' });
  } catch (error) {
    if (error.message === 'instance not found') {
      res.status(404).json({ message: 'User not found' });
    } else {
      res.status(500).json({ message: 'An error occurred' });
    }
  }
}

module.exports = loginapi;
