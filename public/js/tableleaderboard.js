function fetchLeaderboard() {
  const leaderboardTableBody = document.getElementById('leaderboardTableBody');

  fetch('/api/leaderboard')
    .then(response => response.json())
    .then(data => {
      const leaderboard = data.leaderboard;
      leaderboardTableBody.innerHTML = '';

      leaderboard.forEach((entry, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${index + 1}</td>
          <td>
            <div>
              <img src="${entry.profile_pic}" alt="Profile Picture" class="thumb-sm rounded-circle mr-2">
              ${entry.username}
            </div>
          </td>
          <td>${entry.robux}</td>
          <td>${entry.points}</td>
          <td>${entry.revenue}</td>
        `;
        leaderboardTableBody.appendChild(row);
      });
    })
    .catch(error => {
      console.error('Error fetching leaderboard:', error);
    });
}

// Call the function to fetch and populate the leaderboard
fetchLeaderboard();
