import { describe, expect, it } from 'vitest';
import { render, screen } from '../test/test-utils';
import { ListItems } from '../components/elements/listitems';

describe('ListItems', () => {
	it('renders titles, scalar properties, and array properties', () => {
		render(
			<ListItems
				items={[
					{
						title: 'A calendar entry',
						notes: ['First note', 'Second note'],
						status: 'published',
					},
				]}
			/>,
		);

		expect(screen.getByText('A calendar entry').tagName).toBe('H2');
		expect(screen.getByText('status: published')).toBeInTheDocument();
		expect(screen.getByText('notes:')).toBeInTheDocument();
		expect(screen.getByText('First note')).toBeInTheDocument();
		expect(screen.getByText('Second note')).toBeInTheDocument();
		expect(screen.queryByText('title: A calendar entry')).not.toBeInTheDocument();
	});

	it('renders duplicate titles as separate entries', () => {
		render(
			<ListItems
				items={[
					{ title: 'Repeated title', status: 'draft' },
					{ title: 'Repeated title', status: 'published' },
				]}
			/>,
		);

		expect(screen.getAllByText('Repeated title')).toHaveLength(2);
	});

	it('renders a single array value inline', () => {
		render(
			<ListItems items={[{ title: 'Single value', notes: ['Only note'] }]} />,
		);

		const notesItem = screen.getByText('notes: Only note');
		expect(notesItem.tagName).toBe('LI');
		expect(notesItem.querySelector('ul')).toBeNull();
	});
});
