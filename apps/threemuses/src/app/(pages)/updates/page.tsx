"use client";

import React from "react";
import { PageSection, PageTitleHeader, Markdown, useFileData } from "@pixelated-tech/components";

export default function UpdatesPage() {
	const { data: readmeText, loading, error } = useFileData('/data/updates.md');
	if (loading) return <PageSection columns={1} id="markdown-container"><div>Loading...</div></PageSection>;
	if (error) return <PageSection columns={1} id="markdown-container"><div>Error: {error}</div></PageSection>;
	return (
		<>
			<PageTitleHeader title="The Three Muses of Bluffton Updates" />
			<PageSection columns={1} id="markdown-container">
				<Markdown markdowndata={readmeText || ''} />
			</PageSection>
		</>
	);
}
