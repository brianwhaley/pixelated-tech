/**
 * Component metadata for form generation
 * 
 * Imports const arrays from component files that are used in PropTypes.
 * This ensures single source of truth - arrays are defined once in the component,
 * used in PropTypes, generate TypeScript types via InferProps, and provide
 * runtime values for form generation.
 */

import { variants, shapes, layouts, directions } from "../../../structure/callout";
import { 
	layoutTypes, 
	autoFlowValues, 
	flexDirections, 
	flexWraps, 
	justifyContentValues, 
	alignItemsValues 
} from "../../../structure/page-blocks";

export type PropMetadata = {
	type: 'text' | 'number' | 'checkbox' | 'select' | 'object' | 'array' | 'function' | 'children';
	options?: readonly string[];
	required?: boolean;
	default?: any;
	description?: string;
};

export type ComponentMetadata = {
	[propName: string]: PropMetadata;
};

export const componentMetadata: {[componentName: string]: ComponentMetadata} = {
	'Callout': {
		variant: {
			type: 'select',
			options: variants,
			default: 'default',
		},
		boxShape: {
			type: 'select',
			options: shapes,
			default: 'squircle',
		},
		layout: {
			type: 'select',
			options: layouts,
			default: 'horizontal',
		},
		direction: {
			type: 'select',
			options: directions,
			default: 'left',
		},
		url: {
			type: 'text',
		},
		img: {
			type: 'text',
		},
		imgAlt: {
			type: 'text',
		},
		imgShape: {
			type: 'select',
			options: shapes,
			default: 'square',
		},
		title: {
			type: 'text',
		},
		subtitle: {
			type: 'text',
		},
		content: {
			type: 'text',
		},
		buttonText: {
			type: 'text',
		},
	},
	'PageSection': {
		layoutType: {
			type: 'select',
			options: layoutTypes,
			default: 'grid',
		},
		columns: {
			type: 'number',
		},
		gap: {
			type: 'text',
		},
		direction: {
			type: 'select',
			options: flexDirections,
		},
		wrap: {
			type: 'select',
			options: flexWraps,
		},
		justifyContent: {
			type: 'select',
			options: justifyContentValues,
		},
		alignItems: {
			type: 'select',
			options: alignItemsValues,
		},
		autoFlow: {
			type: 'select',
			options: autoFlowValues,
		},
		responsive: {
			type: 'checkbox',
		},
	},
	'PageGridItem': {
		columnSpan: {
			type: 'number',
		},
		rowSpan: {
			type: 'number',
		},
		columnStart: {
			type: 'number',
		},
		columnEnd: {
			type: 'number',
		},
		rowStart: {
			type: 'number',
		},
		rowEnd: {
			type: 'number',
		},
	},
	'PageFlexItem': {
		flex: {
			type: 'text',
		},
		order: {
			type: 'number',
		},
		alignSelf: {
			type: 'select',
			options: ['auto', 'flex-start', 'flex-end', 'center', 'baseline', 'stretch'],
		},
	},
	'PageTitleHeader': {
		title: {
			type: 'text',
			required: true,
		},
		subtitle: {
			type: 'text',
		},
	},
	'PageSectionHeader': {
		title: {
			type: 'text',
			required: true,
		},
		subtitle: {
			type: 'text',
		},
	},
};
