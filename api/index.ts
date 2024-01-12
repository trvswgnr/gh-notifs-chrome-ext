export const config = {
    runtime: "edge",
};

const badRequest = new Response(
    JSON.stringify({
        error: "bad request",
    }),
    {
        status: 400,
        headers: {
            "content-type": "application/json",
        },
    },
);

export default async function handler(request: Request) {
    if (request.method === "GET") {
        // bad request
        return badRequest;
    }
    const urlParams = new URL(request.url).searchParams;
    let body: { code?: string } | null = null;
    try {
        body = (await request.json()) as { code?: string };
    } catch (e) {
        body = null;
    }

    if (!body) return badRequest;
    const { code } = body;
    if (!code) return badRequest;
}
