import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	appendPeopleToExtractFile,
	createDomainDiscoveryFileName,
	createDomainExtractFileName,
	createDomainExtractFileNameFromDiscoveryFile,
	getDomainDiscoveryFilePath,
	getDomainExtractFilePath,
	initializePeopleExtractFile,
	listDomainDiscoveryFiles,
	readDomainDiscoveryCheckpoint,
	readExtractedSourceUrls,
	readPeopleFromExtractFile,
	writeDomainDiscoveryCheckpoint
} from '../components/admin/scraper/domain-extract-writer.server';

describe('domain extract writer', () => {
	it('creates a configured-site filename', () => {
		expect(createDomainExtractFileName('sunCityHiltonHead', new Date(2026, 10, 6, 14, 32, 10))).toBe('2026-11-06-14-32-10-sunCityHiltonHead-extract.jsonl');
		expect(createDomainDiscoveryFileName('2026-11-06-14-32-10-sunCityHiltonHead-extract.jsonl')).toBe('2026-11-06-14-32-10-sunCityHiltonHead-discovery.json');
		expect(createDomainExtractFileNameFromDiscoveryFile('2026-11-06-14-32-10-sunCityHiltonHead-discovery.json')).toBe('2026-11-06-14-32-10-sunCityHiltonHead-extract.jsonl');
	});

	it('appends normalized results without rewriting earlier lines', () => {
		const rootDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'domain-extract-'));
		const fileName = '2026-11-06-14-32-10-sunCityHiltonHead-extract.jsonl';

		initializePeopleExtractFile(fileName, rootDirectory);
		appendPeopleToExtractFile(fileName, [
			{ firstName: 'Ada', lastName: 'Lovelace', emails: ['ada@example.com'], sourceUrl: ['https://example.com/detail/ada'] },
		], rootDirectory);
		appendPeopleToExtractFile(fileName, [
			{ firstName: 'Ada', lastName: 'Lovelace', emails: ['ada.work@example.com'], sourceUrl: ['https://example.com/detail/ada-duplicate'] }
		], rootDirectory);

		const output = readPeopleFromExtractFile(fileName, rootDirectory);
		expect(output).toHaveLength(2);
		expect(output[0]).toMatchObject({ firstName: 'Ada', lastName: 'Lovelace', emails: ['ada@example.com'] });
		expect(output[1]).toMatchObject({ firstName: 'Ada', lastName: 'Lovelace', emails: ['ada.work@example.com'] });
		expect(fs.readFileSync(getDomainExtractFilePath(fileName, rootDirectory), 'utf8').split('\n').filter(Boolean)).toHaveLength(2);
	});

	it('ignores a truncated final line during recovery', () => {
		const rootDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'domain-extract-'));
		const fileName = '2026-11-06-14-32-10-sunCityHiltonHead-extract.jsonl';
		initializePeopleExtractFile(fileName, rootDirectory);
		appendPeopleToExtractFile(fileName, [{ firstName: 'Ada', sourceUrl: ['https://example.com/detail/ada'] }], rootDirectory);
		fs.appendFileSync(getDomainExtractFilePath(fileName, rootDirectory), '{"firstName":"incomplete"', 'utf8');

		expect(readPeopleFromExtractFile(fileName, rootDirectory)).toHaveLength(1);
	});

	it('writes and reads an atomic discovery checkpoint beside the extract', () => {
		const rootDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'domain-extract-'));
		const extractFileName = '2026-11-06-14-32-10-sunCityHiltonHead-extract.jsonl';
		const checkpoint = {
			version: 1 as const,
			extractFileName,
			startUrl: 'https://example.com/start',
			siteName: 'sunCityHiltonHead',
			maxPages: 10,
			maxDepth: 2,
			requestDelayMs: 0,
			crawlPages: [{ url: 'https://example.com/start', depth: 0, isDetail: false, status: 'fetching' as const }],
			detailUrls: ['https://example.com/detail/ada'],
			extractedDetailUrls: [],
			counters: { fetchAttempts: 1, pagesFetched: 0, discoveryPagesFetched: 0, pagesFailed: 0, rateLimitResponses: 0, rateLimitedPages: 0 },
			phase: 'discovery' as const,
			updatedAt: '2026-11-06T14:32:10.000Z'
		};

		writeDomainDiscoveryCheckpoint(checkpoint, rootDirectory);

		expect(getDomainDiscoveryFilePath(extractFileName, rootDirectory)).toContain('2026-11-06-14-32-10-sunCityHiltonHead-discovery.json');
		expect(readDomainDiscoveryCheckpoint(extractFileName, rootDirectory)).toEqual(checkpoint);
		expect(fs.existsSync(`${getDomainDiscoveryFilePath(extractFileName, rootDirectory)}.tmp`)).toBe(false);
	});

	it('recovers extracted source URLs from the append-only extract', () => {
		const rootDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'domain-extract-'));
		const fileName = '2026-11-06-14-32-10-sunCityHiltonHead-extract.jsonl';
		initializePeopleExtractFile(fileName, rootDirectory);
		appendPeopleToExtractFile(fileName, [{ sourceUrl: ['https://example.com/detail/ada', 'https://example.com/detail/ada-alias'] }], rootDirectory);

		expect(readExtractedSourceUrls(fileName, rootDirectory)).toEqual(new Set(['https://example.com/detail/ada', 'https://example.com/detail/ada-alias']));
	});

	it('lists only discovery runs with matching extracts', () => {
		const rootDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'domain-extract-'));
		const extractFileName = '2026-11-06-14-32-10-sunCityHiltonHead-extract.jsonl';
		const checkpoint = {
			version: 1 as const,
			extractFileName,
			startUrl: 'https://example.com/start',
			siteName: 'sunCityHiltonHead',
			maxPages: 10,
			maxDepth: 2,
			requestDelayMs: 0,
			crawlPages: [],
			detailUrls: [],
			extractedDetailUrls: [],
			counters: { fetchAttempts: 0, pagesFetched: 0, discoveryPagesFetched: 0, pagesFailed: 0, rateLimitResponses: 0, rateLimitedPages: 0 },
			phase: 'discovery' as const,
			updatedAt: '2026-11-06T14:32:10.000Z'
		};
		initializePeopleExtractFile(extractFileName, rootDirectory);
		writeDomainDiscoveryCheckpoint(checkpoint, rootDirectory);

		expect(listDomainDiscoveryFiles(rootDirectory)).toEqual([{
			discoveryFileName: '2026-11-06-14-32-10-sunCityHiltonHead-discovery.json',
			extractFileName,
			siteName: 'sunCityHiltonHead',
			startUrl: 'https://example.com/start',
			phase: 'discovery',
			updatedAt: '2026-11-06T14:32:10.000Z'
		}]);
	});
});