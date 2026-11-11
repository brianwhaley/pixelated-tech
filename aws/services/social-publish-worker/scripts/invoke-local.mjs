import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const [site, postId, endpoint = "http://127.0.0.1:9000/2015-03-31/functions/function/invocations"] = process.argv.slice(2);

if (!site || !postId) {
	throw new Error("Usage: npm run invoke:local -- <site> <postId> [lambda-endpoint]");
}

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const configPath = path.join(repositoryRoot, "apps/pixelated-admin/src/app/config/pixelated.config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const secret = config.integrations?.socialPublish?.wordpress?.webhookSecrets?.[site];

if (!secret) {
	throw new Error(`No WordPress webhook secret is configured for ${site}.`);
}

const requestId = crypto.randomUUID();
const payload = {
	postId: String(postId),
	postUrl: `https://${site}/?p=${encodeURIComponent(postId)}`,
	destinations: ["nextdoor"],
};
const rawBody = JSON.stringify(payload);
const signature = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
const event = {
	requestId,
	rawBody,
	headers: {
		"content-type": "application/json",
		"x-wordpress-signature": `sha256=${signature}`,
	},
	payload,
};

const response = await fetch(endpoint, {
	method: "POST",
	headers: { "content-type": "application/json" },
	body: JSON.stringify(event),
});
const responseBody = await response.text();
let lambdaError = false;
try {
	const result = JSON.parse(responseBody);
	lambdaError = Boolean(result.errorType || result.errorMessage);
} catch {
	lambdaError = false;
}

console.log(JSON.stringify({ requestId, httpStatus: response.status, responseBody }, null, 2));

if (!response.ok || lambdaError) process.exitCode = 1;