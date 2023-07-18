require('dotenv').config();
const axios = require('axios');

async function gameinfoapi(req, res) {
    const {
        gameId
    } = req.params;
    const robloxApiUrl = `https://apis.roblox.com/universes/v1/places/${gameId}/universe`;

    try {
        const response = await axios.get(robloxApiUrl);
        const gameData = response.data;

        if (gameData.universeId === null) {
            return res.status(400).json({
                error: 'Invalid game ID'
            });
        }

        const gameInfoUrl = `https://games.roblox.com/v1/games?universeIds=${gameData.universeId}`;
        const gameInfoResponse = await axios.get(gameInfoUrl);
        const gameInfoData = gameInfoResponse.data;

        res.json(gameInfoData);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Failed to fetch game data'
        });
    }
}

module.exports = gameinfoapi;