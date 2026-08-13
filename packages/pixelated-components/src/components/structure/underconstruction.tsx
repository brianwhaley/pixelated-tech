import React from 'react';
import { PageSection } from './page-blocks';
import { Callout } from './callout';

export function UnderConstruction() {
	return (
		<PageSection id="underconstruction-section"columns={1} maxWidth="800px">
			<Callout
				variant="default"
				layout="vertical"
				img="/images/under-construction.jpg"
				aboveFold={true}
				title="Under Construction"
				subtitle="We're working hard to bring you something amazing. Check back soon!"
			/>
		</PageSection>
	);
}
