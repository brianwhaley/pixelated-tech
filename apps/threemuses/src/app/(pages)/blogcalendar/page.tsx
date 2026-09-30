"use client";

import React from "react";
import { ListItems, PageSection, PageTitleHeader, useFileData } from "@pixelated-tech/components";

type BlogCalendarEntry = Record<string, unknown>;

type BlogCalendarData = {
	blogCalendar: BlogCalendarEntry[];
};

export default function BlogCalendarPage() {
	const { data } = useFileData<BlogCalendarData>('/data/blogcalendar.json', 'json');
	return (
		<>
			<PageTitleHeader title="The Three Muses of Bluffton Blog Calendar" />
			<br />
			<PageSection columns={1} id="blog-calendar-container">
				<ListItems items={data?.blogCalendar || []} />
			</PageSection>
		</>
	);
}
