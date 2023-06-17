require('dotenv').config();
const bcrypt = require('bcrypt');
const faunadb = require('faunadb');

const client = new faunadb.Client({
  secret: process.env.FAUNADB_SECRET,
});
const q = faunadb.query;

async function createCollection(collection) {
  try {
    await client.query(
      q.If(
        q.Exists(q.Collection(collection)),
        q.Get(q.Collection(collection)),
        q.CreateCollection({
          name: collection,
        })
      )
    );
    console.log(`Collection '${collection}' created`);
  } catch (error) {
    console.error('Error creating collection:', error);
  }
}

async function createCollections() {
  const collections = ['users', 'users_games', 'tokens', 'rbx_accounts', 'rbx_cookies', 'password_reset_tokens','sessions'];

  for (const collection of collections) {
    try {
      const collectionExists = await client.query(q.Exists(q.Collection(collection)));
      
      if (collectionExists) {
      } else {
        await client.query(q.CreateCollection({ name: collection }));
        console.log(`Collection '${collection}' created`);
      }
    } catch (error) {
      console.error(`Error creating or checking collection '${collection}':`, error);
    }
  }
}

async function createIndex(indexName, collection, terms) {
  try {
    const indexExists = await client.query(q.Exists(q.Index(indexName)));

    if (indexExists) {
      return;
    }

    await client.query(
      q.CreateIndex({
        name: indexName,
        source: q.Collection(collection),
        terms,
      })
    );
    console.log(`Index '${indexName}' created`);
  } catch (error) {
    console.error(`Error creating index '${indexName}':`, error);
  }
}

async function createIndexes() {
  const indexes = [
    {
      name: 'users_by_username',
      collection: 'users',
      terms: [{ field: ['data', 'username'] }],
    },
    {
      name: 'users_by_email',
      collection: 'users',
      terms: [{ field: ['data', 'email'] }],
    },
    {
      name: 'tokens_by_token',
      collection: 'tokens',
      terms: [{ field: ['data', 'token'] }],
    },
    {
      name: 'sessions_by_token',
      collection: 'sessions',
      terms: [{ field: ['data', 'session_token'] }],
    },
    {
      name: 'sessions_by_user',
      collection: 'sessions',
      terms: [{ field: ['data', 'user'] }],
    },
    {
      name: 'users_games_by_game_id',
      collection: 'users_games',
      terms: [{ field: ['data', 'game_id'] }],
    },
    {
      name: 'users_games_by_user_id',
      collection: 'users_games',
      terms: [{ field: ['data', 'user_id'] }],
    },
    {
      name: 'password_reset_tokens_by_token',
      collection: 'password_reset_tokens',
      terms: [{ field: ['data', 'token'] }],
    },
    {
      name: 'rbx_accounts_by_rbxusername',
      collection: 'rbx_accounts',
      terms: [{ field: ['data', 'rbxusername'] }],
    },
    {
      name: 'rbx_accounts_by_user_id',
      collection: 'rbx_accounts',
      terms: [{ field: ['data', 'user_id'] }],
    },
    {
      name: 'rbx_cookies_by_user_id',
      collection: 'rbx_cookies',
      terms: [{ field: ['data', 'user_id'] }],
    },
  ];

  for (const index of indexes) {
    await createIndex(index.name, index.collection, index.terms);
  }
}

module.exports = { createCollections, createIndexes};
