'use client';

import { useCallback, useMemo, useState, type FormEvent } from 'react';
import { Accordion, FormEngine, Loading, Table, ToggleLoading } from '@pixelated-tech/components';

interface MailMergeClientFormProps {
	selectedFile: string;
	selectedCategory?: string;
	selectedStatus?: string;
	categories: string[];
	statuses?: string[];
	targetCounts?: Record<string, number>;
	entries?: any[];
	sendMailAction: (formData: FormData) => Promise<void>;
}

export const MailMergeClientForm = ({ selectedFile, selectedCategory = '', selectedStatus = 'All', categories, statuses = [], targetCounts = {}, entries = [], sendMailAction }: MailMergeClientFormProps) => {
	const [category, setCategory] = useState(selectedCategory || '');
	const [status, setStatus] = useState(selectedStatus || 'All');

	const targetCount = useMemo(() => {
		if (!category) return 0;
		return targetCounts[`${category}||${status}`] ?? 0;
	}, [category, status, targetCounts]);

	const filteredEntries = useMemo(() => {
		return entries.filter(entry => {
			const entryCategory = String(entry?.category || '').trim();
			const entryStatus = String(entry?.status || '').trim() || 'Not Emailed';
			const statusMatches = status === 'All' ? true : entryStatus === status;
			return category ? entryCategory === category && statusMatches : false;
		});
	}, [category, status, entries]);

	const formData = useMemo(() => ({
		fields: [
			{
				component: 'FormInput',
				props: {
					id: 'mailerFile',
					name: 'mailerFile',
					type: 'hidden',
					value: selectedFile,
					label: '',
				},
			},
			{
				component: 'FormSelect',
				props: {
					id: 'category',
					name: 'category',
					label: 'Category',
					display: 'horizontal',
					value: category,
					required: 'required',
					options: [
						{ value: '', text: 'Select a category', disabled: true },
						...categories.map(option => ({ value: option, text: option })),
					],
					onChange: (value: string) => setCategory(String(value)),
				},
			},
			{
				component: 'FormSelect',
				props: {
					id: 'filterStatus',
					name: 'filterStatus',
					label: 'Status',
					display: 'horizontal',
					value: status,
					options: [
						{ value: 'All', text: 'All' },
						...statuses.map(option => ({ value: option, text: option })),
					],
					onChange: (value: string) => setStatus(String(value)),
				},
			},
			{
				component: 'FormInput',
				props: {
					id: 'from',
					name: 'from',
					type: 'text',
					label: 'From',
					display: 'horizontal',
					required: 'required',
				},
			},
			{
				component: 'FormInput',
				props: {
					id: 'subject',
					name: 'subject',
					type: 'text',
					label: 'Subject',
					display: 'horizontal',
					required: 'required',
				},
			},
			{
				component: 'FormTextarea',
				props: {
					id: 'body',
					name: 'body',
					label: 'Body',
					rows: '20',
					cols: '60',
					display: 'vertical',
					required: 'required',
				},
			},
			{
				component: 'FormInput',
				props: {
					id: 'send',
					name: 'send',
					type: 'submit',
					value: 'Send',
					label: '',
				},
			},
		],
	}), [selectedFile, categories, statuses, category, status]);

	const handleSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const form = event.currentTarget as HTMLFormElement;
		if (!form.checkValidity()) {
			form.reportValidity();
			return;
		}

		ToggleLoading({ show: true });
		form.submit();
	}, []);

	return (
		<>
			<Loading />
			<div>
				<div>
					<strong>Targets matching selection:</strong> {targetCount}
				</div>
				<Accordion
					items={[
						{
							title: 'Matching Targets',
							content: (
								<Table
									key={`mail-merge-targets-${category}-${status}-${filteredEntries.length}`}
									id="mail-merge-targets-table"
									data={filteredEntries}
									sortable={true}
								/>
							),
							open: false,
						},
					]}
				/>
			</div>
			<FormEngine
				action={sendMailAction}
				method="post"
				formData={formData}
				onSubmitHandler={handleSubmit}
			/>
		</>
	);
};
