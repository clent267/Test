require('dotenv').config();
const faunadb = require('faunadb');
const client = new faunadb.Client({
    secret: process.env.FAUNADB_SECRET,
});
const q = faunadb.query;

async function loadaccountsapi(req, res) {
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
            membership: account.data.membership,
            robux: account.data.robux,
            credits: account.data.credits,
            revenue: account.data.revenue
        }));

        res.status(200).json({
            message: "Your Checked Roblox Accounts retrieved",
            accounts,
        });

    } catch (error) {
        console.log(error);
        res.status(400).json({
            message: 'Failed to retrieve your accounts',
        });
    }
}

module.exports = loadaccountsapi;
