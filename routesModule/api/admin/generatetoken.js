require('dotenv').config();
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

async function gentokenapi(req, res) {
    const {} = req.body;

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
                  membership: q.Select(['data', 'membership'], q.Get(x))
                }))
            )
        );

        const membership = userData.data[0].membership;

        if (membership !== 'Admin' && membership !== 'Owner') {
            return res.status(403).json({ message: 'Access Denied' });
        }
        
        const token = `${generateToken(7)}-${generateToken(7)}-${generateToken(7)}`

        const newToken = await client.query(
            q.Create(q.Collection('tokens'), {
                data: {
                    token: token,
                    is_used: false,
                    rbx_user_id: null,
                },
            })
        );

        res.status(200).json({
            message: 'Token generated',
            token: token,
        });


    } catch (error) {

        res.status(400).json({
            message: 'Token generation failed',
        });
    }
}

module.exports = gentokenapi;