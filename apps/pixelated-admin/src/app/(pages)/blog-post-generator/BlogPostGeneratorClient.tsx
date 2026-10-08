'use client';

import { startTransition, useActionState, useEffect, useRef, useState, useTransition } from 'react';
import { FormEngine, Loading, PageSection, PageTitleHeader, Tab, ToggleLoading } from '@pixelated-tech/components';
import type { BlogGenerationResult, ExistingWordPressDraft } from '@pixelated-tech/components/adminserver';
import blogPostGeneratorFormData from './blogpostgeneratorform.json';
import "./blog-post-generator.css";

type BlogSite = {
	name: string;
	blog_url?: string;
};

type BlogGenerationAction = (
	previousState: BlogGenerationResult | null,
	formData: FormData
) => Promise<BlogGenerationResult>;

type ExistingDraftsAction = (formData: FormData) => Promise<ExistingWordPressDraft[]>;
type SiteAwareCalendar = {
	siteName: string;
	calendar: BlogGenerationResult['calendar'];
};

const formatNumber = (value: number) => value.toLocaleString();

function downloadCalendarJson(calendar: BlogGenerationResult['calendar'], operation: string) {
	const blob = new Blob([JSON.stringify(calendar, null, 2)], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = `blog-calendar-${operation}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
	link.click();
	URL.revokeObjectURL(url);
}

export default function BlogPostGeneratorClient({ action, getExistingDraftsAction, sites }: { action: BlogGenerationAction; getExistingDraftsAction: ExistingDraftsAction; sites: BlogSite[] }) {
	const [result, formAction, isPending] = useActionState(action, null);
	// Future enhancement: move related workflow fields into a reducer if this component continues growing.
	const [latestCalendar, setLatestCalendar] = useState<SiteAwareCalendar | null>(null);
	const [showResult, setShowResult] = useState(false);
	const [drafts, setDrafts] = useState<ExistingWordPressDraft[]>([]);
	const [selectedDraftIds, setSelectedDraftIds] = useState<string[]>([]);
	const [updateMode, setUpdateMode] = useState<'content' | 'image' | 'both'>('both');
	const [updateSiteName, setUpdateSiteName] = useState(sites[0]?.name || '');
	const [draftsError, setDraftsError] = useState('');
	const [isDraftsPending, startDraftsTransition] = useTransition();
	const submittedSiteNameRef = useRef('');
	useEffect(() => {
		ToggleLoading({ show: isPending });
	}, [isPending]);
	useEffect(() => {
		if (result?.calendar) {
			setLatestCalendar({ siteName: submittedSiteNameRef.current, calendar: result.calendar });
			setShowResult(true);
		}
	}, [result]);
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
		submittedFormData.set('operation', 'generate');
		const siteName = String(submittedFormData.get('siteName') || '');
		submittedSiteNameRef.current = siteName;
		if (latestCalendar?.siteName === siteName) submittedFormData.set('calendarJson', JSON.stringify(latestCalendar.calendar));
		startTransition(() => formAction(submittedFormData));
	};
	const handleViewExistingDrafts = () => {
		const request = new FormData();
		request.set('siteName', updateSiteName);
		setDraftsError('');
		startDraftsTransition(async () => {
			try {
				setDrafts(await getExistingDraftsAction(request));
				setSelectedDraftIds([]);
			} catch (error) {
				setDraftsError(error instanceof Error ? error.message : 'Unable to load existing drafts');
			}
		});
	};
	const handleUpdateSiteChange = (siteName: string) => {
		setUpdateSiteName(siteName);
		setLatestCalendar(null);
		setShowResult(false);
		setDrafts([]);
		setSelectedDraftIds([]);
		setDraftsError('');
	};
	const handleUpdateDrafts = () => {
		if (selectedDraftIds.length === 0) return;
		const request = new FormData();
		request.set('siteName', updateSiteName);
		request.set('operation', 'update');
		request.set('draftIds', selectedDraftIds.join(','));
		request.set('updateMode', updateMode);
		request.set('count', String(selectedDraftIds.length));
		submittedSiteNameRef.current = updateSiteName;
		if (latestCalendar?.siteName === updateSiteName) request.set('calendarJson', JSON.stringify(latestCalendar.calendar));
		startTransition(() => formAction(request));
	};
	const createDraftWorkflow = <FormEngine onSubmitHandler={handleSubmit} method="post" formData={formData as any} />;
	const updateDraftWorkflow = <section id="existing-drafts" aria-labelledby="existing-drafts-heading">
		<h2 id="existing-drafts-heading">Existing WordPress drafts</h2>
		<label htmlFor="update-blog-site">Site</label>
		<select id="update-blog-site" value={updateSiteName} onChange={(event) => handleUpdateSiteChange(event.target.value)} required>
			{sites.map((site) => <option key={site.name} value={site.name}>{site.name}</option>)}
		</select>
		<br />
		<button type="button" class="button" onClick={handleViewExistingDrafts} disabled={isDraftsPending}>
			{isDraftsPending ? 'Loading drafts...' : 'View Existing Drafts'}
		</button>
		<br /><br />
		{draftsError && <p role="alert">{draftsError}</p>}
		{drafts.length > 0 && <>
			<ul className="blog-draft-list">
				{drafts.map((draft) => {
					const draftId = String(draft.id);
					return <li className="blog-draft-item" key={draftId}>
						<label className="blog-draft-label">
							<input
								type="checkbox"
								checked={selectedDraftIds.includes(draftId)}
								onChange={(event) => setSelectedDraftIds((current) => event.target.checked ? [...current, draftId] : current.filter((id) => id !== draftId))}
							/>
							{draft.title} (Draft {draft.id})
						</label>
						<br />
						{draft.modified && <div className="blog-draft-modified">Last modified {new Date(draft.modified).toLocaleString()}</div>}
					</li>;
				})}
			</ul>
			<br />
			<fieldset>
				<legend>Update mode</legend>
				<label><input type="radio" name="updateMode" value="content" checked={updateMode === 'content'} onChange={() => setUpdateMode('content')} /> Update Content</label>
				<label><input type="radio" name="updateMode" value="image" checked={updateMode === 'image'} onChange={() => setUpdateMode('image')} /> Update Image</label>
				<label><input type="radio" name="updateMode" value="both" checked={updateMode === 'both'} onChange={() => setUpdateMode('both')} /> Update Both</label>
			</fieldset>
			<button type="button" class="button" onClick={handleUpdateDrafts} disabled={selectedDraftIds.length === 0 || isPending}>Update Drafts</button>
		</>}
		{!isDraftsPending && drafts.length === 0 && !draftsError && <p>No existing drafts found for this site.</p>}
	</section>;

	return (
		<>
			<Loading />
			<PageTitleHeader title="Blog Post Generator" />
			<br />
			<PageSection columns={1} maxWidth="1024px" id="blog-generator-section">
				<Tab tabs={[
					{ id: 'create', label: 'Create New Drafts', content: createDraftWorkflow },
					{ id: 'update', label: 'Update Existing Drafts', content: updateDraftWorkflow },
				]} defaultActiveTab="create" />
				{result && showResult && (
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
						<button type="button" class="button" onClick={() => latestCalendar && downloadCalendarJson(latestCalendar.calendar, 'latest')}>
							Download updated calendar JSON
						</button>
					</>
				)}
			</PageSection>
		</>
	);
}
