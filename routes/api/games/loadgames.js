require('dotenv').config();
const faunadb = require('faunadb');
const client = new faunadb.Client({
    secret: process.env.FAUNADB_SECRET,
});
const q = faunadb.query;

async function loadconfiguresapi(req, res) {
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

        let GameidsCheck;
        try {
            GameidsCheck = await client.query(q.Map(
                q.Paginate(q.Match(q.Index('users_games_by_user_id'), user_id)),
                q.Lambda('game', q.Get(q.Var('game')))
            ));
        } catch (error) {
            return res.status(404).json({
                message: 'You don\'t have any game IDs in the database'
            });
        }

        const gameIds = GameidsCheck.data.map(game => game.data.game_id);
        const totalGames = gameIds.length;
        const maxLimit = process.env.GAME_LIMIT; // Specify the maximum limit here

        res.status(200).json({
            totalGames,
            maxLimit,
            gameIds
        });

    } catch (error) {
        res.status(400).json({
            message: 'Failed to retrieve games',
        });
    }
}

module.exports = loadconfiguresapi;