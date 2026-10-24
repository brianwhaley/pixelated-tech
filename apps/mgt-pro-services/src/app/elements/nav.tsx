"use client";

import React from "react";
import { PageSection, usePixelatedConfig } from "@pixelated-tech/components";
import { MenuSimple } from "@pixelated-tech/components";

export default function Nav() {
	const config = usePixelatedConfig();
	const routes = config?.routes || [];

	return (
		<>
			<PageSection columns={1} maxWidth="100%" id="navigation-section" >
				<MenuSimple menuItems={routes} />
			</PageSection>
		</>
	);
}
