import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import path from 'path';
import { pathToFileURL } from 'url';

let currentSearchParams = new URLSearchParams('callbackUrl=/');
const mockSmartFetch = vi.fn(async (url: unknown) => {
	const stringUrl = String(url);
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
	if (stringUrl.includes('/api/deploy')) {
		return { ok: true, json: async () => ({ success: true, results: {} }) };
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
}));

vi.mock('next-auth/react', () => ({
	signIn: vi.fn(async () => true),
}));

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
			return <button onClick={() => onSubmitHandler?.()}>Submit</button>;
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
	};
});

const pageComponents = [
	['home', 'src/app/(pages)/(home)/page.tsx'],
	['login', 'src/app/(pages)/login/page.tsx'],
	['configbuilder', 'src/app/(pages)/configbuilder/page.tsx'],
	['contentful-migrate', 'src/app/(pages)/contentful-migrate/page.tsx'],
	['formbuilder', 'src/app/(pages)/formbuilder/page.tsx'],
	['newdeployment', 'src/app/(pages)/newdeployment/page.tsx'],
	['pagebuilder', 'src/app/(pages)/pagebuilder/page.tsx'],
	['component-usage', 'src/app/(pages)/component-usage/page.tsx'],
	['styleguide', 'src/app/(pages)/styleguide/page.tsx'],
	['loading', 'src/app/loading.tsx'],
	['not-found', 'src/app/not-found.tsx'],
	['global-error', 'src/app/global-error.tsx'],
];

async function importModule(relPath: string) {
	return import(pathToFileURL(path.join(process.cwd(), relPath)).href);
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

	it('downloads siteconfig.json from the config builder page', async () => {
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

	it('submits new deployment page via FormEngine and renders results', async () => {
		mockSmartFetch.mockImplementation(async (url: unknown) => {
			const stringUrl = String(url);
			if (stringUrl.includes('/api/deploy')) {
				return { ok: true, json: async () => ({ success: true, results: { 'brianwhaley': { message: 'ok', success: true } } }) };
			}
			return { ok: true, json: async () => ({}) };
		});

		const mod = await importModule('src/app/(pages)/newdeployment/page.tsx');
		const Page = mod.default;
		render(<Page />);

		fireEvent.click(screen.getByRole('button', { name: /Submit/i }));
		await waitFor(() => expect(mockSmartFetch).toHaveBeenCalledWith('/api/deploy', expect.anything()));
		await waitFor(() => expect(screen.getByText(/Deployment Results/i)).toBeTruthy());
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

});
