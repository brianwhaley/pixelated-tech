import { describe, it, expect } from 'vitest';
import { extractPageDataFromSource } from '../components/sitebuilder/page/pageextractor';

describe('Page Extractor', () => {
	it('should extract page data from a default exported TSX component', () => {
		const source = `
		import React from 'react';
	
		export default function Page() {
			return (
				<div>
					<Hero title="Welcome" />
					<p>Intro text</p>
					<FeatureList items={items} />
				</div>
			);
		}
		`;

		const result = extractPageDataFromSource(source, 'test.tsx');
		expect(result.components).toHaveLength(3);
		expect(result.components[0].component).toBe('Hero');
		expect(result.components[0].props.title).toBe('Welcome');
		expect(result.components[1].component).toBe('PageHTML');
		expect(result.components[2].component).toBe('FeatureList');
		expect(result.components[2].props.items).toBe('{{items}}');
	});

	it('should handle JSX fragments and nested HTML', () => {
		const source = `
		import React from 'react';
	
		export default () => (
			<>
				<section>
					<h1>Title</h1>
					<CustomCard value={42} />
				</section>
				<Footer />
			</>
		);
		`;

		const result = extractPageDataFromSource(source, 'fragment.tsx');
		expect(result.components.some((item) => item.component === 'CustomCard')).toBe(true);
		expect(result.components.some((item) => item.component === 'Footer')).toBe(true);
	});

	it('should throw when there is no default export function', () => {
		const source = `
		import React from 'react';
	
		const Page = () => <div>Missing default export</div>;
		`;

		expect(() => extractPageDataFromSource(source, 'missing.tsx')).toThrow(/default export function/);
	});
});
