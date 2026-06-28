"use client";

import React, { createContext, useContext, useMemo } from 'react';
import PropTypes, { InferProps } from 'prop-types';
import { useParams } from 'next/navigation';
import { generateKey } from '../../../foundation/utilities';
import { usePixelatedConfig } from '../../../config/config.client';
import { componentMap, isLayoutComponent } from '../lib/componentMap';
import './pagebuilder.scss';



/* ========== PAGE DATA PROVIDER ========== */

/**
 * PageDataContext holds the dynamic state for the page, including siteConfig, 
 * URL params, and any external data sources.
 */
const PageDataContext = createContext<any>(null);

export function usePageData() {
	return useContext(PageDataContext);
}




/**
 * PageDataProvider — Wraps the PageEngine to provide a unified data context.
 * 
 * @param {object} [props.data] - Additional static data to inject.
 * @param {object} [props.siteConfig] - The site-specific configuration (siteconfig.json).
 */
PageDataProvider.propTypes = {
	siteConfig: PropTypes.object,
	data: PropTypes.object,
	children: PropTypes.node.isRequired,
};
export type PageDataProviderType = InferProps<typeof PageDataProvider.propTypes>;
export function PageDataProvider(props: PageDataProviderType) {
	const { children, siteConfig, data = {} } = props;
	const params = useParams();
	const pixelatedConfig = usePixelatedConfig();

	// Merge all data sources into a single context
	const contextValue = useMemo(() => {
		const sc = siteConfig as any;
		return {
			siteInfo: sc?.siteInfo,
			business: sc?.siteInfo?.business,
			params: params || {},
			technical: pixelatedConfig,
			...data
		};
	}, [siteConfig, params, pixelatedConfig, data]);

	return (
		<PageDataContext.Provider value={contextValue}>
			{children}
		</PageDataContext.Provider>
	);
}



/**
 * PageEngine - Renders components with optional inline editing
 * When editMode is true, shows borders, hover effects, and action buttons
 * When editMode is false (default), renders clean components without edit UI
 */

/**
 * PageEngine — Render page components (and their children) with optional inline editing functionality.
 *
 * @param {shape} [props.pageData] - Page JSON containing a `components` array describing the page structure.
 * @param {boolean} [props.editMode] - When true, show editing UI (borders, buttons) around components.
 * @param {string} [props.selectedPath] - Path string identifying the currently selected component.
 * @param {function} [props.onEditComponent] - Callback invoked to begin editing a component's properties.
 * @param {function} [props.onSelectComponent] - Callback to select a component for adding children.
 * @param {function} [props.onDeleteComponent] - Callback to delete a component at a given path.
 * @param {function} [props.onMoveUp] - Callback to move a component up within its siblings.
 * @param {function} [props.onMoveDown] - Callback to move a component down within its siblings.
 */
