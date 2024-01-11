#!/usr/bin/env bun

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import manifest from "./extension/manifest.json";

const srcdir = "extension";
const outdir = "dist";
const buildScriptDir = path.dirname(fileURLToPath(import.meta.url));
const validExtensions = [".ts", ".js", ".tsx", ".jsx"];
const rawEntrypoints = await getEntrypoints(manifest);
const entrypoints = await validateEntrypoints(rawEntrypoints);
const watchFlag = process.argv.includes("--watch") || process.argv.includes("-w") ? "--watch" : "";

// clean the extension directory
await fs.rm(path.join(buildScriptDir, outdir), { recursive: true, force: true });

// if the extension directory does not exist, create it
if (!(await fs.stat(path.join(buildScriptDir, outdir)).catch(() => null))) {
    await fs.mkdir(path.join(buildScriptDir, outdir));
}

// write the manifest file with the correct extensions
const manifestFile = replaceTsWithJs(manifest);
await Bun.write(
    path.join(buildScriptDir, outdir, "manifest.json"),
    JSON.stringify(manifestFile, null, 4),
);

const { exited } = Bun.spawn(
    [
        "bun",
        "build",
        watchFlag,
        ...entrypoints,
        "--target",
        "browser",
        "--outdir",
        path.join(buildScriptDir, outdir),
        "--asset-naming",
        "[dir]/[name].[ext]",
    ],
    { cwd: path.join(buildScriptDir, srcdir) },
);
const code = await exited;
process.exit(code);

async function getEntrypoints(_manifest: unknown, entrypoints: string[] = []) {
    if (!_manifest || typeof _manifest !== "object") return entrypoints;
    const manifest = _manifest as Record<string, unknown>;
    for (const key in manifest) {
        const value = manifest[key];
        if (endsWith(value, ".ts", ".js")) {
            entrypoints.push(value);
            continue;
        }
        if (endsWith(value, ".html")) {
            // look for scripts in the html file
            const html = await fs.readFile(path.join(buildScriptDir, srcdir, value), "utf8").catch(() => null);
            if (!html) {
                console.error(`Could not read file ${value}`);
                process.exit(1);
            }
            const scripts = html.matchAll(/<script[^>]*\bsrc[\n\s]*=\s*["']([^"']*)["']/gm);
            for (const src of scripts) {
                const path = src[1];
                if (endsWith(path, ...validExtensions)) {
                    entrypoints.push(path);
                }
            }
            continue;
        }

        await getEntrypoints(value, entrypoints);
    }
    return entrypoints;
}

function replaceTsWithJs(file: Manifest): Manifest {
    return JSON.parse(JSON.stringify(file).replace(/\.ts"/g, '.js"'));
}

function endsWith(str: unknown, ...suffix: string[]): str is string {
    if (typeof str !== "string") return false;
    return suffix.some((s) => str.endsWith(s));
}

async function validateEntrypoints(entrypoints: string[]) {
    const validated: string[] = [];
    const validExts = validExtensions;
    const missing: string[] = [];
    for (const entrypoint of entrypoints) {
        let hasValidExt = false;
        const exists = await fs.stat(path.join(buildScriptDir, entrypoint)).catch(() => null);
        if (exists && exists.isFile()) {
            validated.push(entrypoint);
            hasValidExt = true;
        }
        if (!exists) {
            for (const ext of validExts) {
                const extname = path.extname(entrypoint);
                const basename = entrypoint.slice(0, -extname.length);
                const exists = await fs
                    .stat(path.join(basename + ext))
                    .catch(() => null);
                if (exists && exists.isFile()) {
                    validated.push(basename + ext);
                    hasValidExt = true;
                }
            }
        }
        if (!hasValidExt) {
            missing.push(entrypoint);
        }
    }
    if (missing.length) {
        console.error("The following entrypoints could not be found:");
        console.warn(missing);
        console.log(
            "Check your manifest.json file and make sure that all of the entrypoints exist.",
        );
        process.exit(1);
    }
    return validated;
}
