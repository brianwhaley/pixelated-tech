"use client";

import React from 'react';
import { PageSection, PageTitleHeader, PageSectionHeader, PageGridItem } from '@pixelated-tech/components';

export default function GalleryPage() {
	return (
		<>
			<PageSection columns={1} maxWidth="100%" id="gallery-section">
				<PageTitleHeader title="Gallery" />
			</PageSection>


			<PageSection columns={2} maxWidth="768px" id="dancewear-packages-section">
				<PageGridItem columnSpan={2}>
					<PageSectionHeader title="Photo Gallery (coming soon)" />
				</PageGridItem>
			</PageSection>


		</>
	);
}
