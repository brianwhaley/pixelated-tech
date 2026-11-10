import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const imageEncryptedConfigPath = "/var/task/src/app/config/pixelated.config.json.enc";
const runtimeEncryptedConfigPath = "/tmp/pixelated.config.json.enc";
const runtimeConfigPath = "/tmp/pixelated.config.json";
const configVaultPath = "/var/task/config-vault.mjs";
const nextdoorSessionSecretPrefix = "social-publish/nextdoor-session";
const secretsManager = new SecretsManagerClient({});

async function getNextdoorSession(site) {
	const secretId = `${nextdoorSessionSecretPrefix}/${encodeURIComponent(site)}`;
	let result;
	try {
		result = await secretsManager.send(new GetSecretValueCommand({ SecretId: secretId }), {
			abortSignal: AbortSignal.timeout(20000),
		});
	} catch (error) {
		if (error?.name === "ResourceNotFoundException") return null;
		throw error;
	}
	if (!result.SecretString) throw new Error("Nextdoor session secret is empty.");
	let session;
	try {
		session = JSON.parse(result.SecretString);
	} catch {
		throw new Error("Nextdoor session secret is not valid JSON.");
	}
	if (!Array.isArray(session?.cookies) || session.cookies.length === 0) {
		throw new Error("Nextdoor session secret does not contain cookies.");
	}
	return { cookies: session.cookies };
}

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

const debug = true;

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

	logDebug(requestId, "webhook-verified", { site });
	logDebug(requestId, "social-publish-started", {
		site,
		post_id: payload.postId || "",
		post_url: payload.postUrl || "",
	});
	try {
		logDebug(requestId, "nextdoor-session-loading", { site });
		const nextdoorSession = await getNextdoorSession(site);
		logDebug(requestId, "nextdoor-session-loaded", { site, session_present: Boolean(nextdoorSession) });
		logDebug(requestId, "social-publish-browser-starting", { site });
		const result = await publishSocialPost({
			site,
			postId: payload.postId,
			postUrl: payload.postUrl,
			destinations: payload.destinations,
			nextdoorSession: nextdoorSession || undefined,
		});
		logDebug(requestId, "social-publish-succeeded", result);
		return result;
	} catch (error) {
		console.error("Social publish worker:", {
			requestId,
			stage: "social-publish-failed",
			site,
			error: error instanceof Error ? error.message : String(error),
		});
		throw error;
	}
};

export { getNextdoorSession };
