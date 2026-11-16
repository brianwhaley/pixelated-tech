'use client';

import { PageSection } from '@pixelated-tech/components';
import { PageBuilderUI } from '@pixelated-tech/components/adminclient';
import '../builder-pages.css';

export default function PageBuilderPage() {
	return (
		<PageSection id="pagebuilder-section" maxWidth="1024px" columns={1}>
			<div className="builder-page-header">
				<h1>Page Builder</h1>
			</div>
			<div className="builder-page-container">
				<PageBuilderUI />
			</div>
		</PageSection>
	);
}