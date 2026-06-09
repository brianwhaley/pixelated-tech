import React from 'react';
import fs from 'fs/promises';
import path from 'path';
import { PageEngine, PageDataProvider } from '@pixelated-tech/components';
import { getFullPixelatedConfig } from '@pixelated-tech/components/server';
import faqsData from '@/app/data/faqs.json';

export default async function FAQPageNew() {
	const pixelatedConfig = getFullPixelatedConfig();
	// Read the extracted JSON directly from the filesystem to avoid client-side flash
	const filePath = path.join(process.cwd(), 'public/pagedata/faqs-page.json');
	const fileContent = await fs.readFile(filePath, 'utf8');
	const pageData = JSON.parse(fileContent);

	return (
		<PageDataProvider siteConfig={pixelatedConfig} data={{ faqsData }}>
			<PageEngine pageData={pageData} />
		</PageDataProvider>
	);
}
