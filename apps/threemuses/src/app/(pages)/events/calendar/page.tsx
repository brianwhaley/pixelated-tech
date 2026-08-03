
import React from 'react';
import { PageSection, PageTitleHeader } from '@pixelated-tech/components';
import { EventCalendar, CalendarEvent } from '@pixelated-tech/components';
import { getSquareEventItems } from '@pixelated-tech/components/server';


export default async function EventsCalendarPage() {
	const events = await getSquareEventItems({ includeCompleted: true });
	const calendarEvents: CalendarEvent[] = events.map((event: any, index) => {
		const eventFields = event.fields || {};
		const eventSlug = eventFields.title
			.toString().toLowerCase().trim()
			.replace(/['’]/g, '')
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');
		const eventStartDate = new Date(String(eventFields.startDate ?? ''));
		// const eventEndDate = new Date(String(eventFields.endDate ?? ''));
		return {
			id: String(eventFields.id ?? index),
			title: String(eventFields.title ?? 'Untitled Event'),
			date: eventStartDate.toISOString().split('T')[0],
			category: String(eventFields.category?.[0] ?? 'General'),
			// url: eventSlug && eventEndDate >= new Date() ? `/events/${eventSlug}` : undefined,
			url: eventSlug ? `/events/${eventSlug}` : undefined,
		};
	});
	return (
		<>
			<PageSection columns={1} maxWidth="1024px" id="events-calendar-header-section">
				<PageTitleHeader
					title="The Three Muses of Bluffton Events Calendar"
				/>
				<p>Stay informed about the latest events and important dates for The Three Muses of Bluffton. 
					If you have any questions or need further information, feel free to reach out to our team.</p>
			</PageSection>
							
			<PageSection columns={1} maxWidth="1024px" id="events-calendar-section">
				<EventCalendar events={calendarEvents} />
			</PageSection>
		</>
	);
}
