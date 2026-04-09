"use client";

import React from "react";
import { PageSection, Markdown, useFileData } from "@pixelated-tech/components";

export default function Updaets() {
	const { data: readmeText, loading, error } = useFileData('/data/updates.md');
	if (loading) return <PageSection columns={1} id="markdown-container"><div>Loading...</div></PageSection>;
	if (error) return <PageSection columns={1} id="markdown-container"><div>Error: {error}</div></PageSection>;
	return (
		<PageSection columns={1} id="markdown-container">
			<Markdown markdowndata={readmeText || ''} />
		</PageSection>
	);
}
