import React from 'react';
import { MenuExpando } from '@/components/general/menu-expando';
import '@/css/pixelated.global.css';
import siteConfig from '@/data/siteconfig.json';
const allRoutes = siteConfig.routes;

export default {
	title: 'General/Menu Expando',
	component: MenuExpando
};

const MenuExpandoStory = () => {
	return (
		<div style={{ position: 'relative', height: '500px', border: '1px solid #ccc', padding: '20px' }}>
			<MenuExpando menuItems={allRoutes} />
		</div>
	);
};

export const Menu_Expando = MenuExpandoStory;
