function loadGames(gameIds) {
    const gamerows = document.getElementById("gamerows");
    let content = '';
    for(let i = 0; i < gameIds.length; i++) {
        const gameId = gameIds[i];
        content += `
            <div class="col-lg-4">
                <div class="card m-b-30" id="gameCard-${gameId}">
                <div class="card-body">
                    <h4 class="mt-0 header-title" id="gameName-${i}">Loading..</h4>
                    <p class="text-success" id="gameStats-${i}">Loading..</p>
                    <div class="text-center" id="gameThumbnail-${i}">
                    <img src="" alt="Game Thumbnail" class="thumbnail-image">
                    </div>
                    
                    <div class="mt-3 d-flex justify-content-center">
                    <a href="configure?gameId=${gameId}" target="_blank" class="btn btn-primary waves-effect waves-light">Configure</a>
                    <a href="https://roblox.com/games/${gameId}" target="_blank" class="btn btn-success waves-effect waves-light mx-2">View Game</a>
                    <button type="button" class="btn btn-danger waves-effect waves-light" onclick="deleteGame('${gameId}')">Delete Game</button>
                    </div>
                </div>
                </div>
            </div>
            `;
        // Fetch game information
        fetch(`/api/game/${gameId}`).then(response => response.json()).then(data => {
            const gameNameElement = document.getElementById(`gameName-${i}`);
            const gameStatsElement = document.getElementById(`gameStats-${i}`);
            const gameThumbnailElement = document.getElementById(`gameThumbnail-${i}`);
            if(data.data && data.data.length > 0) {
                const gameName = data.data[0].name;
                gameNameElement.textContent = gameName;
                gameStatsElement.textContent = `Visits ${data.data[0].visits} | Playing ${data.data[0].playing} | Favorites ${data.data[0].favoritedCount}`;
                // Fetch game thumbnail
                fetch(`/api/game/${gameId}/thumbnail`).then(response => response.json()).then(thumbnails => {
                    if(thumbnails.length > 0) {
                        const thumbnailUrl = thumbnails[0].imageUrl;
                        gameThumbnailElement.innerHTML = `
              <img src="${thumbnailUrl}" alt="Game Thumbnail" class="thumbnail-image">`;
                    }
                }).catch(error => {
                    console.error(error);
                    // Handle errors
                });
            } else {
                gameNameElement.textContent = 'Unknown Game';
            }
        }).catch(error => {
            console.error(error);
            // Handle errors
        });
    }
    gamerows.innerHTML += content;
}

function deleteGame(game_id) {
    swal({
        title: 'Delete Game',
        text: 'Are you sure you want to delete this game?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'
    }).then(result => {
        if(result) {
            // Remove the game card from the DOM first
            // Make the API call to delete the game
            fetch(`/api/deletegame`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    game_id
                })
            }).then(response => {
                if(response.ok) {
                    const gameColumn = document.getElementById(`gameCard-${game_id}`).parentNode;
                    if(gameColumn) {
                        gameColumn.parentNode.removeChild(gameColumn);
                    }
                    //fetchTotalsGames();
                    swal('Success', 'Game Deleted', 'success');
                } else {
                    // Handle delete error
                    console.error('Failed to delete game');
                }
            }).catch(error => {
                console.error(error);
                // Handle delete error
            });
        }
    });
}

function fetchTotalsGames() {
    fetch('/api/totalgames').then(response => response.json()).then(data => {
        const gameIds = data.gameIds;
        loadGames(gameIds);
    }).catch(error => console.log(error));
}
// Call the fetchStatistics function when the page is loaded
document.addEventListener('DOMContentLoaded', fetchTotalsGames);