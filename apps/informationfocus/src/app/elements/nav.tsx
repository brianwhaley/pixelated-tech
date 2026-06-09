"use client";

import { MenuSimple, usePixelatedConfig } from '@pixelated-tech/components';

export default function Nav() {
	const pixelatedConfig = usePixelatedConfig();
	const routes = pixelatedConfig?.routes ?? [];
	return (
		<div>
			<MenuSimple menuItems={routes} ref={(myMenu) => { window.myMenu = myMenu; }} />
		</div>
	);
}
