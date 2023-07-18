// Function to update the card titles with the fetched statistics
function updateCardTitles(stats) {
    const pointsCardTitle = document.getElementById('total-points');
    const robuxCardTitle = document.getElementById('robux');
    const creditsCardTitle = document.getElementById('credits');
    pointsCardTitle.textContent = stats.points;
    robuxCardTitle.textContent = `R$ ${stats.robux}`;
    creditsCardTitle.textContent = `$ ${stats.credits}`;
  }
  
  function updateUserInfo(info) {
    const welcometag = document.getElementById('welcometext');
    const profile_pic = document.getElementById('profile_pic');
  
    // Fetch the JSON data from the provided URL
    fetch(`https://discordlookup.mesavirep.xyz/v1/user/${info.discord_id}`)
      .then(response => response.json())
      .then(data => {
        const discordName = data.tag;
        
        // Update the welcome tag and profile picture using the extracted global_name
        welcometag.textContent = `Hi ${info.username}! Welcome! aka ${discordName}`;
        profile_pic.src = info.profile_pic;
      })
      .catch(error => {
        console.error('Error fetching JSON:', error);
      });
  }
  
  function updateTotalGames(info) {
    const games = document.getElementById('games');
    games.textContent = `${info.maxLimit} / ${info.totalGames}`;
  }
  
  // Function to fetch the statistics from the API
  function fetchStatistics() {
    fetch('/api/user')
      .then(response => response.json())
      .then(data => {
        const userData = data.data;
        if (userData && userData.length > 0) {
          const user = userData[0];
          if (user.stats) {
            const stats = {
              points: user.stats.points || 0,
              robux: user.stats.robux || 0,
              credits: user.stats.credits || 0
            };
  
            updateCardTitles(stats);
          } else {
            console.error('User stats not found');
          }
        } else {
          console.error('No user data available');
        }
      })
      .catch(error => console.error(error));
  }
  
  function fetchTotalsGames() {
    fetch('/api/totalgames')
      .then(response => response.json())
      .then(data => {
        const { totalGames, maxLimit } = data;
  
        const info = {
          totalGames,
          maxLimit
        };
  
        updateTotalGames(info);
      })
      .catch(error => console.error(error));
  }
  
  function fetchUserInfo() {
    fetch('/api/user')
      .then(response => response.json())
      .then(data => {
        const userData = data.data;
  
        const info = {
          username: userData[0].username,
          profile_pic: userData[0].profile_pic,
          discord_id: userData[0].discord_id,
        };
  
        updateUserInfo(info);
      })
      .catch(error => console.error(error));
  }
  
  // Call the fetch functions when the page is loaded
  document.addEventListener('DOMContentLoaded', () => {
    Promise.all([fetchStatistics(), fetchUserInfo(), fetchTotalsGames()])
      .catch(error => console.error(error));
  });
  