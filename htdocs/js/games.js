function loadGames(gameIds) {
    const gamerows = document.getElementById("gamerows");
    const fragment = document.createDocumentFragment();

    gameIds.forEach((gameId, i) => {
        const gameCard = document.createElement("div");
        gameCard.className = "col-lg-4";
        gameCard.innerHTML = `
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
        `;

        fragment.appendChild(gameCard);

        // Fetch game information
        fetch(`/api/game/${gameId}`)
            .then(response => response.json())
            .then(data => {
                const gameNameElement = document.getElementById(`gameName-${i}`);
                const gameStatsElement = document.getElementById(`gameStats-${i}`);
                const gameThumbnailElement = document.getElementById(`gameThumbnail-${i}`);
                
                if (data.data && data.data.length > 0) {
                    const gameData = data.data[0];
                    const gameName = gameData.name;
                    const { visits, playing, favoritedCount } = gameData;
                    
                    gameNameElement.textContent = gameName;
                    gameStatsElement.textContent = `Visits ${visits} | Playing ${playing} | Favorites ${favoritedCount}`;
                    
                    // Fetch game thumbnail
                    fetch(`/api/game/${gameId}/thumbnail`)
                        .then(response => response.json())
                        .then(thumbnails => {
                            if (thumbnails.length > 0) {
                                const thumbnailUrl = thumbnails[0].imageUrl;
                                gameThumbnailElement.innerHTML = `<img src="${thumbnailUrl}" alt="Game Thumbnail" class="thumbnail-image">`;
                            }
                        })
                        .catch(error => {
                            console.error(error);
                            // Handle errors
                        });
                } else {
                    gameNameElement.textContent = 'Unknown Game';
                }
            })
            .catch(error => {
                console.error(error);
                // Handle errors
            });
    });

    gamerows.innerHTML = '';
    gamerows.appendChild(fragment);
}

function deleteGame(gameId) {
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
        if (result) {

            // Make the API call to delete the game
            fetch(`/api/deletegame`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    game_id: gameId
                })
            })
                .then(response => {
                    if (response.ok) {
                        swal('Success', 'Game Deleted', 'success');
                        // Remove the game card from the DOM first
                        fetchTotalsGames();

                    } else {
                        // Handle delete error
                        console.error('Failed to delete game');
                    }
                })
                .catch(error => {
                    console.error(error);
                    // Handle delete error
                });
        }
    });
}


function fetchTotalsGames() {
    fetch('/api/totalgames')
        .then(response => response.json())
        .then(data => {
            const gameIds = data.gameIds;
            loadGames(gameIds);
        })
        .catch(error => console.log(error));
}

// Call the fetchStatistics function when the page is loaded
document.addEventListener('DOMContentLoaded', fetchTotalsGames);

// Get the search input field and button
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const gameContainer = document.getElementById("gamerows");

// Add event listener for button click
searchButton.addEventListener("click", performSearch);

// Add event listener for Enter key press
searchInput.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
        performSearch();
    }
});

// Function to perform the search
function performSearch() {
    // Get the search query
    const query = searchInput.value.trim().toLowerCase();

    // Iterate through game cards and show/hide based on search query
    const gameCards = gameContainer.getElementsByClassName("card");
    for (let i = 0; i < gameCards.length; i++) {
        const gameNameElement = gameCards[i].querySelector(".header-title");
        const gameName = gameNameElement.textContent.toLowerCase();

        if (gameName.includes(query)) {
            gameCards[i].style.display = "block";
        } else {
            gameCards[i].style.display = "none";
        }
    }

    // Clear the search input
    searchInput.value = "";
}