PageEngine.propTypes = {
/** Page JSON with components array */
	pageData: PropTypes.shape({
		components: PropTypes.arrayOf(
			PropTypes.shape({
				component: PropTypes.string.isRequired,
				props: PropTypes.object.isRequired,
				children: PropTypes.array,
			})
		).isRequired,
	}).isRequired,
	/** Show inline edit UI when true */
	editMode: PropTypes.bool,
	/** Currently selected component path */
	selectedPath: PropTypes.string,
	/** Begin editing component properties */
	onEditComponent: PropTypes.func,
	/** Select a component for child insertion */
	onSelectComponent: PropTypes.func,
	/** Delete a component */
	onDeleteComponent: PropTypes.func,
	/** Move component up */
	onMoveUp: PropTypes.func,
	/** Move component down */
	onMoveDown: PropTypes.func,
};
export type PageEngineType = InferProps<typeof PageEngine.propTypes>;
export function PageEngine(props: PageEngineType) {
	const { editMode = false, selectedPath, onEditComponent, onSelectComponent, onDeleteComponent, onMoveUp, onMoveDown } = props;
	const contextData = usePageData();

	// Helper to resolve {{token}} strings in props
	const resolveValue = (value: any): any => {
		if (typeof value !== 'string') return value;
		
		// 1. If the value is EXACTLY a unique token like "{{some.path}}", 
		// we return the raw object/value instead of stringifying it.
		// This is critical for array/object props like faqsData.
		const fullTokenMatch = value.match(/^\{\{([\w.]+)\}\}$/);
		if (fullTokenMatch) {
			const path = fullTokenMatch[1];
			const parts = path.split('.');
			let current = contextData;
			for (const part of parts) {
				if (current && typeof current === 'object') {
					current = current[part];
				} else {
					return undefined;
				}
			}
			return current;
		}

		// 2. Otherwise, perform string replacement for mixed content
		const tokenRegex = /\{\{([\w.]+)\}\}/g;
		if (!tokenRegex.test(value)) return value;

		return value.replace(tokenRegex, (_, path) => {
			const parts = path.split('.');
			let current = contextData;
			for (const part of parts) {
				if (current && typeof current === 'object') {
					current = current[part];
				} else {
					return `[undefined: ${path}]`;
				}
			}
			// If we're inside a string, stringify objects or return the primitive
			return current !== undefined 
				? (typeof current === 'object' ? JSON.stringify(current) : current) 
				: `[undefined: ${path}]`;
		});
	};

	// Recursive function to render components with children
	function renderComponent(componentData: any, index: number, path: string = 'root'): React.JSX.Element {
		const componentName: string = componentData.component;
		
		// Create a shallow copy of props and resolve tokens
		const rawProps = componentData.props || {};
		const componentProps: any = {};
		
		Object.keys(rawProps).forEach(key => {
			if (key !== 'type') {
				componentProps[key] = resolveValue(rawProps[key]);
			}
		});
		
		const componentType = (componentMap as Record<string, React.ElementType>)[componentName];
		const currentPath = `${path}[${index}]`;
		const isLayout = isLayoutComponent(componentName);
		
		if (!componentType) {
			// If the component type is missing, still render its children so nested
			// components are visible in the page preview/tests. Also show a clear
			// unknown-component message for debugging.
			return (
				<div key={index}>
					<div>Unknown component: {componentName}</div>
					{componentData.children && componentData.children.length > 0 && (
						<div>
							{componentData.children.map((child: any, childIndex: number) => renderComponent(child, childIndex, `${currentPath}.children`))}
						</div>
					)}
				</div>
			);
		}
		
		// If component has children, recursively render them
		let children = null;
		if (componentData.children && componentData.children.length > 0) {
			children = componentData.children.map((child: any, childIndex: number) => 
				renderComponent(child, childIndex, `${currentPath}.children`)
			);
		}
		
		componentProps.key = generateKey();
		
		const element = children 
			? React.createElement(componentType, componentProps, children)
			: React.createElement(componentType, componentProps);
		
		// If not in edit mode, return element directly without wrapper
		if (!editMode) {
			return element; // Removed React.Fragment wrapper as we have unique keys on the elements now
		}
		
		// Edit mode: Wrap with hover effect and action buttons
		const isSelected = selectedPath === currentPath;
		
		const handleMouseEnter = (currentTarget: HTMLDivElement, event: React.SyntheticEvent<HTMLDivElement>) => {
			if (event.target === event.currentTarget || !currentTarget.querySelector('.pagebuilder-component-wrapper:hover')) {
				document.querySelectorAll('.pagebuilder-component-wrapper.hover-active').forEach(el => {
					el.classList.remove('hover-active');
				});
				currentTarget.classList.add('hover-active');
			}
			event.stopPropagation();
		};

		const handleMouseLeave = (currentTarget: HTMLDivElement, event: React.SyntheticEvent<HTMLDivElement>) => {
			const relatedTarget = ((event as React.MouseEvent<HTMLDivElement>).relatedTarget || (event as React.FocusEvent<HTMLDivElement>).relatedTarget) as HTMLElement | null;
			if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
				currentTarget.classList.remove('hover-active');
			}
		};
		
		return (
			<div 
				key={`wrapper-${index}`} 
				className={`pagebuilder-component-wrapper ${isSelected ? 'selected' : ''}`}
				onMouseOver={(e) => {
					handleMouseEnter(e.currentTarget, e);
				}}
				onMouseOut={(e) => {
					handleMouseLeave(e.currentTarget, e as React.MouseEvent<HTMLDivElement>);
				}}
				onFocus={(e) => {
					handleMouseEnter(e.currentTarget, e);
				}}
				onBlur={(e) => {
					handleMouseLeave(e.currentTarget, e as React.FocusEvent<HTMLDivElement>);
				}}
			>
				{element}
				{/* Floating Action Menu */}
				<div className="pagebuilder-actions">
					<div className="move-buttons">
						<button
							className="move-btn move-up"
							onClick={(e) => {
								e.stopPropagation();
								onMoveUp?.(currentPath);
							}}
							title="Move up"
						>
							▲
						</button>
						<button
							className="move-btn move-down"
							onClick={(e) => {
								e.stopPropagation();
								onMoveDown?.(currentPath);
							}}
							title="Move down"
						>
							<span role="img" aria-label="move down">▼</span>
						</button>
					</div>
					<button
						className="edit-btn"
						onClick={(e) => {
							e.stopPropagation();
							onEditComponent?.(componentData, currentPath);
						}}
						title="Edit properties"
					>
						<span role="img" aria-label="edit">✏️</span>
					</button>
					{isLayout && (
						<button
							className="child-btn"
							onClick={(e) => {
								e.stopPropagation();
								onSelectComponent?.(componentData, currentPath);
							}}
							title="Add child component"
						>
							<span role="img" aria-label="add">➕</span>
						</button>
					)}
					<button
						className="delete-btn"
						onClick={(e) => {
							e.stopPropagation();
							onDeleteComponent?.(currentPath);
						}}
						title="Delete component"
					>
						<span role="img" aria-label="delete">🗑️</span>
					</button>
				</div>
			</div>
		);
	}

	const components: React.JSX.Element[] = [];
	const pageComponents = props?.pageData?.components;
	
	if (pageComponents) {
		pageComponents.forEach((component, index) => {
			components.push(renderComponent(component, index));
		});
	}
	
	return <>{components}</>;
}
