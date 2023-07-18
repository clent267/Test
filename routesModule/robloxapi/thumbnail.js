require('dotenv').config();
const axios = require('axios');

async function thumbnailapi(req, res) {
    const { gameId } = req.params;
    const robloxApiUrl = `https://apis.roblox.com/universes/v1/places/${gameId}/universe`;
  
    try {
      const response = await axios.get(robloxApiUrl);
      const gameData = response.data;
  
      if (gameData.universeId === null) {
        return res.status(400).json({ error: 'Invalid game ID' });
      }
  
      const thumbnailUrl = `https://thumbnails.roblox.com/v1/games/icons?universeIds=${gameData.universeId}&returnPolicy=PlaceHolder&size=256x256&format=Png&isCircular=false`;
      const thumbnailResponse = await axios.get(thumbnailUrl);
      const thumbnails = thumbnailResponse.data.data;
  
      res.json(thumbnails);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch game thumbnails' });
    }
}

module.exports = thumbnailapi;
