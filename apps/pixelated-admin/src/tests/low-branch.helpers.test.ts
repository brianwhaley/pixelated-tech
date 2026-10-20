import fs from 'fs';
import { describe, expect, it } from 'vitest';
import {
	extractEmailsFromResults,
	extractWebsiteFromResults,
	readCompaniesFromJson,
	readCompaniesFromTxt,
} from '../lib/extract-functions';
import { makeDefaultFileNameFromUrl, appendOrMergeResults } from '../lib/json-store';

describe('low branch helper coverage', () => {
	it('handles missing and varied company file shapes', () => {
		expect(readCompaniesFromTxt('/tmp/does-not-exist.txt')).toEqual([]);
		expect(readCompaniesFromJson('/tmp/does-not-exist.json')).toEqual([]);
		fs.writeFileSync('/tmp/invalid-company-json.json', '{invalid');
		fs.writeFileSync('/tmp/company-array.json', JSON.stringify([' Acme ', { company: 'Beta' }, { name: 'ignored' }]));
		fs.writeFileSync('/tmp/company-object.json', JSON.stringify({ results: [{ company: 'Gamma' }], companies: ['Delta'], nested: { company: 'Epsilon' }, label: 'Zeta' }));
		expect(readCompaniesFromJson('/tmp/invalid-company-json.json')).toEqual([]);
		expect(readCompaniesFromJson('/tmp/company-array.json')).toEqual(['Acme', 'Beta']);
		expect(readCompaniesFromJson('/tmp/company-object.json')).toEqual(['Gamma']);
	});

	it('extracts company names and nested fallback values', () => {
		fs.writeFileSync('/tmp/company-list.json', JSON.stringify({ nested: { company: 'Beta' }, values: ['Gamma', { company: 'Delta' }], label: 'Epsilon' }));
		expect(readCompaniesFromJson('/tmp/company-list.json')).toEqual(['Beta', 'Gamma', 'Delta', 'Epsilon']);
	});

	it('handles valid, invalid, redirect, and fallback URLs', () => {
		expect(makeDefaultFileNameFromUrl('https://example.com/path')).toContain('example.com-');
		expect(makeDefaultFileNameFromUrl('not a url')).toContain('scrape-');
		expect(extractWebsiteFromResults('')).toBeNull();
		expect(extractWebsiteFromResults('<a href="/url?q=https%3A%2F%2Facme.example%2Fpage%26x=1">x</a>')).toContain('https://acme.example/page');
		expect(extractWebsiteFromResults('<a href="https://direct.example">x</a>')).toBe('https://direct.example');
		expect(extractWebsiteFromResults('See https://fallback.example now')).toBe('https://fallback.example');
		expect(extractWebsiteFromResults('<a href="/url?q=%E0%A4%A">bad</a>')).toBeNull();
	});

	it('normalizes unique email results', () => {
		expect(extractEmailsFromResults('')).toEqual([]);
		expect(extractEmailsFromResults('A@EXAMPLE.COM a@example.com b@example.com')).toEqual(['a@example.com', 'b@example.com']);
	});

	it('creates and merges company records', () => {
		const fileName = `/tmp/admin-branch-coverage-${Date.now()}.json`;
		expect(appendOrMergeResults(fileName, [{ id: 'one', company: 'Acme', emails: [] }])).toMatchObject({ added: 1, updated: 0 });
		expect(appendOrMergeResults(fileName, [{ id: 'one', company: 'Acme', emails: ['a@acme.example'] }, { id: 'two', company: 'New Co' }])).toMatchObject({ added: 1, updated: 1 });
	});
});
