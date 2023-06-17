require('dotenv').config();
const faunadb = require('faunadb');
const client = new faunadb.Client({
  secret: process.env.FAUNADB_SECRET,
});
const q = faunadb.query;

async function usersapi(req, res) {

  try {
    // Retrieve all users
    const sessionToken = req.cookies.Account_Session;

    const user_ref_from_session = await client.query(
      q.Map(
        q.Paginate(q.Match(q.Index('sessions_by_token'), sessionToken)),
        q.Lambda(x => {
          return {
            ref: q.Select(['data', 'user'], q.Get(x)),
          };
        })
      )
    );

    const refid = user_ref_from_session.data[0].ref.value.id

    const userData = await client.query(
      q.Map(
          q.Paginate(q.Ref(q.Collection('users'), refid)),
          q.Lambda((x) => ({
            stats: q.Select(['data', 'stats'], q.Get(x)),
            discord_id: q.Select(['data', 'discord_id'], q.Get(x)),
            username: q.Select(['data', 'username'], q.Get(x)),
            profile_pic: q.Select(['data', 'profile_pic'], q.Get(x)),
          }))
      )
    );

    res.status(200).json({
      message: 'Users retrieved successfully',
      data: userData.data.map(user => ({
        stats: user.stats,
        discord_id: user.discord_id,
        username: user.username,
        profile_pic: user.profile_pic
      }))
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      message: 'Failed to retrieve user data',
    });
  }
}

module.exports = usersapi;
