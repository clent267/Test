require('dotenv').config();
const faunadb = require('faunadb');
const client = new faunadb.Client({
    secret: process.env.FAUNADB_SECRET,
});
const q = faunadb.query;

async function deleteaccountsapi(req, res) {
    try {
        // Retrieve user ID from request or session
        
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
                message: 'You don\'t have any Accounts in the database'
            });
        }

        const accountRefs = AccountsCheck.data.map(account => q.Select('ref', account));

        // Check if the user has any accounts
        if (accountRefs.length > 0) {
            await client.query(
                q.Map(
                    accountRefs,
                    q.Lambda('ref', q.Delete(q.Var('ref')))
                )
            );

            res.status(200).json({
                message: "Accounts deleted",
            });
        } else {
            res.status(200).json({
                message: "No accounts found",
            });
        }

    } catch (error) {
        console.log(error);
        res.status(400).json({
            message: 'Failed to retrieve or delete your accounts',
        });
    }
}

module.exports = deleteaccountsapi;
