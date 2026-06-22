"use client";

import { PageSection, Callout } from '@pixelated-tech/components';

export default function UnderConstruction() {
	return (
		<PageSection id="underconstruction-section" columns={1} maxWidth="800px" style={{ backgroundColor: 'white' }}>
			<Callout
				variant="default"
				layout="vertical"
				img="/images/stock/construction-sign-white-background-3d-mesh-vector-illustration.jpg"
				title="Under Construction"
				subtitle="We're working hard to bring you something amazing. Check back soon!"
			/>
		</PageSection>
	);
}