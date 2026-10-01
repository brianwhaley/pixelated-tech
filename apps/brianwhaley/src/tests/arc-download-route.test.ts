import { beforeEach, describe, expect, it } from "vitest";
import { GET } from "@/app/(pages)/supermarketshenanigans/arc/download/route";
import { createArcDownloadToken } from "@/app/(pages)/supermarketshenanigans/arc/arc-token";

describe("ARC download route", () => {
	beforeEach(() => {
		process.env.PIXELATED_CONFIG_KEY = "arc-test-key";
	});

	it("rejects a request without a token", async () => {
		const response = await GET(new Request("https://www.example.com/supermarketshenanigans/arc/download"));

		expect(response.status).toBe(400);
		expect(await response.text()).toContain("valid ARC download token");
	});

	it("rejects an invalid token", async () => {
		const response = await GET(new Request("https://www.example.com/supermarketshenanigans/arc/download?token=invalid"));

		expect(response.status).toBe(410);
		expect(await response.text()).toContain("invalid or has expired");
	});

	it("streams an authorized EPUB download without caching", async () => {
		const token = createArcDownloadToken({
			arcRequestId: "arc-route-request",
			email: "reviewer@example.com",
			format: "epub",
		});
		const response = await GET(new Request(`https://www.example.com/supermarketshenanigans/arc/download?token=${token}`));

		expect(response.status).toBe(200);
		expect(response.headers.get("Cache-Control")).toBe("private, no-store, max-age=0");
		expect(response.headers.get("Content-Type")).toBe("application/epub+zip");
		expect(response.headers.get("Content-Disposition")).toContain("Supermarket Shenanigans v1.04 550x850.epub");
		expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(0);
	});
});
