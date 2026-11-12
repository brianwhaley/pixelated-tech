import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, expectRenderSuccess, renderWithConfig as render, screen } from '../test/test-utils';
import { pixelatedConfig } from '../test/test-data';
import {
	TimesheetEmailForm,
	TimesheetEntryForm,
	TimesheetPasscodeForm,
	TimesheetWeekSelector,
} from '../components/admin/timesheet/timesheet.components';

vi.mock('../components/sitebuilder/form/formengine', () => ({
	FormEngine: ({ formData, method, onSubmitHandler }: {
		formData: { fields: Array<{ props: { name?: string; value?: string; defaultValue?: string } }> };
		method: string;
		onSubmitHandler: (event: React.FormEvent<HTMLFormElement>) => void;
	}) => (
		<form data-testid="form-engine" method={method} onSubmit={onSubmitHandler}>
			{formData.fields.map((field, index) => (
				<input
					key={`${field.props.name || 'field'}-${index}`}
					name={field.props.name}
					value={field.props.value}
					defaultValue={field.props.defaultValue}
					readOnly
				/>
			))}
		</form>
	),
}));

describe('timesheet form components', () => {
	beforeEach(() => {
		vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => undefined);
	});

	it('renders the email and passcode forms', () => {
		const { container } = render(<TimesheetEmailForm />, pixelatedConfig);
		expectRenderSuccess(container);
		expect(screen.getByTestId('form-engine')).toHaveAttribute('method', 'post');

		render(<TimesheetPasscodeForm email="worker@example.com" />, pixelatedConfig);
		expect(screen.getByDisplayValue('worker@example.com')).toBeInTheDocument();
	});

	it('renders new-timesheet values and the admin week selector', () => {
		const { rerender } = render(
			<TimesheetEntryForm
				weekOf="2026-11-08"
				values={{ sun: '8', mon: '7.5' }}
			/>,
			pixelatedConfig,
		);
		expect(screen.getByDisplayValue('2026-11-08')).toBeInTheDocument();
		expect(screen.getByDisplayValue('8')).toBeInTheDocument();
		expect(screen.getByDisplayValue('7.5')).toBeInTheDocument();

		rerender(<TimesheetWeekSelector weekOf="2026-11-08" />);
		expect(screen.getByDisplayValue('2026-11-08')).toBeInTheDocument();
	});

	it('submits forms through their feature routes', () => {
		render(<TimesheetEmailForm />, pixelatedConfig);
		fireEvent.submit(screen.getByTestId('form-engine'));
		expect(HTMLFormElement.prototype.submit).toHaveBeenCalled();
	});
});
