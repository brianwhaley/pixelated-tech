"use client";

import React from "react";
import { PageSection, Markdown, useFileData } from "@pixelated-tech/components";

export default function Readme() {
	const { data: readmeText, loading, error } = useFileData('/data/readme.md');
	if (loading) return <PageSection columns={1} id="markdown-container"><div>Loading...</div></PageSection>;
	if (error) return <PageSection columns={1} id="markdown-container"><div>Error: {error}</div></PageSection>;
	return (
		<PageSection columns={1} id="markdown-container">
			<Markdown markdowndata={readmeText || ''} />
		</PageSection>
	);
}
