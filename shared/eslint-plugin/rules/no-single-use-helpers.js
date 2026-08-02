/**
 * Disallow helper functions that are declared and used only once in the same file.
 *
 * False positives are intentionally exempted for patterns where a single-use function
 * is still semantically a reusable callback or event handler rather than a true helper.
 *
 * Exemptions include:
 *   - iterator callbacks used with Array.prototype methods like map/forEach/filter
 *   - JSX prop handlers passed to JSX attributes (onClick, onChange, render props, etc.)
 *   - callback API arguments for addEventListener, setTimeout, requestAnimationFrame,
 *     IntersectionObserver/ResizeObserver/MutationObserver/PerformanceObserver, and similar
 *   - functions returned from a hook or factory as part of the public interface
 *   - exported functions, which are treated as module/public API
 */
/**
 * Maximum function body size for a single-use helper to be reported.
 *
 * Single-use functions that are 20 lines or longer are exempt from this rule,
 * because long named helpers are usually easier to understand than deeply nested
 * inline logic.
 */
const LINE_COUNT_THRESHOLD = 10;

const ITERATOR_METHODS = new Set([
	'map',
	'forEach',
	'filter',
	'reduce',
	'some',
	'every',
	'find',
	'flatMap',
	'sort',
]);

const CALLBACK_METHOD_ARG_INDEXES = new Map([
	['setTimeout', [0]],
	['setInterval', [0]],
	['requestAnimationFrame', [0]],
	['requestIdleCallback', [0]],
	['addEventListener', [1]],
	['removeEventListener', [1]],
	['once', [1]],
	['on', [1]],
	['off', [1]],
	['subscribe', [0]],
	['then', [0]],
	['catch', [0]],
	['finally', [0]],
]);

const CALLBACK_CONSTRUCTORS = new Set([
	'IntersectionObserver',
	'ResizeObserver',
	'MutationObserver',
	'PerformanceObserver',
]);

function isIteratorCallbackReference(reference) {
	const identifier = reference.identifier;
	const parent = identifier.parent;
	if (!parent || parent.type !== 'CallExpression') return false;

	const argIndex = parent.arguments.indexOf(identifier);
	if (argIndex < 0) return false;

	const callee = parent.callee;
	if (callee.type !== 'MemberExpression' || callee.computed) return false;
	if (callee.property.type !== 'Identifier') return false;
	return ITERATOR_METHODS.has(callee.property.name);
}

function isJsxPropReference(reference) {
	let node = reference.identifier;
	while (node && node.parent) {
		const parent = node.parent;
		if (parent.type === 'JSXExpressionContainer') {
			const attribute = parent.parent;
			if (!attribute || attribute.type !== 'JSXAttribute') return false;
			return true;
		}
		if (parent.type === 'Property' && !parent.computed && parent.key) {
			const key = parent.key;
			const name = key.type === 'Identifier' ? key.name : key.type === 'Literal' && typeof key.value === 'string' ? key.value : '';
			if (/^on[A-Z]/.test(name)) {
				return true;
			}
		}
		node = parent;
	}

	return false;
}

function isCallbackArgumentReference(reference) {
	const identifier = reference.identifier;
	const parent = identifier.parent;
	if (!parent) return false;

	if (parent.type === 'CallExpression' || parent.type === 'NewExpression') {
		const args = parent.arguments || [];
		const argIndex = args.indexOf(identifier);
		if (argIndex < 0) return false;

		const callee = parent.callee;
		if (!callee) return false;

		let calleeName = '';
		if (callee.type === 'Identifier') {
			calleeName = callee.name;
		} else if (callee.type === 'MemberExpression' && !callee.computed && callee.property.type === 'Identifier') {
			calleeName = callee.property.name;
		}

		if (parent.type === 'NewExpression') {
			return CALLBACK_CONSTRUCTORS.has(calleeName) && argIndex === 0;
		}

		const callbackIndexes = CALLBACK_METHOD_ARG_INDEXES.get(calleeName);
		return Array.isArray(callbackIndexes) && callbackIndexes.includes(argIndex);
	}

	return false;
}

function isReturnedReference(reference) {
	let node = reference.identifier;
	let sawCallOrNew = false;

	while (node && node.parent) {
		const parent = node.parent;
		if (parent.type === 'ReturnStatement') {
			return !sawCallOrNew;
		}

		if ((parent.type === 'CallExpression' || parent.type === 'NewExpression') && parent.callee === node) {
			sawCallOrNew = true;
		}

		if (parent.type === 'FunctionExpression' || parent.type === 'ArrowFunctionExpression' || parent.type === 'FunctionDeclaration') {
			break;
		}

		node = parent;
	}

	return false;
}

