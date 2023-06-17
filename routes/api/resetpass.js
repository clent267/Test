require('dotenv').config();
const nodemailer = require('nodemailer');
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

async function resetpassapi(req, res) {

  const { key, password } = req.body;

  try {
    // Find the reset token in the password_reset_tokens collection
    const tokenDoc = await client.query(
      q.Get(q.Match(q.Index('password_reset_tokens_by_token'), key))
    );

    const { email } = tokenDoc.data;

    // Find the user associated with the reset token
    const user = await client.query(q.Get(q.Match(q.Index('users_by_email'), email)));

    // Update the user's password
    const hashedPassword = await bcrypt.hash(password, 10);
    await client.query(q.Update(user.ref, { data: { password: hashedPassword } }));

    // Delete the reset token from the password_reset_tokens collection
    await client.query(q.Delete(tokenDoc.ref));

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

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    if (error instanceof faunadb.errors.NotFound) {
      res.status(404).json({ message: 'Invalid or expired reset token' });
    } else {
      res.status(500).json({ message: 'An error occurred' });
    }
  }
}

module.exports = resetpassapi;
