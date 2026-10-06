import React from 'react';
import { notFound } from 'next/navigation';
import { PageSection } from '@pixelated-tech/components';
import { SquareStoreItemDetail } from '@pixelated-tech/components';
import { getSquareStoreItemById } from '@pixelated-tech/components/server';
import { PageTitleHeader } from '@pixelated-tech/components';

export default async function StoreItemPage({ params }: { params: Promise<{ item: string }> }) {
	const resolvedParams = await params;
	const item = await getSquareStoreItemById(resolvedParams?.item);
	if (!item) { notFound(); }
	return (
		<>
			<PageTitleHeader title="Item Details" />
			<PageSection columns={1} maxWidth="1024px" id="store-item-detail-section">
				<SquareStoreItemDetail item={item} />
			</PageSection>
		</>
	);
}
