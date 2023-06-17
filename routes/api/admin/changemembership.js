require('dotenv').config();
const faunadb = require('faunadb');
const client = new faunadb.Client({
  secret: process.env.FAUNADB_SECRET,
});
const q = faunadb.query;

async function updatemembershipapi(req, res) {
  const { username, membershipType, blacklistReason } = req.body;

  // Check for empty fields
  const requiredFields = ['username', 'membershipType', 'blacklistReason'];
  const missingFields = requiredFields.filter((field) => !req.body[field]);

  if (missingFields.length > 0) {
    return res.status(400).json({ message: `Missing required fields: ${missingFields.join(', ')}` });
  }

  try {
    const sessionToken = req.cookies.Account_Session;

    const userRefFromSession = await client.query(
      q.Map(
        q.Paginate(q.Match(q.Index('sessions_by_token'), sessionToken)),
        q.Lambda((x) => {
          return {
            ref: q.Select(['data', 'user'], q.Get(x)),
          };
        })
      )
    );

    const refid = userRefFromSession.data[0].ref.id;

    const userData = await client.query(
        q.Map(
            q.Paginate(q.Ref(q.Collection('users'), refid)),
            q.Lambda((x) => ({
                user_id: q.Select(['ref', 'id'], q.Get(x)),
                membership: q.Select(['data', 'membership'], q.Get(x))
            }))
        )
    );

    const membership = userData.data[0].membership;

    if (membership !== 'Admin' && membership !== 'Owner') {
      return res.status(403).json({ message: 'Access Denied' });
    }

    if (membership === 'Moderator') {
      return res.status(403).json({ message: 'Moderation cannot update the membership.' });
    }

    const usertoupdate = await client.query(q.Get(q.Match(q.Index('users_by_username'), username)));

    if (membershipType === 'Blacklist') {
      // Update the user's membership and blacklistinfo
      
      await client.query(
        q.Update(usertoupdate.ref, {
          data: {
            membership: membershipType,
            blacklistinfo: {
              status: true,
              reason: blacklistReason,
            },
          },
        })
      );
    } else if (membershipType === 'UnBlacklist') {
      membershipType = 'Customer';
    }

    // Update the user's membership
    await client.query(
      q.Update(usertoupdate.ref, {
        data: {
          membership: membershipType,
        },
      })
    );

    res.status(200).json({ message: 'Membership updated successfully' });
  } catch (error) {
    console.log(error)
    if (error.message === 'instance not found') {
      res.status(404).json({ message: 'User not found' });
    } else {
      res.status(500).json({ message: 'An error occurred' });
    }
  }
}

module.exports = updatemembershipapi;