function getExportedNames(programNode) {
	const names = new Set();
	for (const statement of programNode.body) {
		if (statement.type === 'ExportNamedDeclaration') {
			if (statement.declaration) {
				if (statement.declaration.type === 'FunctionDeclaration' && statement.declaration.id) {
					names.add(statement.declaration.id.name);
				} else if (statement.declaration.type === 'VariableDeclaration') {
					for (const decl of statement.declaration.declarations) {
						if (decl.id.type === 'Identifier') names.add(decl.id.name);
					}
				}
			}

			for (const specifier of statement.specifiers) {
				if (specifier.local && specifier.local.type === 'Identifier') {
					names.add(specifier.local.name);
				}
			}
		}

		if (statement.type === 'ExportDefaultDeclaration') {
			const decl = statement.declaration;
			if (decl.type === 'FunctionDeclaration' && decl.id) {
				names.add(decl.id.name);
			} else if (decl.type === 'Identifier') {
				names.add(decl.name);
			}
		}
	}
	return names;
}

function getDeclaredVariable(context, node) {
	if (!node.id || node.id.type !== 'Identifier') return null;
	if (typeof context.getDeclaredVariables === 'function') {
		const variables = context.getDeclaredVariables(node);
		const found = variables.find((variable) => variable.name === node.id.name);
		if (found) return found;
	}

	const sourceCode = context.sourceCode;
	let scope = sourceCode?.getScope ? sourceCode.getScope(node) : (context.getScope ? context.getScope() : null);
	while (scope) {
		const found = scope.variables.find((variable) => variable.name === node.id.name);
		if (found) return found;
		scope = scope.upper || null;
	}

	return null;
}

function getFunctionNodeFromVariable(variable) {
	const def = variable.defs && variable.defs[0];
	if (!def || !def.node) return null;

	if (def.node.type === 'FunctionDeclaration') {
		return def.node;
	}

	if (def.node.type === 'VariableDeclarator' && def.node.init) {
		const init = def.node.init;
		if (init.type === 'FunctionExpression' || init.type === 'ArrowFunctionExpression') {
			return init;
		}
	}

	return null;
}

function isLongFunction(variable) {
	const fn = getFunctionNodeFromVariable(variable);
	if (!fn || !fn.loc) return false;

	const lines = fn.loc.end.line - fn.loc.start.line + 1;
	return lines >= LINE_COUNT_THRESHOLD;
}

function shouldReportVariable(variable, exportedNames) {
	if (!variable || !variable.name) return false;
	if (exportedNames.has(variable.name)) return false;

	const readReferences = variable.references.filter(ref => ref.isRead());
	if (readReferences.length === 0) return true;
	if (readReferences.length > 1) return false;

	const reference = readReferences[0];
	return !isIteratorCallbackReference(reference)
		&& !isJsxPropReference(reference)
		&& !isCallbackArgumentReference(reference)
		&& !isReturnedReference(reference)
		&& !isLongFunction(variable);
}

export const noSingleUseHelpersRule = {
	meta: {
		type: 'problem',
		docs: {
			description: 'Disallow helper functions that are declared and used only once in the same file.',
			category: 'Best Practices',
			recommended: true,
		},
		fixable: false,
		messages: {
			singleUseHelper: 'Function "{{name}}" is only used once in this file. Move it inline or remove the declaration.',
		},
		schema: [],
	},
	create(context) {
		const exportedNames = new Set();

		return {
			Program(node) {
				for (const name of getExportedNames(node)) {
					exportedNames.add(name);
				}
			},

			FunctionDeclaration(node) {
				if (!node.id) return;
				if (node.parent && (node.parent.type === 'ExportNamedDeclaration' || node.parent.type === 'ExportDefaultDeclaration')) {
					return;
				}

				const variable = getDeclaredVariable(context, node);
				if (!variable || exportedNames.has(variable.name)) return;

				if (shouldReportVariable(variable, exportedNames)) {
					context.report({
						node: node.id,
						messageId: 'singleUseHelper',
						data: { name: variable.name },
					});
				}
			},

			VariableDeclarator(node) {
				if (!node.id || node.id.type !== 'Identifier' || !node.init) return;
				if (node.init.type !== 'FunctionExpression' && node.init.type !== 'ArrowFunctionExpression') return;

				const variable = getDeclaredVariable(context, node);
				if (!variable || exportedNames.has(variable.name)) return;

				if (shouldReportVariable(variable, exportedNames)) {
					context.report({
						node: node.id,
						messageId: 'singleUseHelper',
						data: { name: variable.name },
					});
				}
			},
		};
	},
};
