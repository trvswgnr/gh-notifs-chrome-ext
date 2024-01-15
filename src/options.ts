import "./options.html";
import { GH_PERSONAL_TOKEN_STORAGE_KEY } from "./lib";

document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("save")?.addEventListener("click", saveOptions);

function saveOptions() {
    const token = document.querySelector<HTMLInputElement>("#token")?.value;
    if (!token?.trim()) return;
    chrome.storage.local.set({ [GH_PERSONAL_TOKEN_STORAGE_KEY]: token.trim() }, () => {
        const status = document.getElementById("status");
        if (!status) return;
        status.textContent = "Options saved.";
        setTimeout(() => {
            status.textContent = "";
        }, 750);
    });
}

function restoreOptions() {
    chrome.storage.local.get({ [GH_PERSONAL_TOKEN_STORAGE_KEY]: "" }, (storage) => {
        const tokenInput = document.querySelector<HTMLInputElement>("#token");
        if (!tokenInput) return;
        tokenInput.value = storage[GH_PERSONAL_TOKEN_STORAGE_KEY];
    });
}
