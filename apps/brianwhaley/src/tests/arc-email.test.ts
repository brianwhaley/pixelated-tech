import { beforeEach, describe, expect, it, vi } from "vitest";

const { sendSmtpMail } = vi.hoisted(() => ({
	sendSmtpMail: vi.fn(),
}));

vi.mock("@pixelated-tech/components/server", () => ({
	getFullPixelatedConfig: () => ({
		siteInfo: {
			 email: "brian@example.com",
			 url: "https://www.example.com",
		},
	}),
	sendSmtpMail,
}));

import { sendArcReviewerEmail } from "@/app/(pages)/supermarketshenanigans/arc/arc-email";

describe("sendArcReviewerEmail", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubEnv("PIXELATED_CONFIG_KEY", "arc-test-key");
	});

	it("rejects an unapproved request without sending email", async () => {
		const result = await sendArcReviewerEmail({
			email: "reviewer@example.com",
			downloadCode: "NotApproved",
			format: "pdf",
			arcRequestId: "arc-rejected-request",
		});

		expect(result).toEqual({ success: false, message: "The ARC request is incomplete." });
		expect(sendSmtpMail).not.toHaveBeenCalled();
	});

	it("sends a download link for an approved code", async () => {
		const result = await sendArcReviewerEmail({
			email: "reviewer@example.com",
			downloadCode: "FamilyShenanigans",
			format: "pdf",
			arcRequestId: "arc-approved-request",
		});

		expect(result).toEqual({ success: true });
		expect(sendSmtpMail).toHaveBeenCalledTimes(1);
		expect(sendSmtpMail.mock.calls[0][0]).toMatchObject({
			from: "brian@example.com",
			to: "reviewer@example.com",
			subject: "Your Supermarket Shenanigans Author Review Copy",
		});
		expect(sendSmtpMail.mock.calls[0][0].text).toContain(
			"https://www.example.com/supermarketshenanigans/arc/download?token=",
		);
	});
});
