import { describe, it, expect, vi } from 'vitest';
import { render } from '../test/test-utils';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentPropertiesForm } from "../components/sitebuilder/page/components/ComponentPropertiesForm";
import { mockComponentWithTextField, mockComponentWithSubmitField } from '../test/fixtures';

describe('ComponentPropertiesForm', () => {
	it('should render placeholder text when no editableComponent is provided', () => {
		render(
			<ComponentPropertiesForm
				editableComponent={undefined}
				onSubmit={() => {}}
			/>
		);

		expect(screen.getByText('Select a component type above to configure its properties.')).toBeInTheDocument();
	});

	it('should render placeholder text when editableComponent has no fields', () => {
		render(
			<ComponentPropertiesForm
				editableComponent={{ component: 'TestComponent' }}
				onSubmit={() => {}}
			/>
		);

		expect(screen.getByText('Select a component type above to configure its properties.')).toBeInTheDocument();
	});

	it('should render FormEngine when editableComponent has fields', () => {
		render(
			<ComponentPropertiesForm
				editableComponent={mockComponentWithTextField}
				onSubmit={() => {}}
			/>
		);

		// FormEngine should be rendered (we can check for form elements)
		expect(screen.getByRole('form')).toBeInTheDocument();
	});

	it('should call onSubmit when form is submitted', async () => {
		const mockOnSubmit = vi.fn();
		render(
			<ComponentPropertiesForm
				editableComponent={mockComponentWithSubmitField}
				onSubmit={mockOnSubmit}
			/>
		);

		const user = userEvent.setup();

		// Find and click the submit button
		const submitButton = screen.getByRole('button', { name: /save/i });
		await user.click(submitButton);

		expect(mockOnSubmit).toHaveBeenCalled();
	});
});