require('dotenv').config();
const faunadb = require('faunadb');

const client = new faunadb.Client({
  secret: process.env.FAUNADB_SECRET,
});
const q = faunadb.query;

async function logoutapi(req, res) {

    const sessionToken = req.cookies.Account_Session;

  try {
    // Retrieve the session with the given session token
    const session = await client.query(q.Get(q.Match(q.Index('sessions_by_token'), sessionToken)));

    // Delete the session
    await client.query(q.Delete(session.ref));

    // Clear the session token cookie
    res.clearCookie('Account_Session');

    res.status(200).json({
      message: 'Logged out successfully',
    });
  } catch (error) {
    res.status(400).json({
      message: 'Logout failed',
    });
  }
  
}

module.exports = logoutapi;
