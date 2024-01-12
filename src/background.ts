console.log("background script running");
chrome.runtime.onInstalled.addListener(initiateOAuth);

// chrome.alarms.create('checkGithub', { periodInMinutes: 0.1 });
chrome.alarms.create("checkGithub", { delayInMinutes: 0.01 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === "checkGithub") {
        const token = await getToken();
        console.log(token);
        if (token) {
            // const notifications = await checkGitHubNotifications(token);
            // console.log(notifications);
        }
    }
});

/**
 * initiates the OAuth flow
 */
async function initiateOAuth() {
    chrome.identity.launchWebAuthFlow(
        {
            url: buildAuthUrl(),
            interactive: true,
        },
        async (redirectUrl) => {
            const code = getParam(redirectUrl, "code");
            console.log(code);
            if (code) {
                const env = await getEnv();
                const apiUrl = getApiUrl(env);
                const response = await fetch(`${apiUrl}/auth`, {
                    method: "POST",
                    headers: {
                        "content-type": "application/json",
                    },
                    body: JSON.stringify({ code }),
                });
                const { token } = (await response.json()) as { token?: string };
                console.log(token);
                if (token) {
                    await setToken(token);
                }
            }
        },
    );
}

/**
 * builds the OAuth URL
 */
function buildAuthUrl() {
    let client_id = "43ce600f21d429a85512";
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
async function checkGitHubNotifications(token: string) {
    const response = await fetch("https://api.github.com/notifications", {
        headers: {
            Authorization: `token ${token}`,
        },
    });
    const notifications = await response.json();
    console.log(notifications);
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

/**
 * get our environment
 * @return {Promise<EnvName>}
 */
async function getEnv(): Promise<EnvName> {
    return (await chrome.management
        .getSelf()
        .then(({ installType }) => installType)
        .catch(() => "other")) as EnvName;
}

type EnvName = "admin" | "development" | "normal" | "sideload" | "other";
type AnyFn = (...args: any[]) => any;
