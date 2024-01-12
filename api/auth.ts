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
    return new Response(JSON.stringify({ message: "hello from /api/auth.ts" }), {
        status: 200,
        headers: {
            "content-type": "application/json",
        },
    });
}
