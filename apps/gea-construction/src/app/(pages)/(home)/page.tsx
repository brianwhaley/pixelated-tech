"use client"; 

import React from 'react';
import { PageSection, PageTitleHeader } from '@pixelated-tech/components';

export default function Home() {
	return (
		<>
			<PageSection columns={1} maxWidth="1024px" id="header-section">
				<PageTitleHeader title="Gea Construction" />
				<p>Welcome to Gea Construction</p>
			</PageSection>
		</>
	);
}
 