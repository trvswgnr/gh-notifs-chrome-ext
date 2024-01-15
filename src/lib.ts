export const GH_TOKEN_STORAGE_KEY = "gh-notifs-token";
export const GH_PERSONAL_TOKEN_STORAGE_KEY = "gh-notifs-personal-token";
const noop = (..._args: any[]) => {};

export const getDev = async () => {
    let dev = {
        log: (...args: any[]) => console.log(...args),
        error: (...args: any[]) => console.error(...args),
        warn: (...args: any[]) => console.warn(...args),
    };
    const env = await getEnv();
    if (env !== "development") {
        dev = {
            log: noop,
            error: noop,
            warn: noop,
        };
    }
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
