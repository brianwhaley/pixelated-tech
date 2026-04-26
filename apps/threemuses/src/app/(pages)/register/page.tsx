"use client";

import React from 'react';
import { PageTitleHeader, PageSectionHeader } from "@pixelated-tech/components";
import { PageSection, PageGridItem } from "@pixelated-tech/components";
import { FormEngine } from "@pixelated-tech/components";
import formData from "@/app/data/registerform.json";

export default function Register() {
    
	return (

		<>
			<PageTitleHeader title="Register for a Three Muses Event" />
			<PageSection columns={1} maxWidth="768px" id="social-section">
				<PageGridItem>
					<div>
						<p>
						
						</p>
					</div>
				</PageGridItem>
				<PageGridItem>
					<PageSectionHeader title="Contact Us" />
					<div style={{ margin: '0 auto', border: '2px solid var(--accent1-color)', padding: '20px', borderRadius: '20px' }}>
						<FormEngine formData={formData as any} />
					</div>
				</PageGridItem>
			</PageSection>

			<br />
		</>


	);
}
