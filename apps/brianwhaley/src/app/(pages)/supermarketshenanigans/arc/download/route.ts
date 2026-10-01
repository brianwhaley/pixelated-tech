import { readFile } from "node:fs/promises";
import path from "node:path";
import { decryptArcDownloadToken } from "../arc-token";

export const runtime = "nodejs";

const DOWNLOAD_FILES = {
	epub: {
		filename: "Supermarket Shenanigans v1.04 550x850.epub",
		contentType: "application/epub+zip",
	},
	pdf: {
		filename: "Supermarket Shenanigans v1.04 550x850.pdf",
		contentType: "application/pdf",
	},
} as const;

export async function GET(request: Request) {
	const token = new URL(request.url).searchParams.get("token");
	if (!token) {
		return new Response("A valid ARC download token is required.", { status: 400 });
	}

	const tokenData = decryptArcDownloadToken(token);
	if (!tokenData) {
		return new Response("This ARC download link is invalid or has expired.", { status: 410 });
	}

	const download = DOWNLOAD_FILES[tokenData.format];
	const filePath = path.join(process.cwd(), "src/app/(pages)/supermarketshenanigans/arc/download", download.filename);

	try {
		const file = await readFile(filePath);
		return new Response(new Uint8Array(file), {
			status: 200,
			headers: {
				"Cache-Control": "private, no-store, max-age=0",
				"Content-Disposition": `attachment; filename="${download.filename}"`,
				"Content-Length": String(file.byteLength),
				"Content-Type": download.contentType,
			},
		});
	} catch (error) {
		console.error("ARC download file could not be read", error);
		return new Response("The requested ARC file is unavailable.", { status: 404 });
	}
}
