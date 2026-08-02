import { isClientComponent } from './eslint-rules-helpers.js';

export const propTypesInferPropsRule = {
	meta: {
		type: 'problem',
		docs: {
			description: 'Enforce PropTypes + InferProps pattern for React components',
			category: 'Best Practices',
			recommended: true,
		},
		fixable: false,
		schema: [],
		messages: {
			missingPropTypes: 'Component "{{componentName}}" is missing propTypes. Add: {{componentName}}.propTypes = { ... }; immediately above the function.',
			missingInferProps: 'Component "{{componentName}}" is missing InferProps type. Add: export type {{componentName}}Type = InferProps<typeof {{componentName}}.propTypes>; immediately above the function.',
			invalidInferProps: 'InferProps type for "{{componentName}}" must be named "{{componentName}}Type" and exported. Rename and add export.',
			missingInferPropsUsage: 'Component "{{componentName}}" function parameters must use the InferProps type. Change: export function {{componentName}}(props: {{componentName}}Type)',
			propTypesPlacement: 'Component "{{componentName}}" propTypes must be defined immediately above the function declaration with no blank lines. Move {{componentName}}.propTypes = { ... }; right above the function.',
			inferPropsPlacement: 'Component "{{componentName}}" InferProps type must be defined immediately above the function declaration with no blank lines. Move export type {{componentName}}Type = ...; right above the function.',
		},
	},
	create(context) {
		const components = new Map();

		function checkForInferProps(typeAnnotation) {
			if (!typeAnnotation) return false;
			if (typeAnnotation.type === 'TSTypeReference' && typeAnnotation.typeName?.name === 'InferProps') {
				return true;
			}
			if (typeAnnotation.type === 'TSIntersectionType') {
				return typeAnnotation.types.some(checkForInferProps);
			}
			return false;
		}

		function extractComponentNameFromInferProps(node) {
			return node.id.name.replace('Type', '');
		}

		function reportViolations(component) {
			const { functionNode, hasPropTypes, hasInferProps, usesInferProps, inferPropsName, propTypesNode, inferPropsNode } = component;
			if (!functionNode) return;

			const componentName = functionNode.id.name;

			if (!hasPropTypes) {
				context.report({ node: functionNode, messageId: 'missingPropTypes', data: { componentName } });
			}

			if (!hasInferProps) {
				context.report({ node: functionNode, messageId: 'missingInferProps', data: { componentName } });
			}

			if (hasPropTypes && hasInferProps && !usesInferProps && functionNode.params.length > 0) {
				context.report({ node: functionNode, messageId: 'missingInferPropsUsage', data: { componentName, inferPropsName } });
			}

			if (hasPropTypes && hasInferProps && propTypesNode && inferPropsNode) {
				const propTypesEndLine = propTypesNode.loc.end.line;
				const inferPropsLine = inferPropsNode.loc.start.line;
				const functionLine = functionNode.loc.start.line;

				if (inferPropsLine !== propTypesEndLine + 1) {
					context.report({ node: inferPropsNode, messageId: 'inferPropsPlacement', data: { componentName } });
				}

				if (functionLine !== inferPropsLine + 1) {
					context.report({ node: functionNode, messageId: 'propTypesPlacement', data: { componentName } });
				}
			}
		}

		return {
			FunctionDeclaration(node) {
				if (node.id && node.id.name && node.parent.type === 'ExportNamedDeclaration') {
					const componentName = node.id.name;
					const sourceCode = context.sourceCode || context.getSourceCode?.();
					const fileContent = sourceCode.text;
					if (componentName[0] === componentName[0].toUpperCase() && isClientComponent(fileContent)) {
						if (!components.has(componentName)) {
							components.set(componentName, {
								functionNode: node,
								hasPropTypes: false,
								hasInferProps: false,
								inferPropsName: `${componentName}Type`,
								usesInferProps: false,
								propTypesNode: null,
								inferPropsNode: null,
							});
						} else {
							components.get(componentName).functionNode = node;
						}
					}
				}
			},

			AssignmentExpression(node) {
				if (
					node.left.type === 'MemberExpression' &&
					node.left.object.type === 'Identifier' &&
					node.left.property.name === 'propTypes'
				) {
					const componentName = node.left.object.name;
					if (!components.has(componentName)) {
						components.set(componentName, {
							functionNode: null,
							hasPropTypes: false,
							hasInferProps: false,
							inferPropsName: `${componentName}Type`,
							usesInferProps: false,
							propTypesNode: null,
							inferPropsNode: null,
						});
					}
					const component = components.get(componentName);
					component.hasPropTypes = true;
					component.propTypesNode = node;
				}
			},

			TSTypeAliasDeclaration(node) {
				if (node.parent.type === 'ExportNamedDeclaration') {
					const componentName = extractComponentNameFromInferProps(node);
					if (componentName && components.has(componentName)) {
						const component = components.get(componentName);
						if (node.id.name === component.inferPropsName) {
							const hasInferProps = checkForInferProps(node.typeAnnotation);
							if (hasInferProps) {
								component.hasInferProps = true;
								component.inferPropsNode = node;
							}
						}
					}
				}
			},

			'FunctionDeclaration:exit'(node) {
				if (node.id && components.has(node.id.name)) {
					const component = components.get(node.id.name);
					if (node.params.length === 1) {
						const param = node.params[0];
						let paramTypeName = null;
						if (param.type === 'Identifier' && param.typeAnnotation?.typeAnnotation?.type === 'TSTypeReference') {
							paramTypeName = param.typeAnnotation.typeAnnotation.typeName?.name;
						} else if (param.type === 'ObjectPattern' && param.typeAnnotation?.typeAnnotation?.type === 'TSTypeReference') {
							paramTypeName = param.typeAnnotation.typeAnnotation.typeName?.name;
						}
						if (paramTypeName === component.inferPropsName) {
							component.usesInferProps = true;
						}
					}

					reportViolations(component);
				}
			},
		};
	},
};
