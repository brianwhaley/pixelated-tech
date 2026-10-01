import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const TOKEN_LIFETIME_MS = 72 * 60 * 60 * 1000;
const ARC_FORMATS = new Set(["epub", "pdf"]);

const ARC_ALLOWED_VALUES: { allowedEmails: string[]; allowedDownloadCodes: string[] } = {
	"allowedEmails": [],
	"allowedDownloadCodes": [
		"FamilyShenanigans",
		"ARCShenanigans",
		"LibraryThingShenanigans"
	]
};

export function isArcRequestAllowed(email: string, downloadCode: string) {
	const normalizedEmail = email.trim().toLowerCase();
	const normalizedDownloadCode = downloadCode.trim();

	return ARC_ALLOWED_VALUES.allowedEmails.some((allowedEmail) => allowedEmail.toLowerCase() === normalizedEmail)
		|| ARC_ALLOWED_VALUES.allowedDownloadCodes.includes(normalizedDownloadCode);
}

export type ArcFormat = "epub" | "pdf";

export type ArcDownloadToken = {
	arcRequestId: string;
	email: string;
	format: ArcFormat;
	issuedAt: string;
	expiresAt: string;
};

function getTokenKey() {
	const configKey = process.env.PIXELATED_CONFIG_KEY;
	if (!configKey) {
		throw new Error("ARC download token key is not configured.");
	}
	return createHash("sha256").update(configKey).digest();
}

export function createArcDownloadToken(input: Omit<ArcDownloadToken, "issuedAt" | "expiresAt">, now = new Date()) {
	const issuedAt = now.toISOString();
	const expiresAt = new Date(now.getTime() + TOKEN_LIFETIME_MS).toISOString();
	const payload = JSON.stringify({ ...input, issuedAt, expiresAt });
	const iv = randomBytes(12);
	const cipher = createCipheriv("aes-256-gcm", getTokenKey(), iv);
	const encrypted = Buffer.concat([cipher.update(payload, "utf8"), cipher.final()]);
	const authTag = cipher.getAuthTag();

	return [iv, authTag, encrypted].map((value) => value.toString("base64url")).join(".");
}

export function decryptArcDownloadToken(token: string): ArcDownloadToken | null {
	try {
		const parts = token.split(".");
		if (parts.length !== 3) return null;

		const [iv, authTag, encrypted] = parts.map((part) => Buffer.from(part, "base64url"));
		const decipher = createDecipheriv("aes-256-gcm", getTokenKey(), iv);
		decipher.setAuthTag(authTag);
		const payload = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
		const parsed = JSON.parse(payload) as Partial<ArcDownloadToken>;

		if (
			typeof parsed.arcRequestId !== "string" ||
			typeof parsed.email !== "string" ||
			!ARC_FORMATS.has(parsed.format ?? "") ||
			typeof parsed.issuedAt !== "string" ||
			typeof parsed.expiresAt !== "string" ||
			Date.parse(parsed.expiresAt) <= Date.now()
		) {
			return null;
		}

		return parsed as ArcDownloadToken;
	} catch {
		return null;
	}
}
