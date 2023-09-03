require('dotenv').config();
const express = require('express');
const path = require('path');
const faunadb = require('faunadb');
const router = express.Router();

const client = new faunadb.Client({
    secret: process.env.FAUNADB_SECRET,
});

const q = faunadb.query;

function requireNoSession(req, res, next) {
    const sessionToken = req.cookies.Account_Session;

    if (sessionToken) {
        client.query(q.Get(q.Match(q.Index('sessions_by_token'), sessionToken)))
            .then(() => {
                // Session token is valid, redirect to another page
                res.redirect('/index');
            })
            .catch(() => {
                // Session token is invalid, continue to the next middleware
                next();
            });
    } else {
        // No session token found, continue to the next middleware
        next();
    }
}

function requireSession(req, res, next) {
    const sessionToken = req.cookies.Account_Session;

    if (sessionToken) {
        client.query(q.Get(q.Match(q.Index('sessions_by_token'), sessionToken)))
            .then((response) => {
                const userRef = response.data.user;
                // Fetch the user data using the user reference
                return client.query(q.Get(userRef));
            })
            .then((user) => {
                const blacklistStatus = user.data.blacklistinfo.status;
                const currentDirectory = req.path;

                if (currentDirectory !== '/blacklist' && blacklistStatus) {
                    return res.redirect('/blacklist');
                } else if (currentDirectory === '/blacklist' && !blacklistStatus) {
                    res.redirect('/index');
                }

                const discordId = user.data.discord_id;

                if (currentDirectory !== '/discord-verification' && discordId === "None") {
                    return res.redirect('/discord-verification');
                } else if (currentDirectory === '/discord-verification' && discordId !== "None") {
                    res.redirect('/index');
                }

                next(); // Session token is valid, continue to the next middleware
            })
            .catch((error) => {
                console.error(error);
                // Session token is invalid or an error occurred, redirect to the login page
                res.redirect('/login');
            });
    } else {
        // No session token found, redirect to the login page
        res.redirect('/login');
    }
}

async function getRefId(sessionToken) {
    const userRefFromSession = await client.query(
        q.Map(
            q.Paginate(q.Match(q.Index('sessions_by_token'), sessionToken)),
            q.Lambda((x) => {
                return {
                    ref: q.Select(['data', 'user'], q.Get(x)),
                };
            })
        )
    );

    const refid = userRefFromSession.data[0].ref.id;
    return refid;
}

// Root Page
router.get('/', requireSession, (req, res) => {
    res.redirect('/index');
});


router.use(express.static('public'));

router.get('/admin', requireSession, async (req, res) => {
    try {
        const sessionToken = req.cookies.Account_Session;

        const refid = await getRefId(sessionToken);

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

        if (membership === "Admin" || membership === "Owner") {
            res.sendFile(path.join(__dirname, 'view', 'admin.html'));
        } else {
          res.redirect('/403');
        }

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/index', requireSession, (req, res) => {
    res.sendFile(path.join(__dirname, 'view', 'index.html'));
});

router.get('/login', requireNoSession, (req, res) => {
    res.sendFile(path.join(__dirname, 'view', 'login.html'));
});

router.get('/discordlogin', (req, res) => {
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${process.env.CLIENT_ID}&redirect_uri=${process.env.REDIRECT_URI_LOGIN}&response_type=code&scope=identify`;
    res.redirect(discordAuthUrl);
});

router.get('/forgot', requireNoSession, (req, res) => {
    res.sendFile(path.join(__dirname, 'view', 'forgot.html'));
});

router.get('/register', requireNoSession, (req, res) => {
    res.sendFile(path.join(__dirname, 'view', 'register.html'));
});

router.get('/purchase', requireNoSession, (req, res) => {
    res.sendFile(path.join(__dirname, 'view', 'purchase.html'));
});

router.get('/reset-password', requireNoSession, async (req, res) => {
    const key = req.query.key;

    try {
        // Find the reset token in the password_reset_tokens collection
        await client.query(
            q.Get(q.Match(q.Index('password_reset_tokens_by_token'), key))
        );

        res.sendFile(path.join(__dirname, 'public', 'reset.html'));

    } catch (error) {
        if (error.message === 'instance not found') {
            return res.redirect('/404');
        }

        console.error('Error during password reset token lookup:', error);
        return res.status(500).send('Internal Server Error');
    }
});

//With Session Page

router.get('/discord-verification', requireSession, (req, res) => {
    res.sendFile(path.join(__dirname, 'view', 'discordverification.html'));
});

router.get('/verified-discord-account', (req, res) => {
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${process.env.CLIENT_ID}&redirect_uri=${process.env.REDIRECT_URI_VERIFICATION}&response_type=code&scope=identify`;
    res.redirect(discordAuthUrl);
});

router.get('/addgame', requireSession, (req, res) => {
    res.sendFile(path.join(__dirname, 'view', 'addgame.html'));
});

router.get('/games', requireSession, (req, res) => {
    res.sendFile(path.join(__dirname, 'view', 'games.html'));
});

router.get('/download', requireSession, (req, res) => {
    res.sendFile(path.join(__dirname, 'view', 'download.html'));
});

router.get('/settings', requireSession, (req, res) => {
    res.sendFile(path.join(__dirname, 'view', 'settings.html'));
});

router.get('/configure', requireSession, async (req, res) => {
    const game_id = req.query.gameId;

    const sessionToken = req.cookies.Account_Session;
    const refid = await getRefId(sessionToken);

    const userData = await client.query(
        q.Map(
            q.Paginate(q.Ref(q.Collection('users'), refid)),
            q.Lambda((x) => ({
                user_id: q.Select(['ref', 'id'], q.Get(x)),
                membership: q.Select(['data', 'membership'], q.Get(x))
            }))
        )
    );

    const user_id = userData.data[0].user_id;

    const gameExists = await client.query(q.Exists(q.Match(q.Index('users_games_by_game_id'), game_id)));

    if (!gameExists) {
        return res.redirect('/404');
    }

    const game = await client.query(q.Get(q.Match(q.Index('users_games_by_game_id'), game_id)));

    if (game.data.user_id !== user_id) {
        return res.redirect('/404');
    }

    if (!game_id) {
        return res.redirect('/404');
    }

    res.sendFile(path.join(__dirname, 'view', 'configure.html'));
});

router.get('/cookies', requireSession, (req, res) => {
    res.sendFile(path.join(__dirname, 'view', 'cookies.html'));
});

router.get('/accounts', requireSession, (req, res) => {
    res.sendFile(path.join(__dirname, 'view', 'accounts.html'));
});

//Login Checker Page

router.get('/lc', requireSession, (req, res) => {
    res.sendFile(path.join(__dirname, 'view', 'loginchecker.html'));
});

//Blacklist Page

router.get('/blacklist', requireSession, async (req, res) => {
    res.sendFile(path.join(__dirname, 'view', 'blacklist.html'));
});


module.exports = router;