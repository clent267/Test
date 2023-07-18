require('dotenv').config();
const express = require('express');
const axios = require('axios');
const faunadb = require('faunadb');
const client = new faunadb.Client({
  secret: process.env.FAUNADB_SECRET,
});
const q = faunadb.query;

async function deletegameapi(req, res) {
  const { game_id } = req.body;

  // Check for empty fields
  const requiredFields = ['game_id'];
  const missingFields = requiredFields.filter((field) => !req.body[field]);

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

    // Check if the game exists
    const gameExists = await client.query(q.Exists(q.Match(q.Index('users_games_by_game_id'), game_id)));

    if (!gameExists) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // Check if the game belongs to the user
    const game = await client.query(q.Get(q.Match(q.Index('users_games_by_game_id'), game_id)));

    if (game.data.user_id !== user_id) {
      return res.status(403).json({ message: 'You are not authorized to delete this game' });
    }

    // Delete the game from the users_games collection
    await client.query(q.Delete(q.Ref(q.Collection('users_games'), game.ref.id)));

    res.status(200).json({ message: 'Game deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Failed to delete game'});
  }
}

module.exports = deletegameapi;
