import React from 'react';
import { PageSection } from './page-blocks';
import { Callout } from './callout';

export function UnderConstruction() {
	return (
		<PageSection id="underconstruction-section" columns={1} padding="20px" maxWidth="800px">
			<Callout
				variant="default"
				layout="vertical"
				img="https://www.pixelated.tech/images/stock/under-construction.jpg"
				aboveFold={true}
				title="Under Construction"
				subtitle="We're working hard to bring you something amazing. Check back soon!"
			/>
		</PageSection>
	);
}
