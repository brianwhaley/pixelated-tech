import fs from "node:fs";
import path from "node:path";
import { createEmptyPerson, Person, type PersonType } from "./person.functions";

export const DOMAIN_EXTRACTS_DIRECTORY = path.join("public", "data", "domain-extractor", "extracts");

export type DomainDiscoveryCheckpointEntry = {
	url: string;
	depth: number;
	isDetail: boolean;
	status: "discovered" | "fetching" | "fetched" | "failed" | "extracted";
};

export type DomainMenuPaginationCheckpoint = {
	type: "kendo";
	page: number;
	totalPages?: number;
	status: "discovered" | "fetching" | "fetched" | "failed";
};

export type DomainDiscoveryCheckpoint = {
	version: 1;
	extractFileName: string;
	startUrl: string;
	siteName: string;
	maxPages: number;
	maxDepth: number;
	requestDelayMs: number;
	discoveryType?: "crawler" | "menu";
	menuPaginationType?: "kendo";
	menuPagination?: DomainMenuPaginationCheckpoint;
	crawlPages: DomainDiscoveryCheckpointEntry[];
	detailUrls: string[];
	extractedDetailUrls: string[];
	counters: {
	fetchAttempts: number;
	pagesFetched: number;
	discoveryPagesFetched: number;
	pagesFailed: number;
	rateLimitResponses: number;
	rateLimitedPages: number;
	};
	phase: "discovery" | "extraction" | "complete";
	updatedAt: string;
};

export type DomainDiscoveryRun = {
	discoveryFileName: string;
	extractFileName: string;
	siteName: string;
	startUrl: string;
	phase: DomainDiscoveryCheckpoint["phase"];
	updatedAt: string;
};

function ensureExtractDirectory(filePath: string): void {
	const directory = path.dirname(filePath);
	if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });
}

export function initializePeopleExtractFile(fileName: string, rootDirectory = process.cwd()): string {
	const filePath = getDomainExtractFilePath(fileName, rootDirectory);
	ensureExtractDirectory(filePath);
	fs.writeFileSync(filePath, "", "utf8");
	return filePath;
}

export function appendPeopleToExtractFile(fileName: string, people: Partial<PersonType>[], rootDirectory = process.cwd()): string {
	const filePath = getDomainExtractFilePath(fileName, rootDirectory);
	ensureExtractDirectory(filePath);
	const results = people.map((person) => ({
		...createEmptyPerson(),
		...Person.from(person).toJSON()
	} as PersonType));
	if (results.length > 0) fs.appendFileSync(filePath, `${results.map((result) => JSON.stringify(result)).join("\n")}\n`, "utf8");
	return filePath;
}

export function readPeopleFromExtractFile(fileName: string, rootDirectory = process.cwd()): PersonType[] {
	const filePath = getDomainExtractFilePath(fileName, rootDirectory);
	if (!fs.existsSync(filePath)) return [];
	const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
	return lines.flatMap((line, index) => {
		try {
			return [JSON.parse(line) as PersonType];
		} catch (error) {
			if (index === lines.length - 1) return [];
			throw error;
		}
	});
}

export function readExtractedSourceUrls(fileName: string, rootDirectory = process.cwd()): Set<string> {
	const filePath = getDomainExtractFilePath(fileName, rootDirectory);
	if (!fs.existsSync(filePath)) return new Set<string>();
	const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
	const sourceUrls = new Set<string>();
	for (const [index, line] of lines.entries()) {
		try {
			const person = JSON.parse(line) as { sourceUrl?: unknown };
			if (Array.isArray(person.sourceUrl)) {
				for (const sourceUrl of person.sourceUrl) {
					if (typeof sourceUrl === "string" && sourceUrl) sourceUrls.add(sourceUrl);
				}
			}
		} catch (error) {
			if (index !== lines.length - 1) throw error;
		}
	}
	return sourceUrls;
}

