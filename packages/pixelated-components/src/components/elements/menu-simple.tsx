'use client';

import { usePathname } from 'next/navigation';
import React from 'react';
import PropTypes, { InferProps } from "prop-types";
import './menu-simple.css';



const menuItemShape = PropTypes.shape({
	name: PropTypes.string.isRequired,
	path: PropTypes.string,
	target: PropTypes.string,
	hidden: PropTypes.bool,
	routes: PropTypes.array,
});



/**
 * MenuSimple — renders a simple flat navigation menu from an array of items.
 *
 * @param {arrayOf} [props.menuItems] - Array of menu item objects ({ name, path, target, hidden, routes }).
 */
MenuSimple.propTypes = {
/** Array of menu items to render (flat list). */
	menuItems: PropTypes.arrayOf(menuItemShape).isRequired,
};
export type MenuSimpleType = InferProps<typeof MenuSimple.propTypes>;
export function MenuSimple(props: MenuSimpleType) {
	const pathname = usePathname();
	return (
		<div className="menu-wrapper">
			<div className="menu" id="menu">
				<ul>{props.menuItems?.map((item, index) => {
					if (!item) return null;
					// if (item.hidden) return null; // Skip nested routes
					if (item.routes) return null;
					const isSelected = typeof item.path === 'string'
						? pathname === item.path || pathname.startsWith(`${item.path}/`)
						: false;
					return (
						<MenuSimpleItem
							key={item.path ?? index}
							name={item.name}
							path={item.path || ''}
							target={item.target || undefined}
							hidden={item.hidden || undefined}
							isSelected={isSelected}
						/>
					);
				})}</ul>
			</div>
		</div>
	);
}



/* ========== MENU ITEM ========== */

/**
 * MenuSimpleItem — Single entry for the flat `MenuSimple` menu.
 *
 * @param {string} [props.name] - Display text for the item.
 * @param {string} [props.path] - Destination href or path for the item.
 * @param {string} [props.target] - Optional link target (e.g., '_self' or '_blank').
 * @param {boolean} [props.hidden] - When true, the item is treated as hidden (applies CSS to hide it).
 * @param {array} [props.routes] - Optional nested routes (not used by `MenuSimpleItem` but accepted for compatibility).
 */
MenuSimpleItem.propTypes = {
/** Display text for the item */
	name: PropTypes.string.isRequired,
	/** Destination href or path */
	path: PropTypes.string.isRequired,
	/** Optional link target */
	target: PropTypes.string,
	/** When true, the item is hidden */
	hidden: PropTypes.bool,
	/** When true, the item is selected */
	isSelected: PropTypes.bool,
	/** Optional nested routes (ignored by this renderer) */
	routes: PropTypes.array,
};
export type MenuSimpleItemType = InferProps<typeof MenuSimpleItem.propTypes>;
export function MenuSimpleItem(props: MenuSimpleItemType) {
	const listClassNames = ['menu-item'];
	if (props.hidden) {
		listClassNames.push('menu-item-hidden');
	}
	const anchorClassNames = props.isSelected ? 'selected' : undefined;
	return (
		<li className={listClassNames.join(' ')}>
			{props.target
				? <a href={props.path || undefined} target={props.target} className={anchorClassNames}>{props.name}</a>
				: <a href={props.path || undefined} className={anchorClassNames}>{props.name}</a>}
		</li>
	);
}
