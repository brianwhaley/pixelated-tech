export const timesheetEmailForm = {
	fields: [
		{ component: 'FormInput', props: { type: 'hidden', name: 'action', id: 'action', value: 'request' } },
		{ component: 'FormInput', props: { type: 'email', name: 'email', id: 'timesheet-email', label: 'Email', required: 'required', autoComplete: 'email' } },
		{ component: 'FormButton', props: { type: 'submit', id: 'request-passcode', text: 'Send a passcode' } },
	],
};

export const timesheetPasscodeForm = {
	fields: [
		{ component: 'FormInput', props: { type: 'hidden', name: 'action', id: 'action', value: 'verify' } },
		{ component: 'FormInput', props: { type: 'hidden', name: 'email', id: 'timesheet-passcode-email' } },
		{ component: 'FormInput', props: { type: 'text', name: 'passcode', id: 'timesheet-passcode', label: 'Passcode', required: 'required', inputMode: 'numeric', autoComplete: 'one-time-code' } },
		{ component: 'FormButton', props: { type: 'submit', id: 'verify-passcode', text: 'Sign in' } },
	],
};

export const timesheetEntryForm = {
	fields: [
		{ component: 'FormInput', props: { type: 'hidden', name: 'action', id: 'action', value: 'submit' } },
		{ component: 'FormInput', props: { type: 'hidden', name: 'weekOf', id: 'week-of' } },
		...['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map((day) => ({
			component: 'FormInput',
			props: { type: 'number', name: day, id: `hours-${day}`, label: `${day.toUpperCase()} hours`, min: '0', step: '0.25', required: 'required' },
		})),
		{ component: 'FormButton', props: { type: 'submit', id: 'submit-timesheet', text: 'Submit Timesheet' } },
	],
};

export const timesheetWeekForm = {
	properties: { id: 'timesheet-week-selector' },
	fields: [
		{ component: 'FormInput', props: { type: 'hidden', name: 'action', id: 'action', value: 'view' } },
		{ component: 'FormInput', props: { type: 'date', name: 'weekOf', id: 'week-of', label: 'Week beginning Sunday', required: 'required' } },
		{ component: 'FormButton', props: { type: 'submit', id: 'view-week', text: 'View Week' } },
	],
};
