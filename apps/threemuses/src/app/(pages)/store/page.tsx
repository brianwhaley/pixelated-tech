import { PageSection, PageTitleHeader } from '@pixelated-tech/components';
import { SquareStoreItemsWrapper } from '@pixelated-tech/components/server';

export default async function StorePage({
	searchParams,
}: {
	searchParams?: Promise<Record<string, string | string[] | undefined>>;
} = {}) {
	const resolvedSearchParams = await searchParams;
	const prefilter = {
		featuredOnly: resolvedSearchParams?.featuredOnly === 'true',
		propertyName: typeof resolvedSearchParams?.propertyName === 'string' ? resolvedSearchParams.propertyName : undefined,
		propertyValue: typeof resolvedSearchParams?.propertyValue === 'string' ? resolvedSearchParams.propertyValue : undefined,
	};

	const initialFilter = prefilter.propertyName && prefilter.propertyValue ? {
		propertyName: prefilter.propertyName,
		propertyValue: prefilter.propertyValue,
	} : undefined;

	return (
		<>
			<PageSection columns={1} maxWidth="100%" id="store-page-header">
				<PageTitleHeader title="The Three Muses of Bluffton Boutique Store" />
				<p>
					Shop our curated collection of boutique pieces available for purchase online. Filter by product details to find the perfect handcrafted item.
				</p>
			</PageSection>

			<PageSection columns={4} maxWidth="1200px" id="store-items-section">
				<SquareStoreItemsWrapper
					prefilter={prefilter}
					initialFilter={initialFilter}
					title="Boutique Collection"
					intro="Browse our latest handcrafted and locally made items."
					emptyMessage="Please check back soon for new curated merchandise."
					errorMessage="Unable to load boutique items at this time."
				/>
			</PageSection>
		</>
	);
}
