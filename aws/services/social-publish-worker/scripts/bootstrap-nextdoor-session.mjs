import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer";

const outputPath = path.resolve(process.argv[2] || "/tmp/nextdoor-session.json");
const browser = await puppeteer.launch({ headless: false, defaultViewport: { width: 1400, height: 900 } });

try {
	const page = await browser.newPage();
	await page.goto("https://nextdoor.com/login/", { waitUntil: "domcontentloaded" });
	console.log("Complete the Nextdoor login and email verification in the browser.");
	console.log("After the business page is visible, press Enter here to save the session.");
	process.stdin.setEncoding("utf8");
	await new Promise((resolve) => process.stdin.once("data", resolve));
	const cookies = await page.cookies("https://nextdoor.com");
	if (cookies.length === 0) throw new Error("No Nextdoor cookies were found after login.");
	await fs.mkdir(path.dirname(outputPath), { recursive: true });
	await fs.writeFile(outputPath, `${JSON.stringify({ cookies }, null, 2)}\n`, { mode: 0o600 });
	console.log(`Saved ${cookies.length} cookies to ${outputPath}`);
} finally {
	await browser.close();
}