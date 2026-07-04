"use client";

import React from "react";
import { PageSection, PageTitleHeader, Markdown, useFileData } from "@pixelated-tech/components";

export default function BlogCalendarPage() {
	const { data: readmeText, loading, error } = useFileData('/data/blogcalendar.md'); 
	if (loading) return <PageSection columns={1} id="markdown-container"><div>Loading...</div></PageSection>;
	if (error) return <PageSection columns={1} id="markdown-container"><div>Error: {error}</div></PageSection>;
	return (
		<>
			<PageTitleHeader title="The Three Muses of Bluffton Blog Calendar" />
			<PageSection columns={1} id="markdown-container">
				<Markdown markdowndata={readmeText || ''} />
			</PageSection>
		</>
	);
}
