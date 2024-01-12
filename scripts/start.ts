import path from "path";

const thisDir = path.dirname(new URL(import.meta.url).pathname);
const [child1, child2] = ["build", "serve"].map((script) =>
    Bun.spawn(["bun", path.join(thisDir, `${script}.ts`)], { stdout: "pipe", stderr: "pipe" }),
);

const printer = Printer();
printer.print(child1.stdout, "build");
printer.print(child1.stderr, "build");
printer.print(child2.stdout, "serve");
printer.print(child2.stderr, "serve");

function Printer() {
    const decoder = new TextDecoder();
    let colorFn = 0;
    return {
        async print(stream: ReadableStream<Uint8Array>, name: string) {
            const color = getColorFn(colorFn++);
            for await (const data of stream) {
                const tag = color(`[${name}]`);
                process.stdout.write(
                    `${tag}: ` + decoder.decode(data).replace(/\n+/g, "\n").trim() + "\n",
                );
            }
        },
    };
}

function getColorFn(index?: number) {
    const colors = [
        "\x1b[34m", // blue
        "\x1b[36m", // cyan
        "\x1b[35m", // magenta
        "\x1b[32m", // green
        "\x1b[33m", // yellow
    ];
    if (index !== undefined)
        return (str: string) => colors[index % colors.length] + str + "\x1b[0m";
    const color = colors[Math.floor(Math.random() * colors.length)];
    return (str: string) => color + str + "\x1b[0m";
}
