require('dotenv').config();
const fs = require('fs');
const faunadb = require('faunadb');
const client = new faunadb.Client({
    secret: process.env.FAUNADB_SECRET,
});
const q = faunadb.query;

async function downloadaccountsapi(req, res) {
    try {

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
                    user_id: q.Select(['ref', 'id'], q.Get(x)),
                }))
            )
        );

        const user_id = userData.data[0].user_id;

        let AccountsCheck;
        try {
            AccountsCheck = await client.query(
                q.Map(
                    q.Paginate(q.Match(q.Index('rbx_accounts_by_user_id'), user_id)),
                    q.Lambda('account', q.Get(q.Var('account')))
                )
            );
        } catch (error) {
            return res.status(404).json({
                message: 'You don\'t have any Checked Accounts in the database'
            });
        }

        const accounts = AccountsCheck.data.map(account => ({
            rbxusername: account.data.rbxusername,
            rbxpassword: account.data.rbxpassword,
        }));

        const fileName = 'Accounts.txt';
        const fileContent = accounts.map(account => `${account.rbxusername}:${account.rbxpassword}`).join('\n');

        // Create the file
        fs.writeFile(fileName, fileContent, (err) => {
            if (err) {
                console.error('Error creating file:', err);
                return res.status(500).send('Error creating file');
            }

            // Set the content disposition header to force download
            res.attachment(fileName);

            // Stream the file to the response
            const fileStream = fs.createReadStream(fileName);
            fileStream.pipe(res);

            // Cleanup: Remove the file after download
            fileStream.on('end', () => {
                fs.unlink(fileName, (err) => {
                    if (err) {
                        console.error('Error deleting file:', err);
                    }
                });
            });
        });
    } catch (error) {
        console.log(error);
        return res.status(400).json({
            message: 'Failed to retrieve your accounts',
        });
    }
}

module.exports = downloadaccountsapi;
