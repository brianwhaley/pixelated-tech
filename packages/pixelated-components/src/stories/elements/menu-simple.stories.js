import { MenuSimple } from '@/components/elements/menu-simple';
import pixelatedConfig from '@/config/pixelated.config.json';
const allRoutes = pixelatedConfig.routes;
import '@/css/pixelated.global.css';

export default {
	title: 'General/Menu Simple',
	component: MenuSimple
};

export const Menu_Simple = {
	args: {
		menuItems: allRoutes
	}
};
