import {
    getDev,
    getEnv,
    GH_PERSONAL_TOKEN_STORAGE_KEY,
    GH_TOKEN_STORAGE_KEY,
    type EnvName,
} from "./lib";

(async () => {
    const dev = await getDev();
    let usingPersonalToken = false;

    dev.log("background script running");

    const throttledSendHasNotifications = throttle(sendHasNotifications, 5000);

    chrome.runtime.onInstalled.addListener(initiateOAuth);
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
        if (changeInfo.status !== "complete") {
            dev.log("tab update not complete");
            return;
        }
        await throttledSendHasNotifications();
    });

    chrome.alarms.create("checkGithub", { periodInMinutes: 1 });
    // chrome.alarms.create("checkGithub", { delayInMinutes: 0.01 });

    chrome.alarms.onAlarm.addListener(async (alarm) => {
        if (alarm.name !== "checkGithub") {
            dev.log("unknown alarm", alarm);
            return;
        }
        await throttledSendHasNotifications();
    });

    async function sendHasNotifications() {
        let token = await getPersonalToken();
        if (token) {
            dev.log("using personal token");
            usingPersonalToken = true;
        }

        if (!token) {
            token = await getToken();
            if (!token) {
                dev.log("no token");
                return;
            }
        }
        const [tab] = await chrome.tabs.query({ currentWindow: true, active: true });
        if (!tab || tab.id === undefined) {
            dev.log("no tab id");
            return;
        }
        const notifications = await getGitHubNotifications(token);
        dev.log("notifications", notifications);
        if (!notifications.length) return;
        await chrome.tabs.sendMessage(tab.id, { hasNotifications: true }).catch((e) => {
            dev.log("error sending message", e);
        });
    }

    /**
     * initiates the OAuth flow
     */
    async function initiateOAuth() {
        dev.log("initiating OAuth");
        await clearToken();
        const personalToken = await getPersonalToken();
        if (personalToken) {
            dev.log("using personal token");
            await setToken(personalToken);
            return;
        }
        const env = await getEnv();
        const apiUrl = getApiUrl(env);
        const savedTokenResponse = await fetch(`${apiUrl}/auth?saved=true`);
        const { token: savedToken } = await savedTokenResponse.json().catch(() => ({}));
        if (savedToken) {
            dev.log("using saved token");
            await setToken(savedToken);
            return;
        }
        const preAuthUrl = buildPreAuthUrl();
        dev.log("preAuthUrl", preAuthUrl);
        const redirectUrl = await chrome.identity.launchWebAuthFlow({
            url: preAuthUrl,
            interactive: true,
        });
        const code = getParam(redirectUrl, "code");
        if (!code) {
            dev.log("no code from redirect");
            return;
        }
        const response = await fetch(`${apiUrl}/auth`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ code }),
        });
        const { token } = await response.json().catch(() => ({}));
        if (!token) {
            dev.log("no token from server");
            return;
        }
        dev.log("got token", token);
        await setToken(token);
    }

    /**
     * builds the OAuth URL
     */
    function buildPreAuthUrl() {
        const client_id = chrome.runtime.getManifest().oauth2?.client_id ?? "";
        if (!client_id) throw new Error("missing oauth2.client_id");
        const redirect_uri = encodeURIComponent(chrome.identity.getRedirectURL());
        const scope = encodeURIComponent("notifications repo");
        let url = "https://github.com/login/oauth/authorize";
        url += `?client_id=${client_id}`;
        url += `&redirect_uri=${redirect_uri}`;
        url += `&scope=${scope}`;
        return url;
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
        if (args.length > 0) dev.log(...args);
        return x;
    }

    /**
     * checks to see if the user has any GitHub notifications
     */
    async function getGitHubNotifications(token: string) {
        let url = "https://api.github.com/notifications";
        if (usingPersonalToken) {
            url += `?participating=true`;
        }
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            },
        }).catch(() => null);
        if (!response || !response.ok) return [];
        dev.log(Object.fromEntries(response.headers.entries()));
        const notifications: GhNotification[] = await response.json().catch(() => []);
        if (usingPersonalToken) {
            return notifications;
        }
        const goodReasons = [
            "review_requested",
            "security_alert",
            "mention",
            "team_mention",
            "assign",
            "author",
            "manual",
        ];
        return notifications.filter((n) => goodReasons.includes(n.reason));
    }

    /**
     * saves the token to the storage
     */
    async function setToken(token: string): Promise<string | null> {
        return await chrome.storage.local
            .set({ [GH_TOKEN_STORAGE_KEY]: token })
            .then(() => token)
            .catch(() => null);
    }

    /**
     * gets the token from the storage
     */
    async function getToken(): Promise<string | null> {
        return await chrome.storage.local
            .get({ [GH_TOKEN_STORAGE_KEY]: null })
            .then((storage) => storage[GH_TOKEN_STORAGE_KEY]);
    }

    /**
     * clears the token from the storage
     */
    async function clearToken(): Promise<void> {
        return await chrome.storage.local.remove(GH_TOKEN_STORAGE_KEY);
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

    /**
     * accepts a function and returns a new function that will only call the original function after a delay.
     * if the function is called again before the delay is over, the timer will be reset.
     * @param fn the function to debounce
     * @param delay the delay in milliseconds
     */
    function debounce<T extends AnyFn>(fn: T, delay: number): T {
        let timeout: ReturnType<typeof setTimeout> | null = null;
        return (async (...args: any[]) => {
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(async () => {
                await fn(...args);
                timeout = null;
            }, delay);
        }) as T;
    }

    /**
     * `throttle` is like `debounce`, but it will call the function at most once every `delay` milliseconds.
     * if the function is called again before the delay is over, the call will be ignored.
     * @param fn the function to throttle
     * @param delay the delay in milliseconds
     */
    function throttle<T extends AnyFn>(fn: T, delay: number): T {
        let timeout: ReturnType<typeof setTimeout> | null = null;
        return (async (...args: any[]) => {
            if (timeout) return;
            timeout = setTimeout(async () => {
                await fn(...args);
                timeout = null;
            }, delay);
        }) as T;
    }

    async function getPersonalToken(): Promise<string | null> {
        return await chrome.storage.local
            .get({ [GH_PERSONAL_TOKEN_STORAGE_KEY]: null })
            .then((storage) => storage[GH_PERSONAL_TOKEN_STORAGE_KEY]);
    }
})();

type AnyFn = (...args: any[]) => any;
