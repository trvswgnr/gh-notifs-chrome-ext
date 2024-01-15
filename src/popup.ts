import { GH_PERSONAL_TOKEN_STORAGE_KEY, GH_TOKEN_STORAGE_KEY, getDev } from "./lib";
import "./popup.html";

(async () => {
    const dev = await getDev();
    dev.log("popup script running");

    // get the token from the storage (requires the storage permission)
    chrome.storage.local.get([GH_PERSONAL_TOKEN_STORAGE_KEY, GH_TOKEN_STORAGE_KEY], (result) => {
        const token = result[GH_PERSONAL_TOKEN_STORAGE_KEY] || result[GH_TOKEN_STORAGE_KEY];
        if (!token) return;
        dev.log("Value currently is " + token);
        // if the token exists, change the status to connected
        const status = document.getElementById("status");
        if (!status) return;
        status.innerText = "Connected";
        // remove the login button
        const loginButton = document.getElementById("loginButton");
        if (!loginButton) return;
        loginButton.remove();
    });
    dev.log(chrome.identity.getRedirectURL());

    document.querySelector("#go-to-options")?.addEventListener("click", () => {
        if (!chrome.runtime.openOptionsPage) {
            window.open(chrome.runtime.getURL("options.html"));
            return;
        }
        chrome.runtime.openOptionsPage();
    });
})();
