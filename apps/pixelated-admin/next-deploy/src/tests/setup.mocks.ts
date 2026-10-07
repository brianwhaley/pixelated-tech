import React from 'react';

vi.mock('@pixelated-tech/components', async (importOriginal) => {
	const actual = await importOriginal();
	return {
		__esModule: true,
		...actual,
		PageSection: (props: any) => React.createElement('section', props),
		PageTitle: (props: any) => React.createElement('h1', props),
		Loading: () => React.createElement('div', null, 'Loading'),
		usePixelatedConfig: () => ({ siteInfo: { title: 'Test' }, routes: [] }),
	};
});

vi.mock('@pixelated-tech/components/adminserver', async (importOriginal) => {
	const actual = await importOriginal();
	class CacheManager {
		constructor() {}
		get() { return null; }
		set() { return null; }
	}
	return {
		__esModule: true,
		...actual,
		CacheManager,
	};
});

export {};
