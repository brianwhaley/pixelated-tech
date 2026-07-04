import { MenuSimple } from '@/components/elements/menu-simple';
const allRoutes = [];
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
