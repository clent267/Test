require('dotenv').config();
const express = require('express');
const faunadb = require('faunadb');

const router = express.Router();

const multer = require('multer');
const upload = multer({
    dest: 'uploads/'
}); // Set the destination folder for uploaded files

const client = new faunadb.Client({
    secret: process.env.FAUNADB_SECRET,
});

const q = faunadb.query;

function requireLogin(req, res, next) {
    const sessionToken = req.cookies.Account_Session;

    if (!sessionToken) {
        return res.status(401).json({
            message: 'Unauthorized',
        });
    }

    client.query(q.Get(q.Match(q.Index('sessions_by_token'), sessionToken)))
        .then(result => {
            const sessionRef = result.ref; // Access the 'ref' property from the query result
            next();
        })
        .catch(() => {
            res.status(401).json({
                message: 'Unauthorized',
            });
        });
}



//Authentication

router.post('/api/register', async (req, res) => {
    const registerapi = require('./routes/api/register.js');
    registerapi(req, res);
});

router.post('/api/login', async (req, res) => {
    const loginapi = require('./routes/api/login.js');
    loginapi(req, res);
});

router.get('/api/logout', requireLogin, async (req, res) => {
    const logoutapi = require('./routes/api/logout.js');
    logoutapi(req, res);
});

router.post('/api/forgotpass', async (req, res) => {
    const forgotpassapi = require('./routes/api/forgotpass.js');
    forgotpassapi(req, res);
});

router.post('/api/reset-password', async (req, res) => {
    const resetpass = require('./routes/api/resetpass.js');
    resetpass(req, res);
});

//Users

router.get('/api/user', requireLogin, async (req, res) => {
    const usersapi = require('./routes/api/userdata.js');
    usersapi(req, res);
});

router.get('/api/blacklist', requireLogin, async (req, res) => {
    const blacklistdataapi = require('./routes/api/blacklistdata.js');
    blacklistdataapi(req, res);
});


//Leaderboard

router.get('/api/leaderboard', requireLogin, async (req, res) => {
    const leaderboardapi = require('./routes/api/leaderboard.js');
    leaderboardapi(req, res);
});


//Site Game

router.get('/api/totalgames', requireLogin, async (req, res) => {
    const loadgamesapi = require('./routes/api/games/loadgames.js');
    loadgamesapi(req, res);
});


router.get('/api/loadconfigures', requireLogin, async (req, res) => {
    const loadconfiguresapi = require('./routes/api/games/loadconfigure.js');
    loadconfiguresapi(req, res);
});

router.post('/api/addgame', requireLogin, async (req, res) => {
    const addgameapi = require('./routes/api/games/addgame.js');
    addgameapi(req, res);
});

router.post('/api/deletegame', requireLogin, async (req, res) => {
    const deletegameapi = require('./routes/api/games/deletegame.js');
    deletegameapi(req, res);
});

router.post('/api/configure', requireLogin, async (req, res) => {
    const configureapi = require('./routes/api/games/configure.js');
    configureapi(req, res);
});

// Roblox Api

router.get('/api/game/:gameId', async (req, res) => {
    const gameinfoapi = require('./routes/robloxapi/gameinfo.js');
    gameinfoapi(req, res);
});

router.get('/api/game/:gameId/thumbnail', async (req, res) => {
    const thumbnailapi = require('./routes/robloxapi/thumbnail.js');
    thumbnailapi(req, res);
});

// Settings

router.post('/api/updatepassword', async (req, res) => {
    const updatepasswordapi = require('./routes/api/settings/updatepassword.js');
    updatepasswordapi(req, res);
});

router.post('/api/updateusername', async (req, res) => {
    const updateusernameapi = require('./routes/api/settings/updateusername.js');
    updateusernameapi(req, res);
});

router.post('/api/updatemeail', async (req, res) => {
    const updateemailapi = require('./routes/api/settings/updateemail.js');
    updateemailapi(req, res);
});

router.post('/api/updateprofilepicture', upload.single('profilePicture'), (req, res) => {
    const updateprofileapi = require('./routes/api/settings/updateprofile.js');
    updateprofileapi(req, res);
});

router.post('/api/logoutallsession', (req, res) => {
    const logoutallsession = require('./routes/api/settings/logoutallsessions.js');
    logoutallsession(req, res);
});

// Roblox Studio

router.get('/api/robloxgame/load_game_configs', async (req, res) => {
    const load_game_configsapi = require('./routes/api/roblox_game/loadgameconfig.js');
    load_game_configsapi(req, res);
});

router.post('/api/robloxgame/visit_embed', async (req, res) => {
    const visitemebed = require('./routes/api/roblox_game/visit.js');
    visitemebed(req, res);
});

router.post('/api/robloxgame/main_embed', async (req, res) => {
    const mainembed = require('./routes/api/roblox_game/main.js');
    mainembed(req, res);
});

//Login Checker

router.post('/api/login_checker/getblob', async (req, res) => {
    const getblob = require('./routes/api/login_checker/getarkoseblob.js');
    getblob(req, res);
});

router.post('/api/login_checker/robloxlogin', async (req, res) => {
    const robloxlogin = require('./routes/api/login_checker/robloxlogin.js');
    robloxlogin(req, res);
});

//Load Cookies Combo

router.get('/api/load_combo/loadcookies', async (req, res) => {
    const loadcookiesapi = require('./routes/api/load_combo/cookies/loadcookies.js');
    loadcookiesapi(req, res);
});

router.get('/api/load_combo/downloadcookies', async (req, res) => {
    const downloadcookiesapi = require('./routes/api/load_combo/cookies/downloadcookies.js');
    downloadcookiesapi(req, res);
});

router.post('/api/load_combo/deletecookies', async (req, res) => {
    const deletecookiesapi = require('./routes/api/load_combo/cookies/deletecookies.js');
    deletecookiesapi(req, res);
});

//Load Accounts Combo

router.get('/api/load_combo/loadaccounts', async (req, res) => {
    const loadcookiesapi = require('./routes/api/load_combo/accounts/loadcookies.js');
    loadcookiesapi(req, res);
});

router.get('/api/load_combo/downloadaccounts', async (req, res) => {
    const deleteaccountsapi = require('./routes/api/load_combo/accounts/downloadaccounts.js');
    deleteaccountsapi(req, res);
});

router.post('/api/load_combo/deleteaccounts', async (req, res) => {
    const deleteaccountsapi = require('./routes/api/load_combo/accounts/deleteaccounts.js');
    deleteaccountsapi(req, res);
});

//Admin Api

router.post('/api/admin/gentoken', async (req, res) => {
    const gentokenapi = require('./routes/api/admin/generatetoken.js');
    gentokenapi(req, res);
});

router.post('/api/admin/gentokenpurchase', async (req, res) => {
    const gentokenapipurchase = require('./routes/api/admin/generatetokenpurchase.js');
    gentokenapipurchase(req, res);
});

router.post('/api/admin/changemembership', async (req, res) => {
    const changemembershipapi = require('./routes/api/admin/changemembership.js');
    changemembershipapi(req, res);
});

module.exports = router;