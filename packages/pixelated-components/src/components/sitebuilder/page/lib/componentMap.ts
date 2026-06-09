import * as StructureComponents from "../../../structure/index.structure";
import * as ElementsComponents from "../../../elements/index.elements";
import * as IntegrationsComponents from "../../../integrations/index.integrations";
import * as PixelatedComponents from "../../../pixelated/index.pixelated";
import * as ShoppingCartComponents from "../../../shoppingcart/index.shoppingcart";

/**
 * Check if a name looks like a component (starts with uppercase)
 */
const isComponent = (name: string) => /^[A-Z]/.test(name);

/**
 * Filter a namespace to only include component-like exports
 */
const getComponents = (namespace: any) => 
	Object.keys(namespace).filter(isComponent);

/**
 * Categorized component lists for UI grouping
 */
export const componentCategories = {
	'Structure': getComponents(StructureComponents),
	'Elements': getComponents(ElementsComponents),
	'Integrations': getComponents(IntegrationsComponents),
	'Pixelated': getComponents(PixelatedComponents),
	'Shopping Cart': getComponents(ShoppingCartComponents),
};

/**
 * Component registry and constants
 * 
 * This map is dynamically aggregated from the category barrels.
 */
export const componentMap: Record<string, any> = {
	...StructureComponents,
	...ElementsComponents,
	...IntegrationsComponents,
	...PixelatedComponents,
	...ShoppingCartComponents,
};

export const componentTypes = Object.keys(componentMap).toString();

/**
 * Check if a component is a layout component (can have children)
 * This is determined by checking if the component has 'children' in its propTypes.
 */
export function isLayoutComponent(componentName: string): boolean {
	const component = componentMap[componentName];
	return !!(component?.propTypes?.children);
}

/**
 * Get component type from the registry
 */
export function getComponentType(componentName: string) {
	return componentMap[componentName as keyof typeof componentMap];
}
