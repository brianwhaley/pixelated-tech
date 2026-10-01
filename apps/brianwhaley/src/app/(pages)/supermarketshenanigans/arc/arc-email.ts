"use server";

import { getFullPixelatedConfig, sendSmtpMail } from "@pixelated-tech/components/server";
import { createArcDownloadToken, isArcRequestAllowed, type ArcFormat } from "./arc-token";

const ARC_DOWNLOAD_PATH = "/supermarketshenanigans/arc/download";
const ARC_FORMATS = new Set(["epub", "pdf"]);

type SendArcReviewerEmailInput = {
	email: string;
	downloadCode: string;
	format: string;
	arcRequestId: string;
};

export async function sendArcReviewerEmail(input: SendArcReviewerEmailInput) {
	const email = input.email.trim();
	const downloadCode = input.downloadCode.trim();
	const format = input.format.trim().toLowerCase();
	const arcRequestId = input.arcRequestId.trim();

	if (!email || !email.includes("@") || !ARC_FORMATS.has(format) || !arcRequestId || !isArcRequestAllowed(email, downloadCode)) {
		return { success: false, message: "The ARC request is incomplete." };
	}

	try {
		const token = createArcDownloadToken({
			email,
			format: format as ArcFormat,
			arcRequestId,
		});
		const siteInfo = getFullPixelatedConfig().siteInfo;
		const sender = siteInfo?.email;
		const siteUrl = siteInfo?.url;
		if (!sender || !siteUrl) {
			throw new Error("ARC email sender configuration is incomplete.");
		}

		const downloadUrl = new URL(`${ARC_DOWNLOAD_PATH}?token=${encodeURIComponent(token)}`, siteUrl).toString();
		await sendSmtpMail({
			from: sender,
			to: email,
			subject: "Your Supermarket Shenanigans Author Review Copy",
			text: [
				"Thank you for requesting an Author Review Copy of Supermarket Shenanigans.",
				"",
				`Download format: ${format.toUpperCase()}`,
				`Download link: ${downloadUrl}`,
				"",
				"This link expires in 72 hours.",
			].join("\n"),
		});

		return { success: true };
	} catch (error) {
		console.error("ARC reviewer email failed", error);
		return { success: false, message: "The reviewer email could not be sent." };
	}
}
