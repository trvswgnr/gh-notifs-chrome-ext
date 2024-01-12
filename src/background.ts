console.log("background script running");
chrome.runtime.onInstalled.addListener(initiateOAuth);

chrome.alarms.create("checkGithub", { periodInMinutes: 1 });
// chrome.alarms.create("checkGithub", { delayInMinutes: 0.01 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === "checkGithub") {
        const token = await getToken();
        if (token) {
            const [tab] = await chrome.tabs.query({ currentWindow: true, active: true });
            if (!tab || tab.id === undefined) {
                console.log("no tab id");
                return;
            }
            const notifications = await getGitHubNotifications(token);
            console.log(notifications);
            if (!notifications.length) return;
            console.log("sending message");
            await chrome.tabs.sendMessage(tab.id, { hasNotifications: true }).catch((e) => {
                console.log("error sending message", e);
            });
        }
    }
});

/**
 * initiates the OAuth flow
 */
async function initiateOAuth() {
    const env = await getEnv();
    const apiUrl = getApiUrl(env);
    const savedTokenResponse = await fetch(`${apiUrl}/auth?saved=true`);
    const { token: savedToken } = await savedTokenResponse.json().catch(() => ({}));
    const preAuthUrl = buildPreAuthUrl();
    console.log("preAuthUrl: ", preAuthUrl);
    if (savedToken) {
        await setToken(savedToken);
        return;
    }
    const redirectUrl = await chrome.identity.launchWebAuthFlow({
        url: preAuthUrl,
        interactive: true,
    });
    const code = getParam(redirectUrl, "code");
    if (!code) return;
    const response = await fetch(`${apiUrl}/auth`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
    });
    const { token } = await response.json().catch(() => ({}));
    if (!token) return;
    await setToken(token);
}

/**
 * builds the OAuth URL
 */
function buildPreAuthUrl() {
    let client_id = chrome.runtime.getManifest().oauth2?.client_id ?? "";
    if (!client_id) throw new Error("missing oauth2.client_id");
    let redirect_uri = encodeURIComponent(chrome.identity.getRedirectURL());
    return `https://github.com/login/oauth/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&scope=user%20notifications`;
}

/**
 * extracts the access token from the URL
 * @param responseUrl the URL to extract the token from
 * @param param the name of the parameter to extract
 * @returns the access token, or `null` if it could not be found
 */
function getParam(responseUrl: string | undefined, param: string): string | null {
    if (!responseUrl) return andLog(null, "no response URL");
    const url = tryFn(() => new URL(responseUrl));
    if (!url) return andLog(null, "invalid URL");
    const searchParams = tryFn(() => new URLSearchParams(url.search));
    if (!searchParams) return andLog(null, "invalid search params");
    return searchParams.get(param);
}

/**
 * try to call a function and return `null` if it throws an error
 */
function tryFn<T extends AnyFn>(fn: T, ...args: Parameters<T>[]): ReturnType<T> | null {
    try {
        return fn(...args);
    } catch (e) {
        console.error(e);
        return null;
    }
}

/**
 * log and return the first argument
 */
function andLog<T>(x: T, ...args: any[]) {
    if (args.length > 0) console.log(...args);
    return x;
}

/**
 * checks to see if the user has any GitHub notifications
 */
async function getGitHubNotifications(token: string) {
    const response = await fetch("https://api.github.com/notifications", {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        },
    }).catch(() => null);
    if (!response || !response.ok) return [];
    console.log(Object.fromEntries(response.headers.entries()));
    const notifications: GhNotification[] = await response.json().catch(() => []);
    return notifications;
}

/**
 * saves the token to the storage
 */
async function setToken(token: string): Promise<string | null> {
    return await chrome.storage.local
        .set({ token })
        .then(() => token)
        .catch(() => null);
}

/**
 * gets the token from the storage
 */
async function getToken(): Promise<string | null> {
    return await chrome.storage.local.get({ token: null }).then(({ token }) => token);
}

/**
 * get our api url
 */
function getApiUrl(env: EnvName) {
    if (env === "development") {
        return "http://localhost:3000/api";
    }
    return "https://gh-notifs-chrome-ext.vercel.app/api";
}
async function getEnv(): Promise<EnvName> {
    return (await chrome.management
        .getSelf()
        .then(({ installType }) => installType)
        .catch(() => "other")) as EnvName;
}

type ParsedLinks = { [key: string]: URL };
function parseLinkHeader(header: string): ParsedLinks {
    const links: ParsedLinks = {};
    // splitting by ', <' to avoid breaking URLs that contain commas, for whatever reason
    const parts = header.split(", <");
    parts.forEach((part) => {
        // add the < back to the beginning of the URL
        if (!part.startsWith("<")) {
            part = "<" + part;
        }
        const match = part.match(/<(.*?)>;\s*rel="([^"]+)"/);
        if (match) {
            const url = match[1];
            const rel = match[2];
            links[rel] = new URL(url);
        }
    });

    return links;
}

type EnvName = "admin" | "development" | "normal" | "sideload" | "other";
type AnyFn = (...args: any[]) => any;
