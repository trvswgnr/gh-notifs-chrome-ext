console.log("hello from content");

// log this tab's info
console.log("tab info", {
    url: location.href,
    title: document.title,
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log("got message", request);
    if (!request.hasNotifications) {
        console.log("no notifications");
        return;
    }
    const indicatorEl = document.querySelector<HTMLElement>("notification-indicator");
    if (!indicatorEl) {
        console.log("no indicator");
        return;
    };
    indicatorEl.style.setProperty("--bgColor-accent-emphasis", "red");
    indicatorEl.style.setProperty("--base-size-8", "1rem");
});

