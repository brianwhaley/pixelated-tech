import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createArcDownloadToken,
	decryptArcDownloadToken,
	isArcRequestAllowed,
} from "@/app/(pages)/supermarketshenanigans/arc/arc-token";

describe("ARC authorization and download tokens", () => {
	beforeEach(() => {
		vi.stubEnv("PIXELATED_CONFIG_KEY", "arc-test-key");
	});

	it("allows an approved download code", () => {
		expect(isArcRequestAllowed("reviewer@example.com", "FamilyShenanigans")).toBe(true);
		expect(isArcRequestAllowed("reviewer@example.com", " ARCShenanigans ")).toBe(true);
	});

	it("rejects an email and code that are not approved", () => {
		expect(isArcRequestAllowed("reviewer@example.com", "NotApproved")).toBe(false);
	});

	it("creates and decrypts a valid token", () => {
		const token = createArcDownloadToken({
			arcRequestId: "arc-test-request",
			email: "reviewer@example.com",
			format: "pdf",
		});

		expect(decryptArcDownloadToken(token)).toMatchObject({
			arcRequestId: "arc-test-request",
			email: "reviewer@example.com",
			format: "pdf",
		});
	});

	it("rejects an expired token", () => {
		const issuedAt = new Date(Date.now() - 73 * 60 * 60 * 1000);
		const token = createArcDownloadToken(
			{
				arcRequestId: "arc-expired-request",
				email: "reviewer@example.com",
				format: "epub",
			},
			issuedAt,
		);

		expect(decryptArcDownloadToken(token)).toBeNull();
	});

	it("rejects a tampered token", () => {
		const token = createArcDownloadToken({
			arcRequestId: "arc-tampered-request",
			email: "reviewer@example.com",
			format: "epub",
		});
		const [iv, authTag, encrypted] = token.split(".");
		const tamperedAuthTag = `${authTag[0] === "A" ? "B" : "A"}${authTag.slice(1)}`;
		const tamperedToken = [iv, tamperedAuthTag, encrypted].join(".");

		expect(decryptArcDownloadToken(tamperedToken)).toBeNull();
	});
});
