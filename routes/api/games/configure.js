require('dotenv').config();
const express = require('express');
const axios = require('axios');
const faunadb = require('faunadb');
const client = new faunadb.Client({
  secret: process.env.FAUNADB_SECRET,
});
const q = faunadb.query;

async function configureapi(req, res) {
  const { game_id, config_info } = req.body;

  
  // Check for empty fields
  const requiredFields = ['game_id', 'config_info'];
  const missingFields = requiredFields.filter((field) => !req.body[field]);

  if (missingFields.length > 0) {
    return res.status(400).json({ message: `Missing required fields: ${missingFields.join(', ')}` });
  }

  // Check for empty variables in webhooks
  const webhooks = config_info.webhooks || {};
  const emptyWebhookVariables = [];

  if (!webhooks.visit) {
    emptyWebhookVariables.push('visit');
  }

  if (!webhooks.nbc) {
    emptyWebhookVariables.push('nbc');
  }

  if (!webhooks.premium) {
    emptyWebhookVariables.push('premium');
  }

  if (!webhooks.success) {
    emptyWebhookVariables.push('success');
  }

  if (!webhooks.failed) {
    emptyWebhookVariables.push('failed');
  }

  if (emptyWebhookVariables.length > 0) {
    return res.status(400).json({ message: `Missing required variables in webhooks: ${emptyWebhookVariables.join(', ')}` });
  }

  // Check for empty variables in game_configs
  const gameConfigs = config_info.game_configs || {};
  const emptyGameConfigVariables = [];

  if (!gameConfigs.age_kick) {
    emptyGameConfigVariables.push('age_kick');
  }

  if (!gameConfigs.age_kick_message) {
    emptyGameConfigVariables.push('age_kick_message');
  }

  if (gameConfigs.login_kick === undefined) {
    emptyGameConfigVariables.push('login_kick');
  }

  if (!gameConfigs.login_kick_message) {
    emptyGameConfigVariables.push('login_kick_message');
  }

  if (gameConfigs.verified_kick === undefined) {
    emptyGameConfigVariables.push('verified_kick');
  }

  if (!gameConfigs.verified_kick_message) {
    emptyGameConfigVariables.push('verified_kick_message');
  }

  if (emptyGameConfigVariables.length > 0) {
    return res.status(400).json({ message: `Missing required variables in game_configs: ${emptyGameConfigVariables.join(', ')}` });
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
      return res.status(403).json({ message: 'You are not authorized to configure this game' });
    }

    // Update the game configuration in the users_games collection
    const updatedGame = await client.query(
      q.Update(q.Select('ref', q.Get(q.Match(q.Index('users_games_by_game_id'), game_id))), {
        data: {
          config_info,
        },
      })
    );

    res.status(200).json({ message: 'Game configuration updated successfully', game: updatedGame });
  } catch (error) {
    res.status(400).json({ message: 'Failed to update game configuration'});
  }
}

module.exports = configureapi;
