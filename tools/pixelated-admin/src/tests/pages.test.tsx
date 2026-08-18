import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import path from 'path';
import { pathToFileURL } from 'url';

// Ensure server module provides StyleGuideUI for page rendering
vi.mock('@pixelated-tech/components/server', () => ({
	StyleGuideUI: () => 'StyleGuide',
	getFullPixelatedConfig: () => ({ routes: [{ name: 'Home', path: '/' }] }),
}));

let currentSearchParams = new URLSearchParams('callbackUrl=/');
const mockSmartFetch = vi.fn(async (...args: any[]) => {
	const stringUrl = String(args[0]);
	if (stringUrl.includes('/api/sites')) {
		return { ok: true, json: async () => [] };
	}
	if (stringUrl.includes('/api/component-usage')) {
		return {
			ok: true,
			json: async () => ({
				components: ['component-a'],
				siteList: [{ name: 'site-a', localPath: '/site-a' }],
				usageMatrix: { 'component-a': { 'site-a': true } },
			}),
		};
	}
	if (stringUrl.includes('/api/contentful/validate')) {
		return { ok: true, json: async () => ({ success: true }) };
	}
	if (stringUrl.includes('/api/contentful/content-types')) {
		return { ok: true, json: async () => ({ success: true, data: [] }) };
	}
	return { ok: true, json: async () => ({}) };
});

vi.mock('next/navigation', () => ({
	useSearchParams: () => currentSearchParams,
	redirect: (path: string) => path,
}));

vi.mock('nodemailer', async (importOriginal) => {
	const actual = await importOriginal<typeof import('nodemailer')>();
	return {
		__esModule: true,
		...actual,
		createTransport: vi.fn(() => ({
			sendMail: vi.fn(async () => ({ messageId: 'sent' })),
		})),
	};
});

vi.mock('next-auth/react', () => ({
	signIn: vi.fn(async () => true),
}));

vi.mock('fs', async (importOriginal) => {
	const actual = await importOriginal<typeof import('fs')>();
	const mockFs = {
		__esModule: true,
		...actual,
		existsSync: vi.fn(() => false),
		readdirSync: vi.fn(() => []),
		readFileSync: vi.fn(() => '[]'),
		writeFileSync: vi.fn(() => undefined),
	};
	return {
		...mockFs,
		default: mockFs,
	};
});

