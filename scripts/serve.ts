import handler from "../api/auth";
import vercelConfig from "../vercel.json";

const server = Bun.serve({
    port: 3000,
    async fetch(request) {
        const url = new URL(request.url);
        const { pathname } = url;
        const matchingHeaders = getHeaders(pathname);
        if (pathname === "/api/auth") {
            const handlerResponse = await handler(request);
            const body = await handlerResponse.json();
            const headers = Object.assign(
                Object.fromEntries(handlerResponse.headers.entries()),
                matchingHeaders,
            );
            const status = handlerResponse.status;
            return new Response(JSON.stringify(body), {
                status,
                headers,
            });
        }
        return new Response(JSON.stringify({ message: "hello from Bun" }), {
            status: 200,
            headers: {
                "content-type": "application/json",
                ...matchingHeaders,
            },
        });
    },
});
console.log(`server running at ${server.url}`);

/** get the headers for a given pathname from vercel.json */
function getHeaders(pathname: string): Bun.HeadersInit {
    const vercelConfigHeaders = vercelConfig.headers;
    let headers: Bun.HeadersInit = {};
    let regex: RegExp;
    for (const entry of vercelConfigHeaders) {
        regex = new RegExp(entry.source);
        if (regex.test(pathname)) {
            for (const item of entry.headers) {
                headers[item.key] = item.value;
            }
        }
    }
    return headers;
}
