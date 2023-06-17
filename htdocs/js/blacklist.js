function fetchBlacklist() {
  fetch('/api/blacklist')
    .then(response => response.json())
    .then(data => {
      // Process the fetched data here
      const blacklistInfo = data.blacklistinfo;
      
      const reason = blacklistInfo[0].blacklistinfo.reason;
      const reasontext = document.getElementById("reason");
      reasontext.innerHTML = reason
    })
    .catch(error => {
      console.error('Error fetching blacklist data:', error);
    });
}

// Call the function to fetch and process the blacklist data
fetchBlacklist();
