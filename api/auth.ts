export const config = {
    runtime: "edge",
};

export default async function handler(request: Request) {
    if (request.method === "GET") return badRequest();
    const { code } = await getJson<AnyObj>(request, {});
    if (!code) return badRequest();
    const token = await getAccessToken(String(code));
    if (!token) return serverError("missing access token");
    return new Response(JSON.stringify({ token }), {
        status: 200,
        headers: { "content-type": "application/json" },
    });
}

function tryFn<F extends (...args: any[]) => any>(fn: F, ...args: Parameters<F>) {
    try {
        return fn(...args);
    } catch (e) {
        return null;
    }
}

const JSON_HEADERS = { "content-type": "application/json" };

function badRequest(error = "bad request") {
    return new Response(JSON.stringify({ error }), {
        status: 400,
        headers: JSON_HEADERS,
    });
}

function serverError(error: string, status?: number) {
    return new Response(
        JSON.stringify({
            error,
        }),
        {
            status: status ?? 500,
            headers: JSON_HEADERS,
        },
    );
}

async function getJson<T>(res: Response | Request, _default: T): Promise<T> {
    return (await res.json().catch(() => _default)) as T;
}

// POST https://github.com/login/oauth/access_token
async function getAccessToken(code: string) {
    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
        return null;
    }
    const res = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
            "content-type": "application/json",
            accept: "application/json",
        },
        body: JSON.stringify({
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code,
        }),
    });

    const { access_token } = await getJson<AnyObj>(res, {});
    return String(access_token);
}

type AnyObj = Record<PropertyKey, unknown>;
