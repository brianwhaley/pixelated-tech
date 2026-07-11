import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect } from 'vitest';
import { render, screen, waitFor, runCommonPageCoverage, runCommonElementCoverage, runPageSmokeTests } from '../../../../shared/test-utils/index.test-utils';
import React from 'react';
import { config as pixelatedConfig, setPixelatedConfigOverride } from '@/tests/page-mocks';
import { headers } from 'next/headers';

import Header from '@/app/elements/header';
import Nav from '@/app/elements/nav';
import Footer from '@/app/elements/footer';
import LayoutClient from '@/app/elements/layoutclient';
import NotFoundElement from '@/app/elements/notfound';
import RootLayout from '@/app/layout';
import Home from '@/app/(pages)/(home)/page';
import Resume from '@/app/(pages)/resume/page';
import StyleGuide from '@/app/(pages)/styleguide/page';
import { proxy } from '@/proxy';
import { GET as humansGET } from '@/app/humans.txt/route';
import { GET as securityGET } from '@/app/security.txt/route';

const cloudinaryProductEnv = 'test_env';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, '..', '..');

describe('Site coverage', () => {
	runCommonPageCoverage({
		appRoot,
		ignoredPageTypes: [
			'about',
			'blog',
			'blogcalendar',
			'contact',
			'faqs',
			'partners',
			'podcast',
			'projects',
			'services',
			'service-areas',
			'updates',
		],
		ignoredCommonRoutes: ['socialtags'],
	});

	runCommonElementCoverage({
		Header,
		Nav,
		Footer,
		LayoutClient,
		NotFoundElement,
		RootLayout,
		proxy,
		humansGET,
		securityGET,
		config: pixelatedConfig,
		setPixelatedConfigOverride,
		headersModule: { headers },
		cloudinaryProductEnv,
		render,
		screen,
		createElement: React.createElement,
	});

	runPageSmokeTests([
		{
			name: 'Home',
			Component: Home,
			assertion: async () => {
				await waitFor(() => expect(screen.getByTestId('page-section-header')).not.toBeNull());
				expect(screen.getAllByTestId('smart-image').length).toBeGreaterThan(0);
			},
		},
		{
			name: 'Resume',
			Component: Resume,
			assertion: async () => {
				await waitFor(() => expect(screen.queryAllByTestId(/page-section/).length).toBeGreaterThan(0));
				expect(screen.getByTestId('page-section')).toHaveClass('p-resume');
			},
		},
		{
			name: 'Style Guide',
			Component: StyleGuide,
			assertion: async () => {
				await waitFor(() => expect(document.getElementById('colors-section')).not.toBeNull());
			},
		},
	]);
});