export function createDomainDiscoveryFileName(extractFileName: string): string {
	if (path.basename(extractFileName) !== extractFileName || !extractFileName.endsWith(".jsonl")) {
		throw new Error("Extract filename must be a JSONL basename");
	}
	if (!/-extract\.jsonl$/.test(extractFileName)) throw new Error("Extract filename must end with -extract.jsonl");
	return extractFileName.replace(/-extract\.jsonl$/, "-discovery.json");
}

export function createDomainExtractFileNameFromDiscoveryFile(discoveryFileName: string): string {
	if (path.basename(discoveryFileName) !== discoveryFileName || !/-discovery\.json$/.test(discoveryFileName)) {
		throw new Error("Discovery filename must end with -discovery.json");
	}
	return discoveryFileName.replace(/-discovery\.json$/, "-extract.jsonl");
}

export function getDomainDiscoveryFilePath(extractFileName: string, rootDirectory = process.cwd()): string {
	return path.join(rootDirectory, DOMAIN_EXTRACTS_DIRECTORY, createDomainDiscoveryFileName(extractFileName));
}

export function hasDomainExtractFile(fileName: string, rootDirectory = process.cwd()): boolean {
	return fs.existsSync(getDomainExtractFilePath(fileName, rootDirectory));
}

export function listDomainDiscoveryFiles(rootDirectory = process.cwd()): DomainDiscoveryRun[] {
	const directory = path.join(rootDirectory, DOMAIN_EXTRACTS_DIRECTORY);
	if (!fs.existsSync(directory)) return [];
	return fs.readdirSync(directory, { withFileTypes: true })
		.filter((entry) => entry.isFile() && /-discovery\.json$/.test(entry.name))
		.flatMap((entry) => {
			try {
				const discoveryFileName = entry.name;
				const extractFileName = createDomainExtractFileNameFromDiscoveryFile(discoveryFileName);
				const checkpoint = readDomainDiscoveryCheckpoint(extractFileName, rootDirectory);
				if (!checkpoint || !hasDomainExtractFile(extractFileName, rootDirectory)) return [];
				return [{ discoveryFileName, extractFileName, siteName: checkpoint.siteName, startUrl: checkpoint.startUrl, phase: checkpoint.phase, updatedAt: checkpoint.updatedAt }];
			} catch {
				return [];
			}
		})
		.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function writeDomainDiscoveryCheckpoint(checkpoint: DomainDiscoveryCheckpoint, rootDirectory = process.cwd()): string {
	const filePath = getDomainDiscoveryFilePath(checkpoint.extractFileName, rootDirectory);
	ensureExtractDirectory(filePath);
	const temporaryPath = `${filePath}.tmp`;
	fs.writeFileSync(temporaryPath, JSON.stringify(checkpoint, null, 2), "utf8");
	fs.renameSync(temporaryPath, filePath);
	return filePath;
}

export function readDomainDiscoveryCheckpoint(extractFileName: string, rootDirectory = process.cwd()): DomainDiscoveryCheckpoint | null {
	const filePath = getDomainDiscoveryFilePath(extractFileName, rootDirectory);
	if (!fs.existsSync(filePath)) return null;
	return JSON.parse(fs.readFileSync(filePath, "utf8")) as DomainDiscoveryCheckpoint;
}

export function createDomainExtractFileName(siteName: string, date = new Date()): string {
	const safeSiteName = siteName.trim().replace(/[^a-zA-Z0-9._-]+/g, "-");
	if (!safeSiteName) throw new Error("A configured site name is required to create an extract filename");
	const parts = [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()];
	const timestamp = parts.map((part, index) => index === 0 ? String(part).padStart(4, "0") : String(part).padStart(2, "0")).join("-");
	return `${timestamp}-${safeSiteName}-extract.jsonl`;
}

export function getDomainExtractFilePath(fileName: string, rootDirectory = process.cwd()): string {
	if (path.basename(fileName) !== fileName || !fileName.endsWith(".jsonl")) {
		throw new Error("Extract filename must be a JSONL basename");
	}
	return path.join(rootDirectory, DOMAIN_EXTRACTS_DIRECTORY, fileName);
}