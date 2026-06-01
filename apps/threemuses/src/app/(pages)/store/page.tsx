import React from 'react';
import { Callout, PageSection, PageTitleHeader } from '@pixelated-tech/components';
import { SquareStoreItems } from '@pixelated-tech/components';
import { getSquareStoreItems } from '@pixelated-tech/components/server';

export default async function StorePage() {
	let boutiqueItems: Awaited<ReturnType<typeof getSquareStoreItems>>['items'] = [];
	let errorMessage: string | null = null;

	try {
		const storeResponse = await getSquareStoreItems();
		boutiqueItems = storeResponse?.items ?? [];
	} catch (error: any) {
		errorMessage = error?.message || 'Unable to load boutique items at this time.';
	}

	return (
		<>
			<PageSection columns={1} maxWidth="100%" id="store-page-header">
				<PageTitleHeader title="Boutique Store" />
				<p>
					Shop our curated collection of boutique pieces available for purchase online. Filter by product details to find the perfect handcrafted item.
				</p>
			</PageSection>

			{errorMessage ? (
				<PageSection columns={1} maxWidth="1024px" id="store-error-section">
					<Callout
						variant="boxed"
						title="Store loading error"
						subtitle={errorMessage}
					/>
				</PageSection>
			) : boutiqueItems.length === 0 ? (
				<PageSection columns={1} maxWidth="1024px" id="store-empty-section">
					<Callout
						variant="boxed"
						title="No boutique items available"
						subtitle="Please check back soon for new curated merchandise."
					/>
				</PageSection>
			) : (
				<PageSection columns={4} maxWidth="1200px" id="store-items-section">
					<SquareStoreItems
						items={boutiqueItems}
						title="Boutique Collection"
						intro="Browse our latest handcrafted and locally made items."
					/>
				</PageSection>
			)}
		</>
	);
}
