"use client";

import React, { Fragment } from "react";
import { PageSection } from '@pixelated-tech/components';
import { PageTitleHeader } from "@pixelated-tech/components";
import Terms from "@/app/elements/terms";

export default function TermsPage() {
	return (
		<Fragment>
			<PageTitleHeader title="Terms and Conditions" />
			<PageSection columns={1} id="terms-section">
				<Terms />
			</PageSection>
		</Fragment>
	);
}
