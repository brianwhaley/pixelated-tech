import React from 'react';
import { PageSection } from '../../structure/page-blocks';

export function Unauthorized() {
	return (
		<PageSection id="unauthorized-section" maxWidth="1024px" columns={1}>
			<div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
				<h1>You do not have access</h1>
				<p>
                    You are signed in, but your account does not have permission to view this page.
                    If you believe you should have access, please contact the site administrator.
				</p>
			</div>
		</PageSection>
	);
}
