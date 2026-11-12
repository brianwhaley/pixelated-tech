'use client';

import React from 'react';
import PropTypes, { InferProps } from 'prop-types';
import { FormEngine } from '../../sitebuilder/form/formengine';
import { timesheetEmailForm, timesheetEntryForm, timesheetPasscodeForm, timesheetWeekForm } from './timesheet.forms';
import type { TimesheetRecord } from './timesheet.types';
import './timesheet.css';

/** Props for the email entry form.
 * @param props Form props.
 */
TimesheetEmailForm.propTypes = {};
export type TimesheetEmailFormType = InferProps<typeof TimesheetEmailForm.propTypes>;
export function TimesheetEmailForm(_props: TimesheetEmailFormType) {
	return <FormEngine formData={timesheetEmailForm as any} method="post" onSubmitHandler={(event) => submitTimesheetForm(event, '/timesheets/auth', 'post')} />;
}

/** Props for the passcode entry form.
 * @param props Form props.
 */
TimesheetPasscodeForm.propTypes = {
	email: PropTypes.string.isRequired,
};
export type TimesheetPasscodeFormType = InferProps<typeof TimesheetPasscodeForm.propTypes>;
export function TimesheetPasscodeForm(props: TimesheetPasscodeFormType) {
	const { email } = props;
	const form = {
		...timesheetPasscodeForm,
		fields: timesheetPasscodeForm.fields.map((field) => field.props.name === 'email'
			? { ...field, props: { ...field.props, value: email } }
			: field),
	};
	return <FormEngine formData={form as any} method="post" onSubmitHandler={(event) => submitTimesheetForm(event, '/timesheets/auth', 'post')} />;
}

/** Props for the weekly hours form.
 * @param props Form props.
 */
TimesheetEntryForm.propTypes = {
	weekOf: PropTypes.string.isRequired,
	values: PropTypes.objectOf(PropTypes.string),
};
export type TimesheetEntryFormType = InferProps<typeof TimesheetEntryForm.propTypes>;
export function TimesheetEntryForm(props: TimesheetEntryFormType) {
	const { weekOf, values } = props;
	const form = {
		...timesheetEntryForm,
		fields: timesheetEntryForm.fields.map((field) => {
			if (field.props.name === 'weekOf') return { ...field, props: { ...field.props, value: weekOf } };
			if (!field.props.name || field.props.name === 'action') return field;
			return { ...field, props: { ...field.props, defaultValue: values?.[field.props.name as keyof TimesheetRecord] ?? '' } };
		}),
	};
	return <FormEngine formData={form as any} method="get" onSubmitHandler={(event) => submitTimesheetForm(event, '/timesheets/new', 'get')} />;
}

/** Props for the admin week selector.
 * @param props Form props.
 */
TimesheetWeekSelector.propTypes = {
	weekOf: PropTypes.string.isRequired,
};
export type TimesheetWeekSelectorType = InferProps<typeof TimesheetWeekSelector.propTypes>;
export function TimesheetWeekSelector(props: TimesheetWeekSelectorType) {
	const { weekOf } = props;
	const form = {
		...timesheetWeekForm,
		fields: timesheetWeekForm.fields.map((field) => field.props.name === 'weekOf'
			? { ...field, props: { ...field.props, defaultValue: weekOf } }
			: field),
	};
	return <FormEngine formData={form as any} method="get" onSubmitHandler={(event) => submitTimesheetForm(event, '/timesheets/admin', 'get')} />;
}

function submitTimesheetForm(event: React.FormEvent<HTMLFormElement>, action: string, method: 'get' | 'post') {
	const form = event.target;
	if (!(form instanceof HTMLFormElement)) {
		throw new Error('Timesheet form submission did not originate from a form element.');
	}
	form.action = action;
	form.method = method;
	HTMLFormElement.prototype.submit.call(form);
}
