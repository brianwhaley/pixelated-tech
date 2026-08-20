import { PageSection, PageTitleHeader } from '@pixelated-tech/components';
import { SquareStoreItemsWrapper } from '@pixelated-tech/components/server';

export default async function EventsPage({
	searchParams,
}: {
	searchParams?: Promise<Record<string, string | string[] | undefined>>;
} = {}) {
	const resolvedSearchParams = await searchParams;
	const eventCategoryId = 'LBM6V34W6PZZCLX2OOM4LWEI';
	const prefilter = {
		featuredOnly: resolvedSearchParams?.featuredOnly === 'true',
		propertyName: 'Category',
		propertyValue: eventCategoryId,
	};

	const initialFilter = prefilter.propertyName && prefilter.propertyValue ? {
		propertyName: prefilter.propertyName,
		propertyValue: prefilter.propertyValue,
	} : undefined;

	return (
		<>
			<PageSection columns={1} maxWidth="100%" id="events-page-header">
				<PageTitleHeader title="The Three Muses of Bluffton Events" />
				<p>
					Explore our upcoming events, classes, workshops, and summer camps. Filter by event details to find the perfect activity for you. You can also view our upcoming and past events on our <a href="/events/calendar">Events Calendar</a> page.
				</p>
			</PageSection>

			<PageSection columns={4} maxWidth="1200px" id="events-section">
				<SquareStoreItemsWrapper
					prefilter={prefilter}
					initialFilter={initialFilter}
					showFilters={false}
					itemSize="large"
					itemURLPrefix="/events"
					title="Events"
					intro="Browse our upcoming events, classes, workshops, and summer camps."
					emptyMessage="Please check back soon for new events."
					errorMessage="Unable to load events at this time."
				/>
			</PageSection>
		</>
	);
}
