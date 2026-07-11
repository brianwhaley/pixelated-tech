
import ts from 'typescript';

export interface ComponentData {
	component: string;
	props: Record<string, any>;
	children?: ComponentData[];
	path?: string;
}

export interface PageData {
	components: ComponentData[];
}

/**
 * Normalizes text content by collapsing extra whitespace and newlines
 */
function normalizeText(text: string): string {
	return text.replace(/\s+/g, ' ').trim();
}

/**
 * Extracts PageBuilder JSON from a TSX source string
 */
export function extractPageDataFromSource(sourceCode: string, filePath: string = 'filename.tsx'): PageData {
	const sourceFile = ts.createSourceFile(
		filePath,
		sourceCode,
		ts.ScriptTarget.Latest,
		true,
		ts.ScriptKind.TSX
	);

	// Find the default export function
	const findDefaultExport = (node: ts.Node): ts.Node | undefined => {
		if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node)) {
			const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
			const isDefault = modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) &&
							 modifiers?.some(m => m.kind === ts.SyntaxKind.DefaultKeyword);
			
			if (isDefault) return node;
		} else if (ts.isExportAssignment(node)) {
			return node.expression;
		}
		return ts.forEachChild(node, findDefaultExport);
	};

	const defaultExport = findDefaultExport(sourceFile);
	if (!defaultExport) {
		throw new Error('Could not find a default export function.');
	}

	// Find the return statement in the default export
	const findReturnStatement = (node: ts.Node): ts.ReturnStatement | ts.Expression | undefined => {
		if (ts.isReturnStatement(node)) return node;
		if (ts.isArrowFunction(node) && node.body && !ts.isBlock(node.body)) return node.body;
		return ts.forEachChild(node, findReturnStatement);
	};

	const returnStatement = findReturnStatement(defaultExport);
	if (!returnStatement) {
		throw new Error('Could not find a return statement in the default export.');
	}

	const returnExpression = ts.isReturnStatement(returnStatement)
		? returnStatement.expression
		: returnStatement;

	if (!returnExpression) {
		throw new Error('Could not find a return statement in the default export.');
	}

	// Helper to group consecutive PageHTML components
	const coalesceChildren = (nodes: ts.Node[]): ComponentData[] => {
		const results: ComponentData[] = [];
		let currentHtmlBuffer: string[] = [];

		const flushHtml = () => {
			if (currentHtmlBuffer.length > 0) {
				results.push({
					component: 'PageHTML',
					props: { html: currentHtmlBuffer.join('\n') }
				});
				currentHtmlBuffer = [];
			}
		};

		nodes.forEach(node => {
			const processed = processNode(node);
			if (!processed) return;

			const flat = Array.isArray(processed) ? processed : [processed];
			
			flat.forEach(item => {
				if (item.component === 'PageHTML') {
					currentHtmlBuffer.push(item.props.html);
				} else {
					flushHtml();
					results.push(item);
				}
			});
		});

		flushHtml();
		return results;
	};

	// Process the JSX tree
	const processNode = (node: ts.Node): ComponentData | ComponentData[] | null => {
		if (!node) return null;

		if (ts.isParenthesizedExpression(node)) {
			return processNode(node.expression);
		}

		if (ts.isJsxElement(node)) {
			const name = node.openingElement.tagName.getText();
			
			// Layout tags: Flatten and coalesce
			if (['div', 'section', 'header', 'footer', 'main', 'article', 'aside'].includes(name.toLowerCase())) {
				return coalesceChildren([...node.children]);
			}

			// Content tags: Treat as raw HTML
			if (/^[a-z]/.test(name)) {
				return {
					component: 'PageHTML',
					props: { html: node.getText() }
				};
			}

			return processJsxElement(node);
		} else if (ts.isJsxSelfClosingElement(node)) {
			const name = node.tagName.getText();
			if (/^[a-z]/.test(name)) {
				return {
					component: 'PageHTML',
					props: { html: node.getText() }
				};
			}
			return processJsxSelfClosingElement(node);
		} else if (ts.isJsxFragment(node)) {
			return coalesceChildren([...node.children]);
		} else if (ts.isJsxText(node)) {
			const text = normalizeText(node.getText());
			if (text) {
				return {
					component: 'PageHTML',
					props: { html: text }
				};
			}
		} else if (ts.isJsxExpression(node)) {
			return {
				component: 'PageHTML',
				props: { html: `{{${node.expression?.getText() || 'unsupported'}}}` }
			};
		}
		return null;
	};

	const processJsxElement = (node: ts.JsxElement): ComponentData => {
		const name = node.openingElement.tagName.getText();
		const props = extractProps(node.openingElement.attributes);
		const children = coalesceChildren([...node.children]);

		return {
			component: name,
			props,
			...(children.length > 0 ? { children } : {})
		};
	};

	const processJsxSelfClosingElement = (node: ts.JsxSelfClosingElement): ComponentData => {
		const name = node.tagName.getText();
		const props = extractProps(node.attributes);

		return {
			component: name,
			props
		};
	};

	const extractProps = (attributes: ts.JsxAttributes): Record<string, any> => {
		const props: Record<string, any> = {};
		attributes.properties.forEach(attr => {
			if (ts.isJsxAttribute(attr)) {
				const name = attr.name.getText();
				let value: any = true;
				
				if (attr.initializer) {
					if (ts.isStringLiteral(attr.initializer)) {
						value = attr.initializer.text;
					} else if (ts.isJsxExpression(attr.initializer)) {
						const expr = attr.initializer.expression;
						if (expr) {
							if (ts.isNumericLiteral(expr)) {
								value = Number(expr.text);
							} else if (expr.kind === ts.SyntaxKind.TrueKeyword) {
								value = true;
							} else if (expr.kind === ts.SyntaxKind.FalseKeyword) {
								value = false;
							} else {
								// Slug/Dynamic management
								value = `{{${expr.getText()}}}`;
							}
						}
					}
				}
				props[name] = value;
			}
		});
		return props;
	};

	const result = processNode(returnExpression);
	return {
		components: Array.isArray(result) ? result : (result ? [result] : [])
	};
}
