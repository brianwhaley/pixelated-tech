import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const [site, postId, image = "pixelated-social-publish-worker:local", confirmation, port = "9001"] = process.argv.slice(2);
const lambdaEndpoint = `http://127.0.0.1:${port}/2015-03-31/functions/function/invocations`;
const maxImageBytes = 3 * 1024 * 1024 * 1024;

if (!site || !postId || confirmation !== "--confirm-live") {
	throw new Error("Usage: npm run test:live-nextdoor -- <site> <postId> [image] --confirm-live [port]");
}
if (!/^([1-9][0-9]{3,4})$/.test(port) || Number(port) > 65535) throw new Error("The local port must be between 1000 and 65535.");
if (!process.env.PIXELATED_CONFIG_KEY) {
	throw new Error("PIXELATED_CONFIG_KEY must be set for the Lambda container.");
}

const inspect = spawnSync("docker", ["image", "inspect", `--format={{.Size}}`, image], { encoding: "utf8" });
if (inspect.status !== 0) {
	throw new Error(`Docker image ${image} is not available locally. Build it separately after the Docker safety preflight.`);
}

const imageBytes = Number.parseInt(inspect.stdout.trim(), 10);
if (!Number.isFinite(imageBytes) || imageBytes > maxImageBytes) {
	throw new Error(`Docker image ${image} exceeds the 3 GB safety limit.`);
}

const containerName = `social-publish-live-${process.pid}`;
const dockerArgs = [
	"run",
	"--rm",
	"--name",
	containerName,
	"--publish",
	`${port}:8080`,
	"--memory",
	"2g",
	"--memory-swap",
	"2g",
	"--cpus",
	"2",
	"--pids-limit",
	"512",
	"--read-only",
	"--tmpfs",
	"/tmp:rw,size=512m,nosuid,nodev",
	"--env",
	"PIXELATED_CONFIG_KEY",
	image,
];
const container = spawn("docker", dockerArgs, {
	env: {
		PATH: process.env.PATH || "/usr/bin:/bin",
		PIXELATED_CONFIG_KEY: process.env.PIXELATED_CONFIG_KEY,
	},
	stdio: ["ignore", "pipe", "pipe"],
});

container.stdout.on("data", (chunk) => process.stdout.write(chunk));
container.stderr.on("data", (chunk) => process.stderr.write(chunk));

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
let ready = false;
try {
	for (let attempt = 0; attempt < 60; attempt += 1) {
		try {
			await fetch(lambdaEndpoint);
			ready = true;
			break;
		} catch {
			await wait(500);
		}
	}
	if (!ready) throw new Error("The local Lambda container did not become ready within 30 seconds.");

	const invokerPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "invoke-local.mjs");
	const invocation = spawn(process.execPath, [invokerPath, site, postId, lambdaEndpoint], {
		stdio: "inherit",
	});
	const exitCode = await new Promise((resolve, reject) => {
		invocation.once("error", reject);
		invocation.once("close", resolve);
	});
	if (exitCode !== 0) process.exitCode = exitCode;
} finally {
	if (ready || container.exitCode === null) {
		spawnSync("docker", ["stop", containerName], { stdio: "ignore" });
	}
}