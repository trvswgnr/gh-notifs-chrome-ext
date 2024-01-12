import "./popup.html";

/*
<body>
    <h1>gh better notifs</h1>
    <p>Status: <span id="status">Not connected</span></p>
    <button id="loginButton">Log in with GitHub</button>

    <script src="popup.js"></script>
</body>
*/

// get the token from the storage (requires the storage permission)
chrome.storage.local.get(["token"], (result) => {
    console.log("Value currently is " + result.token);
    if (result.token) {
        // if the token exists, change the status to connected
        const status = document.getElementById("status");
        if (!status) return;
        status.innerText = "Connected";
        // remove the login button
        const loginButton = document.getElementById("loginButton");
        if (!loginButton) return;
        loginButton.remove();
    }
});
console.log(chrome.identity.getRedirectURL());
