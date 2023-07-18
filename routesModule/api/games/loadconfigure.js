require('dotenv').config();
const express = require('express');
const axios = require('axios');
const faunadb = require('faunadb');
const client = new faunadb.Client({
  secret: process.env.FAUNADB_SECRET,
});
const q = faunadb.query;

async function loadconfiguresapi(req, res) {
  const game_id = req.query.gameId;


  const requiredFields = ['gameId'];
  const missingFields = requiredFields.filter((field) => !req.query[field]);

  if (missingFields.length > 0) {
    return res.status(400).json({ message: `Missing required fields: ${missingFields.join(', ')}` });
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

    // Retrieve the game configuration from the users_games collection
    const gameConfig = await client.query(
      q.Get(q.Match(q.Index('users_games_by_game_id'), game_id))
    );
    if (gameConfig.data.user_id !== user_id) {
      return res.status(403).json({ message: 'You are not authorized to view the game configuration' });
    }

    const config_info = gameConfig.data.config_info;

    res.status(200).json({
      message: 'Game configuration retrieved successfully',
      config_info,
    });
  } catch (error) {
    res.status(400).json({
      message: 'Failed to retrieve game configuration',
    });
  }
}

module.exports = loadconfiguresapi;
