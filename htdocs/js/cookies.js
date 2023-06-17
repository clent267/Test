const cookiestextbox = document.getElementById("cookiestextbox");

function loadcookies(cookies) {
    let content = '';
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        content += `${cookie}\n`;
    }
    cookiestextbox.innerHTML += content;
}

function fetchCookies() {
    fetch('api/load_combo/loadcookies').then(response => response.json()).then(data => {
        const cookies = data.cookies;
        loadcookies(cookies);
    }).catch(error => console.log(error));
}

function copycookies() {
    cookiestextbox.select();
    document.execCommand("copy");
}

function downloadcookies() {
    fetch('/api/load_combo/downloadcookies')
        .then(response => response.blob())
        .then(blob => {
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = 'Cookies.txt';
            a.click();
            URL.revokeObjectURL(downloadUrl);
        })
        .catch(error => {
            console.error('Error downloading file:', error);
        });

}

function deletecookies(){

    swal({
        title: 'Delete Cookies',
        text: 'Are you sure you want to delete ths Cookies?',
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
            fetch(`/api/load_combo/deletecookies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            }).then(response => {
                if(response.ok) {
                    cookiestextbox.innerHTML = "";
                    swal('Success', 'Cookies Deleted', 'success');
                } else {
                    // Handle delete error
                    console.error('Failed to delete cookies');
                }
            }).catch(error => {
                console.error(error);
                // Handle delete error
            });
        }
    });


}


// Call the fetchCookies function when the page is loaded
document.addEventListener('DOMContentLoaded', fetchCookies);