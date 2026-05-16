const { RuleTester } = await import('eslint');
const mod = await import('../scripts/pixelated-eslint-plugin.js');
const rule = mod.default.rules['require-contentful-image-webp'];

const tester = new RuleTester({
	languageOptions: {
		parserOptions: {
			ecmaVersion: 2020,
			sourceType: 'module',
			ecmaFeatures: { jsx: true },
		},
	},
});

tester.run('require-contentful-image-webp', rule, {
	valid: [
		{ code: 'export default function Page(){ return (<img src="https://images.ctfassets.net/abc123/image.jpg?fm=webp" />); }' },
		{ code: 'export default function Page(){ return (<Callout img="https://images.ctfassets.net/abc123/image.webp" />); }' },
		{ code: 'export default function Page(){ return (<Callout img="https://images.ctfassets.net/abc123/image.jpg?fm=webp" />); }' },
		{ code: 'const url = "https://images.ctfassets.net/"; export default function Page(){ return null; }' },
	],
	invalid: [
		{
			code: 'export default function Page(){ return (<img src="https://images.ctfassets.net/abc123/image.jpg" />); }',
			errors: [{ messageId: 'missingWebp' }],
		},
		{
			code: 'export default function Page(){ return (<Callout img="https://images.ctfassets.net/abc123/image.jpg" />); }',
			errors: [{ messageId: 'missingWebp' }],
		},
		{
			code: 'export default function Page(){ return (<Callout background="https://images.ctfassets.net/abc123/image.jpg" />); }',
			errors: [{ messageId: 'missingWebp' }],
		},
	],
});
