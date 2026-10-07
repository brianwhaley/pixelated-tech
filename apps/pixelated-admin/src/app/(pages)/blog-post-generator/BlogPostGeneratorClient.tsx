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

const formatNumber = (value: number) => value.toLocaleString();

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
					<>
						<section id="blog-generation-results" aria-labelledby="blog-generation-results-heading">
							<h2 id="blog-generation-results-heading">Blog post confirmations</h2>
							<ul>
								{result.results.map((item) => (
									<li key={item.calendarId}>
										{item.title}: {item.status === 'draft' ? `Draft ${item.wordpressPostId} created` : item.error}
									</li>
								))}
							</ul>
						</section>
						{result.usage && <section id="gemini-api-usage" aria-labelledby="gemini-usage-heading">
							<h2 id="gemini-usage-heading">Gemini API usage</h2>
							<p>Measured for this run; this is not monthly quota or billing balance.</p>
							<ul>
								<li><strong>Model:</strong> {result.usage.model}</li>
								<li><strong>Gemini generation request count:</strong> {formatNumber(result.usage.requestCount)}</li>
								<li><strong>Gemini input token count:</strong> {formatNumber(result.usage.promptTokenCount)}</li>
								<li><strong>Gemini output token count:</strong> {formatNumber(result.usage.candidatesTokenCount)}</li>
								<li><strong>Gemini total token count:</strong> {formatNumber(result.usage.totalTokenCount)}</li>
								<li><strong>Note:</strong> Google manages rate limits and billing separately.</li>
								<li><a href="https://aistudio.google.com/rate-limit" target="_blank" rel="noopener noreferrer">
									View active Gemini rate limits</a></li>
								<li><a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer">
									View Google Gemini billing details
								</a></li>
							</ul>
						</section>}
					</>
				)}
			</PageSection>
		</>
	);
}
