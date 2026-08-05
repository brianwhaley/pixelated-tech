import React from 'react';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';

vi.mock('@pixelated-tech/components/server', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@pixelated-tech/components/server')>();
	return {
		__esModule: true,
		...actual,
		listPixelatedFormSubmissionReportRows: vi.fn(async () => []),
	};
});

vi.mock('@pixelated-tech/components', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@pixelated-tech/components')>();
	return {
		__esModule: true,
		...actual,
		PageSection: (props: any) => <div>{props.children}</div>,
		PageSectionHeader: ({ title }: any) => <div>{title}</div>,
		PageTitleHeader: ({ title }: any) => <div>{title}</div>,
		Table: ({ data }: any) => <div data-testid="form-submits-table">{JSON.stringify(data)}</div>,
	};
});

const pagePath = path.resolve(__dirname, '../..', 'src/app/(pages)/form-submits/page.tsx');

async function importPage() {
	return (await import(pathToFileURL(pagePath).href)).default;
}

describe('Form Submits page coverage', () => {
	let listRowsMock: ReturnType<typeof vi.fn>;

	beforeEach(async () => {
		vi.resetAllMocks();
		const server = await import('@pixelated-tech/components/server');
		listRowsMock = vi.mocked(server.listPixelatedFormSubmissionReportRows);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('renders a report table when rows are available', async () => {
		const rows = [
			{
				domain: 'example.com',
				formName: 'contact',
				timestamp: '2026-08-01T12:00:00Z',
				data: { email: 'test@example.com' },
			},
		];

		listRowsMock.mockResolvedValueOnce(rows as any);

		const Page = await importPage();
		const element = await Page({});
		render(element);

		const table = await waitFor(() => screen.getByTestId('form-submits-table'));
		expect(within(table).getByText(/example.com/)).toBeTruthy();
	});

	it('renders the empty state when no rows are found', async () => {
		listRowsMock.mockResolvedValueOnce([] as any);

		const Page = await importPage();
		const element = await Page({});
		render(element);

		await waitFor(() => expect(screen.getByText(/No form submission rows were found/i)).toBeTruthy());
	});

	it('filters rows by domain and formName search params', async () => {
		const rows = [
			{
				domain: 'example.com',
				formName: 'contact',
				timestamp: '2026-08-01T12:00:00Z',
				data: { email: 'test@example.com' },
			},
			{
				domain: 'other.com',
				formName: 'feedback',
				timestamp: '2026-08-01T12:00:00Z',
				data: { email: 'other@other.com' },
			},
		];

		listRowsMock.mockResolvedValueOnce(rows as any);

		const Page = await importPage();
		const element = await Page({
			searchParams: Promise.resolve({ domain: 'example.com', formName: 'contact' }),
		});
		render(element);

		const table = await waitFor(() => screen.getByTestId('form-submits-table'));
		expect(screen.getByText('Form Submission Rows (1)')).toBeTruthy();
		expect(within(table).queryByText('other.com')).toBeNull();
	});

	it('accepts array search params for domain and formName', async () => {
		const rows = [
			{
				domain: 'example.com',
				formName: 'contact',
				timestamp: '2026-08-01T12:00:00Z',
				data: { email: 'test@example.com' },
			},
		];

		listRowsMock.mockResolvedValueOnce(rows as any);

		const Page = await importPage();
		const element = await Page({
			searchParams: Promise.resolve({ domain: ['example.com'], formName: ['contact'] }),
		});
		render(element);

		const table = await waitFor(() => screen.getByTestId('form-submits-table'));
		expect(screen.getByText('Form Submission Rows (1)')).toBeTruthy();
		expect(within(table).getByText(/example.com/)).toBeTruthy();
	});

	it('excludes rows when formName does not match search params', async () => {
		const rows = [
			{
				domain: 'example.com',
				formName: 'contact',
				timestamp: '2026-08-01T12:00:00Z',
				data: { email: 'test@example.com' },
			},
		];

		listRowsMock.mockResolvedValueOnce(rows as any);

		const Page = await importPage();
		const element = await Page({
			searchParams: Promise.resolve({ formName: 'feedback' }),
		});
		render(element);

		await waitFor(() => expect(screen.getByText(/No form submission rows were found/i)).toBeTruthy());
	});

	it('filters out rows without timestamp when date filters are used', async () => {
		const rows = [
			{
				domain: 'example.com',
				formName: 'contact',
				data: { email: 'test@example.com' },
			},
		];

		listRowsMock.mockResolvedValueOnce(rows as any);

		const Page = await importPage();
		const element = await Page({
			searchParams: Promise.resolve({ fromDate: '2026-08-01' }),
		});
		render(element);

		await waitFor(() => expect(screen.getByText(/No form submission rows were found/i)).toBeTruthy());
	});

	it('filters out rows when toDate is before the row timestamp', async () => {
		const rows = [
			{
				domain: 'example.com',
				formName: 'contact',
				timestamp: '2026-08-10T12:00:00Z',
				data: { email: 'test@example.com' },
			},
		];

		listRowsMock.mockResolvedValueOnce(rows as any);

		const Page = await importPage();
		const element = await Page({
			searchParams: Promise.resolve({ toDate: '2026-08-09' }),
		});
		render(element);

		await waitFor(() => expect(screen.getByText(/No form submission rows were found/i)).toBeTruthy());
	});

	it('filters rows by fromDate and toDate search params', async () => {
		const rows = [
			{
				domain: 'example.com',
				formName: 'contact',
				timestamp: '2026-08-10T12:00:00Z',
				data: { email: 'test@example.com' },
			},
		];

		listRowsMock.mockResolvedValueOnce(rows as any);

		const Page = await importPage();
		const element = await Page({
			searchParams: Promise.resolve({ fromDate: '2026-08-11', toDate: '2026-08-20' }),
		});
		render(element);

		await waitFor(() => expect(screen.getByText(/No form submission rows were found/i)).toBeTruthy());
	});
});