vi.mock('@pixelated-tech/components', async () => {
	const React = await vi.importActual<typeof import('react')>('react');
	const make = (name: string) => ({ children }: any) => <div data-testid={name}>{children}</div>;
	return {
		__esModule: true,
		PageSection: make('PageSection'),
		Loading: () => <div>Loading</div>,
		SkeletonLoading: () => <div>SkeletonLoading</div>,
		ToggleLoading: () => null,
		Table: ({ children }: any) => <table>{children}</table>,
		smartFetch: (...args: any[]) => mockSmartFetch(...args),
		ConfigBuilder: ({ onSave }: any) => <button onClick={() => onSave({ routes: [{ path: '/test' }] })}>Save Config</button>,
		FormBuilder: make('FormBuilder'),
		FormEngine: ({ formData, onSubmitHandler }: any) => {
			React.useEffect(() => {
				const sitesField = formData.fields.find((field: any) => field.props.id === 'sites');
				const envField = formData.fields.find((field: any) => field.props.id === 'environments');
				const commitField = formData.fields.find((field: any) => field.props.id === 'commitMessage');
				if (sitesField?.props?.onChange) sitesField.props.onChange([sitesField.props.options?.[0]?.value ?? '']);
				if (envField?.props?.onChange) envField.props.onChange(['prod']);
				if (commitField?.props?.onChange) commitField.props.onChange('deploy message');
			}, []);
			return (
				<form onSubmit={(event) => { event.preventDefault(); onSubmitHandler?.(new FormData(event.currentTarget as HTMLFormElement)); }}>
					{formData.fields.map((field: any) => {
						const fieldElement = (() => {
							if (field.component === 'FormSelect') {
								return (
									<select
										key={field.props.id}
										id={field.props.id}
										name={field.props.name}
										value={field.props.value}
										onChange={(event) => field.props.onChange?.(event.target.value)}
									>
										{field.props.options?.map((option: any) => (
											<option key={option.value} value={option.value} disabled={option.disabled}>
												{option.text}
											</option>
										))}
									</select>
								);
							}
							if (field.component === 'FormTextarea') {
								return <textarea key={field.props.id} id={field.props.id} name={field.props.name} rows={field.props.rows} defaultValue={field.props.defaultValue || ''} />;
							}
							if (field.component === 'FormButton') {
								return <button key={field.props.id} type={field.props.type}>{field.props.text}</button>;
							}
							if (field.component === 'FormInput') {
								return <input key={field.props.id} {...field.props} />;
							}
							return null;
						})();
						return field.props.label ? <label key={field.props.id} htmlFor={field.props.id}>{field.props.label}{fieldElement}</label> : fieldElement;
					})}
				</form>
			);
		},
		PageBuilderUI: make('PageBuilderUI'),
		Accordion: ({ items }: any) => (
			<div>
				{items?.map((item: any, index: number) => (
					<div key={item.title ?? index}>{item.content}</div>
				))}
			</div>
		),
		StyleGuideUI: make('StyleGuideUI'),
		FourOhFour: ({ images }: any) => <div>404 {images?.length ?? 0}</div>,
		GlobalErrorUI: ({ error }: any) => <div>Error: {error?.message ?? 'unknown'}</div>,
		usePixelatedConfig: () => ({ routes: [{ name: 'Home', path: '/' }, { name: 'Login', path: '/login' }], siteInfo: {} }),
	};
});

const pageComponents = [
	['home', 'src/app/(pages)/(home)/page.tsx'],
	['login', 'src/app/(pages)/login/page.tsx'],
	['configbuilder', 'src/app/(pages)/configbuilder/page.tsx'],
	['contentful-migrate', 'src/app/(pages)/contentful-migrate/page.tsx'],
	['form-submits', 'src/app/(pages)/form-submits/page.tsx'],
	['formbuilder', 'src/app/(pages)/formbuilder/page.tsx'],
	['pagebuilder', 'src/app/(pages)/pagebuilder/page.tsx'],
	['component-usage', 'src/app/(pages)/component-usage/page.tsx'],
	['styleguide', 'src/app/(pages)/styleguide/page.tsx'],
	['mail-merge', 'src/app/(pages)/mail-merge/page.tsx'],
	['loading', 'src/app/loading.tsx'],
	['not-found', 'src/app/not-found.tsx'],
	['global-error', 'src/app/global-error.tsx'],
];

async function importModule(relPath: string) {
	return import(pathToFileURL(path.resolve(__dirname, '../../', relPath)).href);
}

