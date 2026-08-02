const { RuleTester } = await import('eslint');
const mod = await import('../../../../shared/eslint-plugin/pixelated-eslint-plugin.js');
const rule = mod.default.rules['no-single-use-helpers'];

const tester = new RuleTester({
	languageOptions: {
		parserOptions: {
			ecmaVersion: 2024,
			sourceType: 'module',
			ecmaFeatures: {
				jsx: true,
			},
		},
	},
});

tester.run('no-single-use-helpers', rule, {
	valid: [
		{
			code: 'export function formatCurrency(value) { return `$${value.toFixed(2)}`; } function printReceipt(total) { console.log(formatCurrency(total)); } printReceipt(100); printReceipt(200);',
		},
		{
			code: 'function doWork(item) { return item * 2; } const result = [1,2,3].map(doWork);',
		},
		{
			code: 'function outer() { function helper(x) { return x + 1; } return helper(1) + helper(2); } outer(); outer();',
		},
		{
			code: 'const helper = (value) => value * 2; const result = [1,2].map(helper);',
		},
		{
			code: 'function handleClick() { console.log("clicked"); } const button = <button onClick={handleClick} />;',
		},
		{
			code: 'function updateSocialLink(index, value) { return value; } const element = <input onChange={(e) => updateSocialLink(index, e.target.value)} />;',
		},
		{
			code: 'function observerCallback(entries) { entries.forEach(e => {}); } const observer = new IntersectionObserver(observerCallback, { threshold: 0 });',
		},
		{
			code: 'function handleEvent(e) { console.log(e); } document.addEventListener("click", handleEvent);',
		},
		{
			code: 'function updateService(index, field, value) { return value; } const props = { onChange: (e) => updateService(0, "name", e) }; const element = <input {...props} />;',
		},
		{
			code: 'function updateRoute(index, field, value) { return value; } const route = { onChange: (e) => updateRoute(0, "path", e) }; const element = <input {...route} />;',
		},
		{
			code: 'export function useBuilder() { function handleSelectComponent() { return "ok"; } return { handleSelectComponent }; }',
		},
		{
			code: 'export function useBuilder() { function handleAddNewComponent() { return "ok"; } return handleAddNewComponent; }',
		},
		{
			code: 'export function useBuilder() { const handleDeleteComponent = () => {}; return [handleDeleteComponent]; }',
		},
	],
	invalid: [
		{
			code: 'function calculateTax(amount) { return amount * 0.07; } function processOrder(amount) { const tax = calculateTax(amount); return amount + tax; }',
			errors: [{ messageId: 'singleUseHelper' }, { messageId: 'singleUseHelper' }],
		},
		{
			code: 'const calculateTax = (amount) => amount * 0.07; function processOrder(amount) { const tax = calculateTax(amount); return amount + tax; }',
			errors: [{ messageId: 'singleUseHelper' }, { messageId: 'singleUseHelper' }],
		},
		{
			code: 'const calculateTax = function(amount) { return amount * 0.07; }; function processOrder(amount) { const tax = calculateTax(amount); return amount + tax; }',
			errors: [{ messageId: 'singleUseHelper' }, { messageId: 'singleUseHelper' }],
		},
		{
			code: 'function unusedHelper() { return 1; } const value = 2;',
			errors: [{ messageId: 'singleUseHelper' }],
		},
	],
});
