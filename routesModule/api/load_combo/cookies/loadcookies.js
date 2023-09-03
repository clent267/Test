require('dotenv').config();
const faunadb = require('faunadb');
const client = new faunadb.Client({
    secret: process.env.FAUNADB_SECRET,
});
const q = faunadb.query;

async function loadcookiesapi(req, res) {
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

        let CookiesCheck;
        try {
            CookiesCheck = await client.query(q.Map(
                q.Paginate(q.Match(q.Index('rbx_cookies_by_user_id'), user_id)),
                q.Lambda('cookies', q.Get(q.Var('cookies')))
            ));
        } catch (error) {
            return res.status(404).json({
                message: 'You don\'t have any Cookies in the database'
            });
        }

        const cookies = CookiesCheck.data.map(cookies => cookies.data.rbxcookie);

        res.status(200).json({
            message: "Your Cookies retrieved",
            cookies,
        });

    } catch (error) {
        console.log(error);
        res.status(400).json({
            message: 'Failed to retrieve your cookies',
        });
    }
}

module.exports = loadcookiesapi;