describe('pixelated-admin page components', () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	for (const [name, relPath] of pageComponents) {
		it(`renders ${name} page without crashing`, async () => {
			const mod = await importModule(relPath);
			const Page = mod.default;
			expect(Page).toBeTypeOf('function');
			render(<Page />);

			if (name === 'component-usage') {
				await waitFor(() => expect(mockSmartFetch).toHaveBeenCalled());
			}
		});
	}

	it('shows an error when component usage fetch returns non-ok', async () => {
		mockSmartFetch.mockImplementation(async (url: unknown) => {
			if (String(url).includes('/api/component-usage')) {
				return { ok: false, json: async () => ({ message: 'bad request' }) };
			}
			return { ok: true, json: async () => ({}) };
		});

		const mod = await importModule('src/app/(pages)/component-usage/page.tsx');
		const Page = mod.default;
		render(<Page />);

		await waitFor(() => expect(screen.getAllByText(/Error:/i).length).toBeGreaterThan(0));
	});

	it('renders warnings when component usage data contains warnings', async () => {
		mockSmartFetch.mockImplementation(async (url: unknown) => {
			if (String(url).includes('/api/component-usage')) {
				return {
					ok: true,
					json: async () => ({
						components: ['component-a'],
						siteList: [{ name: 'site-a', localPath: '/site-a' }],
						usageMatrix: { 'component-a': { 'site-a': true } },
						warnings: ['warning-1'],
					}),
				};
			}
			return { ok: true, json: async () => ({}) };
		});

		const mod = await importModule('src/app/(pages)/component-usage/page.tsx');
		const Page = mod.default;
		render(<Page />);

		await waitFor(() => expect(screen.getByText(/Component scan warnings/i)).toBeTruthy());
		expect(screen.getByText('warning-1')).toBeTruthy();
	});

	it('uses an extended timeout when requesting component usage data', async () => {
		const mod = await importModule('src/app/(pages)/component-usage/page.tsx');
		const Page = mod.default;
		render(<Page />);

		await waitFor(() => expect(mockSmartFetch).toHaveBeenCalled());
		expect(mockSmartFetch.mock.calls[0][0]).toBe('/api/component-usage');
		expect(mockSmartFetch.mock.calls[0][1]).toMatchObject({ responseType: 'ok', timeout: 0 });
	});

	it('downloads pixelated.config.json from the config builder page', async () => {
		const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob://123' as any);
		const mod = await importModule('src/app/(pages)/configbuilder/page.tsx');
		const Page = mod.default;
		render(<Page />);
		fireEvent.click(screen.getByRole('button', { name: /Save Config/i }));
		await waitFor(() => expect(createObjectURLSpy).toHaveBeenCalled());
	});

	it('renders login page and normalizes callbackUrl for login redirects', async () => {
		currentSearchParams = new URLSearchParams('callbackUrl=/login');
		const mod = await importModule('src/app/(pages)/login/page.tsx');
		const Page = mod.default;
		render(<Page />);
		const signInButton = screen.getByRole('button', { name: /Sign in with Google/i });
		expect(signInButton).toBeTruthy();
	});

	it('validates and migrates content types in contentful migrate page', async () => {
		mockSmartFetch.mockImplementation(async (url: unknown) => {
			const stringUrl = String(url);
			if (stringUrl.includes('/api/contentful/validate')) {
				return { ok: true, json: async () => ({ success: true }) };
			}
			if (stringUrl.includes('/api/contentful/content-types')) {
				return { ok: true, json: async () => ({ success: true, data: [{ sys: { id: 'type-a', type: 'ContentType' }, name: 'Type A', fields: [] }] }) };
			}
			if (stringUrl.includes('/api/contentful/migrate')) {
				return { ok: true, json: async () => ({ success: true }) };
			}
			return { ok: true, json: async () => ({}) };
		});

		const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
		const mod = await importModule('src/app/(pages)/contentful-migrate/page.tsx');
		const Page = mod.default;
		render(<Page />);

		const sourceInput = screen.getByPlaceholderText('Source space ID');
		const sourceTokenInput = screen.getByPlaceholderText('Source management access token');
		const targetInput = screen.getByPlaceholderText('Target space ID');
		const targetTokenInput = screen.getByPlaceholderText('Target management access token');
		const validateButton = screen.getByRole('button', { name: /Validate & Load Content Types/i });

		fireEvent.change(sourceInput, { target: { value: 'space-a' } });
		fireEvent.change(sourceTokenInput, { target: { value: 'token-a' } });
		fireEvent.change(targetInput, { target: { value: 'space-b' } });
		fireEvent.change(targetTokenInput, { target: { value: 'token-b' } });

		fireEvent.click(validateButton);

		await waitFor(() => expect(screen.getByText(/Both spaces validated successfully!/i)).toBeTruthy());

		const checkbox = screen.getByLabelText(/Type A/i);
		fireEvent.click(checkbox);

		const migrateButton = screen.getByRole('button', { name: /Migrate 1 Content Type/i });
		fireEvent.click(migrateButton);

		await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('Migration completed successfully!'));
	});

	it('shows an error when contentful content types cannot be loaded', async () => {
		mockSmartFetch.mockImplementation(async (url: unknown) => {
			const stringUrl = String(url);
			if (stringUrl.includes('/api/contentful/validate')) {
				return { ok: true, json: async () => ({ success: true }) };
			}
			if (stringUrl.includes('/api/contentful/content-types')) {
				return { ok: true, json: async () => ({ success: false, error: 'load failed' }) };
			}
			return { ok: true, json: async () => ({}) };
		});

		const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
		const mod = await importModule('src/app/(pages)/contentful-migrate/page.tsx');
		const Page = mod.default;
		render(<Page />);

		const sourceInput = screen.getByPlaceholderText('Source space ID');
		const sourceTokenInput = screen.getByPlaceholderText('Source management access token');
		const targetInput = screen.getByPlaceholderText('Target space ID');
		const targetTokenInput = screen.getByPlaceholderText('Target management access token');
		const validateButton = screen.getByRole('button', { name: /Validate & Load Content Types/i });

		fireEvent.change(sourceInput, { target: { value: 'space-a' } });
		fireEvent.change(sourceTokenInput, { target: { value: 'token-a' } });
		fireEvent.change(targetInput, { target: { value: 'space-b' } });
		fireEvent.change(targetTokenInput, { target: { value: 'token-b' } });

		fireEvent.click(validateButton);

		await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('Error loading content types: load failed'));
	});

	it('shows a fallback when site-health site loading fails', async () => {
		mockSmartFetch.mockRejectedValueOnce(new Error('fail'));
		const mod = await importModule('src/app/(pages)/site-health/page.tsx');
		const Page = mod.default;
		render(<Page />);

		await waitFor(() => expect(screen.queryByText('Loading sites...')).toBeNull());
		expect(screen.getByLabelText(/Select Site/i)).toBeInTheDocument();
	});

	it('reports a validation error when required contentful fields are missing', async () => {
		const mod = await importModule('src/app/(pages)/contentful-migrate/page.tsx');
		const Page = mod.default;
		render(<Page />);

		const validateButton = screen.getByRole('button', { name: /Validate & Load Content Types/i });
		expect(validateButton).toBeDisabled();
	});

	it('loads site options and selects a site in site-health page', async () => {
		mockSmartFetch.mockImplementation(async (url: unknown) => {
			if (String(url).includes('/api/sites')) {
				return { ok: true, json: async () => ([{ name: 'site-a', url: 'https://site-a.example' }]) };
			}
			return { ok: true, json: async () => ({}) };
		});
		(window as any).axe = true;
		const mod = await importModule('src/app/(pages)/site-health/page.tsx');
		const Page = mod.default;
		render(<Page />);

		await waitFor(() => expect(screen.queryByText('Loading sites...')).toBeNull());
		const select = screen.getByLabelText(/Select Site/i);
		fireEvent.change(select, { target: { value: 'site-a' } });
		expect((select as HTMLSelectElement).value).toBe('site-a');
	});

	it('updates site-health date inputs after loading', async () => {
		const mod = await importModule('src/app/(pages)/site-health/page.tsx');
		const Page = mod.default;
		render(<Page />);

		await waitFor(() => expect(screen.queryByText('Loading sites...')).toBeNull());
		const startInput = screen.getByLabelText(/Start Date/i) as HTMLInputElement;
		const endInput = screen.getByLabelText(/End Date/i) as HTMLInputElement;

		fireEvent.change(startInput, { target: { value: '2026-01-01' } });
		fireEvent.change(endInput, { target: { value: '2026-02-01' } });

		expect(startInput.value).toBe('2026-01-01');
		expect(endInput.value).toBe('2026-02-01');
	});

	it('renders mail merge page when no mailer files exist', async () => {
		const fs = await import('fs');
		(fs.existsSync as any).mockReturnValue(false);

		const mod = await importModule('src/app/(pages)/mail-merge/page.tsx');
		const Page = mod.default;
		const element = await Page({ searchParams: Promise.resolve({}) });
		render(element);

		expect(screen.getByText(/Mail Merge/i)).toBeInTheDocument();
	});

	it('renders mail merge page with a selected file and categories', async () => {
		const fs = await import('fs');
		(fs.existsSync as any).mockImplementation((value: string) => String(value).includes('mailer'));
		(fs.readdirSync as any).mockReturnValue(['mailer.json']);
		(fs.readFileSync as any).mockReturnValue(JSON.stringify([{ category: 'test' }]));

		const mod = await importModule('src/app/(pages)/mail-merge/page.tsx');
		const Page = mod.default;
		const element = await Page({ searchParams: Promise.resolve({ mailerFile: 'mailer.json', category: 'test' }) });
		render(element);

		expect(screen.getByText(/Mail Merge/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Send/i })).toBeInTheDocument();
	});

	it('renders MailMergeClientForm with categories', async () => {
		const mod = await importModule('src/app/(pages)/mail-merge/MailMergeClientForm.tsx');
		const Form = mod.MailMergeClientForm;
		render(<Form selectedFile="mailer.json" selectedCategory="test" categories={[ 'test' ]} statuses={['Emailed', 'Not Emailed']} targetCounts={{ 'test||All': 1 }} sendMailAction={async () => {}} />);

		expect(screen.getByRole('button', { name: /Send/i })).toBeInTheDocument();
		expect(screen.getByRole('combobox', { name: /Category/i })).toBeInTheDocument();
		expect(screen.getByRole('combobox', { name: /Status/i })).toBeInTheDocument();
	});

	it('normalizes mail merge query params correctly', async () => {
		const mod = await importModule('src/app/(pages)/mail-merge/page.tsx');
		expect(mod.normalizeQueryParam(['file.json'])).toBe('file.json');
		expect(mod.normalizeQueryParam('file.json')).toBe('file.json');
		expect(mod.normalizeQueryParam(undefined)).toBe('');
	});

	it('sendMailAction redirects with validation error when fields are missing', async () => {
		const mod = await importModule('src/app/(pages)/mail-merge/page.tsx');
		const formData = new FormData();
		formData.append('mailerFile', '');
		formData.append('category', '');
		formData.append('from', '');
		formData.append('subject', '');
		formData.append('body', '');

		expect(await mod.sendMailAction(formData)).toContain('/mail-merge?status=error');
	});

	it('sendMailAction redirects when mailer file is missing', async () => {
		const fs = await import('fs');
		(fs.existsSync as any).mockReturnValue(false);

		const mod = await importModule('src/app/(pages)/mail-merge/page.tsx');
		const formData = new FormData();
		formData.append('mailerFile', 'mailer.json');
		formData.append('category', 'test');
		formData.append('from', 'sender@example.com');
		formData.append('subject', 'Hello');
		formData.append('body', 'Hello world');

		const result = await mod.sendMailAction(formData);
		expect(decodeURIComponent(result)).toContain('Mailer JSON file not found');
	});

	it('sendMailAction sends mail and redirects to success when data is valid', async () => {
		const fs = await import('fs');
		(fs.existsSync as any).mockImplementation((value: string) => String(value).includes('mailer'));
		(fs.readFileSync as any).mockReturnValue(JSON.stringify([{ category: 'test', contactEmail: 'recipient@example.com' }]));

		const mod = await importModule('src/app/(pages)/mail-merge/page.tsx');
		const formData = new FormData();
		formData.append('mailerFile', 'mailer.json');
		formData.append('category', 'test');
		formData.append('from', 'sender@example.com');
		formData.append('subject', 'Hello');
		formData.append('body', 'Hello [category]');

		expect(await mod.sendMailAction(formData)).toContain('status=sent');
	});

	it('normalizes mail merge query params using fallback for undefined array entries', async () => {
		const mod = await importModule('src/app/(pages)/mail-merge/page.tsx');
		expect(mod.normalizeQueryParam([undefined])).toBe('');
	});

	it('extracts categories from mailer json object containing venues', async () => {
		const fs = await import('fs');
		(fs.existsSync as any).mockReturnValue(true);
		(fs.readFileSync as any).mockReturnValue(JSON.stringify({ venues: [{ category: 'test' }, { category: 'other' }] }));

		const mod = await importModule('src/app/(pages)/mail-merge/page.tsx');
		const element = await mod.default({ searchParams: Promise.resolve({ mailerFile: 'mailer.json' }) });
		render(element);

		expect(screen.getByRole('combobox', { name: /Category/i })).toBeInTheDocument();
		expect(screen.getByRole('option', { name: 'test' })).toBeInTheDocument();
		expect(screen.getByRole('option', { name: 'other' })).toBeInTheDocument();
	});

	it('sendMailAction redirects with error when no entries match the selected category', async () => {
		const fs = await import('fs');
		(fs.existsSync as any).mockReturnValue(true);
		(fs.readFileSync as any).mockReturnValue(JSON.stringify([{ category: 'other', email: 'recipient@example.com' }]));

		const mod = await importModule('src/app/(pages)/mail-merge/page.tsx');
		const formData = new FormData();
		formData.append('mailerFile', 'mailer.json');
		formData.append('category', 'test');
		formData.append('from', 'sender@example.com');
		formData.append('subject', 'Hello');
		formData.append('body', 'Hello world');

		expect(decodeURIComponent(await mod.sendMailAction(formData))).toContain('No entries found for category');
	});

	it('sendMailAction counts failed entries when matching entries have no email', async () => {
		const fs = await import('fs');
		(fs.existsSync as any).mockReturnValue(true);
		(fs.readFileSync as any).mockReturnValue(JSON.stringify([{ category: 'test' }]));

		const mod = await importModule('src/app/(pages)/mail-merge/page.tsx');
		const formData = new FormData();
		formData.append('mailerFile', 'mailer.json');
		formData.append('category', 'test');
		formData.append('from', 'sender@example.com');
		formData.append('subject', 'Hello');
		formData.append('body', 'Hello world');

		const result = await mod.sendMailAction(formData);
		expect(result).toContain('status=sent');
		expect(result).toContain('sent=0');
		expect(result).toContain('failed=1');
	});

	it('renders mail merge success and error banners', async () => {
		const fs = await import('fs');
		(fs.existsSync as any).mockImplementation((value: string) => String(value).includes('mailer'));
		(fs.readdirSync as any).mockReturnValue(['mailer.json']);
		(fs.readFileSync as any).mockReturnValue(JSON.stringify([{ category: 'test' }]));

		const mod = await importModule('src/app/(pages)/mail-merge/page.tsx');
		const successElement = await mod.default({ searchParams: Promise.resolve({ mailerFile: 'mailer.json', category: 'test', status: 'sent', sent: '1', failed: '0' }) });
		render(successElement);
		expect(screen.getByText(/Mail merge complete\./i)).toBeInTheDocument();

		const errorElement = await mod.default({ searchParams: Promise.resolve({ mailerFile: 'mailer.json', category: 'test', status: 'error', message: 'Oops' }) });
		render(errorElement);
		expect(screen.getByText(/Error:/i)).toBeInTheDocument();
		expect(screen.getByText('Oops')).toBeInTheDocument();
	});

	it('renders no categories found message when selected file has no categories', async () => {
		const fs = await import('fs');
		(fs.existsSync as any).mockReturnValue(true);
		(fs.readdirSync as any).mockReturnValue(['mailer.json']);
		(fs.readFileSync as any).mockReturnValue(JSON.stringify([{ category: '' }]));

		const mod = await importModule('src/app/(pages)/mail-merge/page.tsx');
		const element = await mod.default({ searchParams: Promise.resolve({ mailerFile: 'mailer.json', category: '' }) });
		render(element);
		expect(screen.getByText(/No categories found for mailer.json/i)).toBeInTheDocument();
	});

});
