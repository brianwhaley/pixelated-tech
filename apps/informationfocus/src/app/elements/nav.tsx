"use client";

import { MenuSimple } from '@pixelated-tech/components';
import siteConfig from '../data/siteconfig.json';
const allRoutes = siteConfig.routes;

export default function Nav() {
	return (
		<div>
			<MenuSimple menuItems={allRoutes} ref={(myMenu) => { window.myMenu = myMenu; }} />
		</div>
	);
}
