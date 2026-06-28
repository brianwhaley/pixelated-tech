import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '../test/test-utils';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentTree } from "../components/sitebuilder/page/components/ComponentTree";
import { mockComponentTreeData } from '../test/test-data';

describe('ComponentTree', () => {
	const mockOnSelectComponent = vi.fn();
	const mockOnEditComponent = vi.fn();
	const mockOnDeleteComponent = vi.fn();
	const mockOnMoveUp = vi.fn();
	const mockOnMoveDown = vi.fn();

	const mockComponents = mockComponentTreeData;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should render component tree with correct component names', () => {
		render(
			<ComponentTree
				components={mockComponents}
				onSelectComponent={mockOnSelectComponent}
				onEditComponent={mockOnEditComponent}
				onDeleteComponent={mockOnDeleteComponent}
				onMoveUp={mockOnMoveUp}
				onMoveDown={mockOnMoveDown}
			/>
		);

		expect(screen.getByText('PageSection')).toBeInTheDocument();
		expect(screen.getAllByText('Callout')).toHaveLength(2); // Parent and child
	});

	it('should show layout indicator for layout components', () => {
		render(
			<ComponentTree
				components={mockComponents}
				onSelectComponent={mockOnSelectComponent}
				onEditComponent={mockOnEditComponent}
				onDeleteComponent={mockOnDeleteComponent}
				onMoveUp={mockOnMoveUp}
				onMoveDown={mockOnMoveDown}
			/>
		);

		// PageSection should have layout indicator - check that the text contains the emoji
		const pageSectionContainer = screen.getByText('PageSection').parentElement;
		expect(pageSectionContainer?.textContent).toContain('📦');
	});

	it('should highlight selected component', () => {
		render(
			<ComponentTree
				components={mockComponents}
				onSelectComponent={mockOnSelectComponent}
				onEditComponent={mockOnEditComponent}
				onDeleteComponent={mockOnDeleteComponent}
				onMoveUp={mockOnMoveUp}
				onMoveDown={mockOnMoveDown}
				selectedPath="root[0]"
			/>
		);

		// First component should be selected (green background)
		const calloutElements = screen.getAllByText('Callout');
		const selectedElement = calloutElements[0].parentElement?.parentElement; // Get the styled div
		expect(selectedElement).toHaveStyle({ background: 'rgb(76, 175, 80)' }); // #4CAF50 in rgb
	});

	it('should highlight editing component', () => {
		render(
			<ComponentTree
				components={mockComponents}
				onSelectComponent={mockOnSelectComponent}
				onEditComponent={mockOnEditComponent}
				onDeleteComponent={mockOnDeleteComponent}
				onMoveUp={mockOnMoveUp}
				onMoveDown={mockOnMoveDown}
				editPath="root[1]"
			/>
		);

		// Second component should be in edit mode (orange background)
		const pageSectionElement = screen.getByText('PageSection').parentElement?.parentElement;
		expect(pageSectionElement).toHaveStyle({ background: 'rgb(255, 167, 38)' }); // #FFA726 in rgb
	});

	it('should call onEditComponent when edit button is clicked', async () => {
		const user = userEvent.setup();

		render(
			<ComponentTree
				components={mockComponents}
				onSelectComponent={mockOnSelectComponent}
				onEditComponent={mockOnEditComponent}
				onDeleteComponent={mockOnDeleteComponent}
				onMoveUp={mockOnMoveUp}
				onMoveDown={mockOnMoveDown}
			/>
		);

		const editButton = screen.getAllByTitle('Edit properties')[0];
		await user.click(editButton);

		expect(mockOnEditComponent).toHaveBeenCalledWith(mockComponents[0], 'root[0]');
	});

	it('should call onDeleteComponent when delete button is clicked', async () => {
		const user = userEvent.setup();

		render(
			<ComponentTree
				components={mockComponents}
				onSelectComponent={mockOnSelectComponent}
				onEditComponent={mockOnEditComponent}
				onDeleteComponent={mockOnDeleteComponent}
				onMoveUp={mockOnMoveUp}
				onMoveDown={mockOnMoveDown}
			/>
		);

		const deleteButton = screen.getAllByTitle('Delete component')[0];
		await user.click(deleteButton);

		expect(mockOnDeleteComponent).toHaveBeenCalledWith('root[0]');
	});

	it('should call onMoveUp when up button is clicked', async () => {
		const user = userEvent.setup();

		render(
			<ComponentTree
				components={mockComponents}
				onSelectComponent={mockOnSelectComponent}
				onEditComponent={mockOnEditComponent}
				onDeleteComponent={mockOnDeleteComponent}
				onMoveUp={mockOnMoveUp}
				onMoveDown={mockOnMoveDown}
			/>
		);

		const moveUpButton = screen.getAllByTitle('Move up')[0];
		await user.click(moveUpButton);

		expect(mockOnMoveUp).toHaveBeenCalledWith('root[0]');
	});

	it('should call onMoveDown when down button is clicked', async () => {
		const user = userEvent.setup();

		render(
			<ComponentTree
				components={mockComponents}
				onSelectComponent={mockOnSelectComponent}
				onEditComponent={mockOnEditComponent}
				onDeleteComponent={mockOnDeleteComponent}
				onMoveUp={mockOnMoveUp}
				onMoveDown={mockOnMoveDown}
			/>
		);

		const moveDownButton = screen.getAllByTitle('Move down')[0];
		await user.click(moveDownButton);

		expect(mockOnMoveDown).toHaveBeenCalledWith('root[0]');
	});

	it('should show child button for layout components', () => {
		render(
			<ComponentTree
				components={mockComponents}
				onSelectComponent={mockOnSelectComponent}
				onEditComponent={mockOnEditComponent}
				onDeleteComponent={mockOnDeleteComponent}
				onMoveUp={mockOnMoveUp}
				onMoveDown={mockOnMoveDown}
			/>
		);

		// Layout components should have child buttons
		const childButtons = screen.getAllByTitle('Add child component');
		expect(childButtons.length).toBeGreaterThan(0);
		expect(childButtons[0]).toBeInTheDocument();
	});

	it('should call onSelectComponent when child button is clicked', async () => {
		const user = userEvent.setup();

		render(
			<ComponentTree
				components={mockComponents}
				onSelectComponent={mockOnSelectComponent}
				onEditComponent={mockOnEditComponent}
				onDeleteComponent={mockOnDeleteComponent}
				onMoveUp={mockOnMoveUp}
				onMoveDown={mockOnMoveDown}
			/>
		);

		const childButtons = screen.getAllByTitle('Add child component');
		await user.click(childButtons[0]);

		expect(mockOnSelectComponent).toHaveBeenCalled();
	});

	it('should render nested children correctly', () => {
		render(
			<ComponentTree
				components={mockComponents}
				onSelectComponent={mockOnSelectComponent}
				onEditComponent={mockOnEditComponent}
				onDeleteComponent={mockOnDeleteComponent}
				onMoveUp={mockOnMoveUp}
				onMoveDown={mockOnMoveDown}
			/>
		);

		// Should show child component indented
		const calloutElements = screen.getAllByText('Callout');
		const childElement = calloutElements[1].parentElement?.parentElement?.parentElement; // Get the indented container
		expect(childElement).toHaveStyle({ marginLeft: '20px' });
	});
});