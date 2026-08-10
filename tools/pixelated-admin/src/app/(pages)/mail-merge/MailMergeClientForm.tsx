'use client';

import { useCallback, type FormEvent } from 'react';
import { Loading, ToggleLoading } from '@pixelated-tech/components';

interface MailMergeClientFormProps {
	selectedFile: string;
	selectedCategory: string;
	categories: string[];
	sendMailAction: (formData: FormData) => Promise<void>;
}

export const MailMergeClientForm = ({ selectedFile, selectedCategory, categories, sendMailAction }: MailMergeClientFormProps) => {
	const handleSubmit = useCallback((_event: FormEvent<HTMLFormElement>) => {
		ToggleLoading({ show: true });
	}, []);

	return (
		<>
			<Loading />
			<form action={sendMailAction} method="post" onSubmit={handleSubmit}>
				<input type="hidden" name="mailerFile" value={selectedFile} />

				<label style={{ display: 'block', marginBottom: '12px' }}>
					Category
					<select name="category" defaultValue={selectedCategory} style={{ width: '100%', padding: '8px', marginTop: '4px' }}>
						<option value="">Select a category</option>
						{categories.map(category => (
							<option key={category} value={category}>{category}</option>
						))}
					</select>
				</label>

				<label style={{ display: 'block', marginBottom: '12px' }}>
					From
					<input name="from" type="text" defaultValue="" style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
				</label>

				<label style={{ display: 'block', marginBottom: '12px' }}>
					Subject
					<input name="subject" type="text" defaultValue="" style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
				</label>

				<label style={{ display: 'block', marginBottom: '12px' }}>
					Body
					<textarea name="body" rows={20} defaultValue="" style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
				</label>

				<button type="submit" style={{ padding: '10px 16px' }}>
					Send
				</button>
			</form>
		</>
	);
};
