'use client';

import { startTransition, useActionState, useEffect } from 'react';
import { FormEngine, Loading, PageSection, PageTitleHeader, ToggleLoading } from '@pixelated-tech/components';
import type { BlogGenerationResult } from '@pixelated-tech/components/adminserver';
import blogPostGeneratorFormData from './blogpostgeneratorform.json';

type BlogSite = {
	name: string;
	blog_url?: string;
};

type BlogGenerationAction = (
	previousState: BlogGenerationResult | null,
	formData: FormData
) => Promise<BlogGenerationResult>;

export default function BlogPostGeneratorClient({ action, sites }: { action: BlogGenerationAction; sites: BlogSite[] }) {
	const [result, formAction, isPending] = useActionState(action, null);
	useEffect(() => {
		ToggleLoading({ show: isPending });
	}, [isPending]);
	const formData = {
		...blogPostGeneratorFormData,
		fields: blogPostGeneratorFormData.fields.map((field) =>
			field.props.name === 'siteName'
				? {
					...field,
					props: {
						...field.props,
						options: sites.map((site) => ({ value: site.name, text: site.name })),
						defaultValue: sites[0]?.name || '',
					},
				}
				: field
		),
	};
	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const submittedFormData = new FormData(event.target as HTMLFormElement);
		startTransition(() => formAction(submittedFormData));
	};

	return (
		<>
			<Loading />
			<PageTitleHeader title="Blog Post Generator" />
			<PageSection columns={1} maxWidth="768px" id="blog-generator-section">
				<FormEngine onSubmitHandler={handleSubmit} method="post" formData={formData as any} />
				{result && (
					<ul>
						{result.results.map((item) => (
							<li key={item.calendarId}>
								{item.title}: {item.status === 'draft' ? `Draft ${item.wordpressPostId} created` : item.error}
							</li>
						))}
					</ul>
				)}
			</PageSection>
		</>
	);
}
