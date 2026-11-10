import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { randomUUID } from "node:crypto";

const imageEncryptedConfigPath = "/var/task/src/app/config/pixelated.config.json.enc";
const runtimeEncryptedConfigPath = "/tmp/pixelated.config.json.enc";
const runtimeConfigPath = "/tmp/pixelated.config.json";
const configVaultPath = "/var/task/node_modules/@pixelated-tech/components/dist/scripts/config-vault.js";

function prepareRuntimeConfig() {
	if (!fs.existsSync(imageEncryptedConfigPath)) return;
	if (!process.env.PIXELATED_CONFIG_KEY) {
		throw new Error("PIXELATED_CONFIG_KEY is required to decrypt the worker config.");
	}

	fs.copyFileSync(imageEncryptedConfigPath, runtimeEncryptedConfigPath);
	execFileSync(process.execPath, [configVaultPath, "decrypt", runtimeEncryptedConfigPath], {
		stdio: "inherit",
	});
	if (!fs.existsSync(runtimeConfigPath)) {
		throw new Error("Worker config decryption did not produce /tmp/pixelated.config.json.");
	}
	process.chdir("/tmp");
}

prepareRuntimeConfig();

const debug = false;

export const getWorkerPayload = (event) => {
	if (!event || typeof event !== "object") return null;
	return event.payload && event.rawBody && event.headers ? event : null;
};

export const getSiteFromPostUrl = (postUrl) => {
	if (typeof postUrl !== "string" || !postUrl.trim()) return "";
	try {
		return new URL(postUrl).hostname.toLowerCase();
	} catch {
		return "";
	}
};

function logDebug(requestId, stage, details = {}) {
	if (debug) console.log("Social publish worker:", { requestId, stage, ...details });
}

export const handler = async (event) => {
	const workerPayload = getWorkerPayload(event);
	const requestId = workerPayload?.requestId || randomUUID();
	if (!workerPayload) throw new Error("Invalid social publish worker payload.");

	const { getFullPixelatedConfig } = await import("@pixelated-tech/components/config/server");
	const { verifyWordPressWebhookSignature } = await import("@pixelated-tech/components/wordpress/server");
	const { publishSocialPost } = await import("@pixelated-tech/components/socialpublish/server");
	const { payload, rawBody, headers } = workerPayload;
	const site = getSiteFromPostUrl(payload.postUrl);
	if (!site) throw new Error("A valid postUrl is required to identify the WordPress site.");

	const secret = getFullPixelatedConfig().integrations?.socialPublish?.wordpress?.webhookSecrets?.[site] || "";
	if (!secret || !verifyWordPressWebhookSignature(rawBody, headers["x-wordpress-signature"] || null, secret)) {
		throw new Error("Invalid webhook signature.");
	}
	if (!payload.postId && !payload.postUrl) throw new Error("Provide at least one of postId or postUrl.");

	logDebug(requestId, "social-publish-started", {
		site,
		post_id: payload.postId || "",
		post_url: payload.postUrl || "",
	});
	const result = await publishSocialPost({
		site,
		postId: payload.postId,
		postUrl: payload.postUrl,
		destinations: payload.destinations,
	});
	logDebug(requestId, "social-publish-succeeded", result);
	return result;
};
