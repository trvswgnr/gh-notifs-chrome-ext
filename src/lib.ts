export const GH_TOKEN_STORAGE_KEY = "gh-notifs-token";
export const GH_PERSONAL_TOKEN_STORAGE_KEY = "gh-notifs-personal-token";
const noop = (..._args: any[]) => {};

export const getDev = () => {
    const dev = {
        log: (...args: any[]) => console.log(...args),
        error: (...args: any[]) => console.error(...args),
        warn: (...args: any[]) => console.warn(...args),
    };
    getEnv().then((env) => {
        if (env === "development") return;
        dev.log = noop;
        dev.error = noop;
        dev.warn = noop;
    });
    return dev;
};

/**
 * get the environment name
 */
export async function getEnv(): Promise<EnvName> {
    return (await chrome.management
        .getSelf()
        .then(({ installType }) => installType)
        .catch(() => "other")) as EnvName;
}

export type EnvName = "admin" | "development" | "normal" | "sideload" | "other";
