import React from 'react';
import { notFound } from 'next/navigation';
import { PageSection } from '@pixelated-tech/components';
import { SquareStoreItemDetail } from '@pixelated-tech/components';
import { getSquareStoreItemById } from '@pixelated-tech/components/server';

export default async function EventPage({ params }: { params: Promise<{ event: string }> }) {
	const resolvedParams = await params;
	const item = await getSquareStoreItemById(resolvedParams?.event);
	if (!item) { notFound(); }
	return (
		<>
			<PageSection columns={1} maxWidth="1024px" id="store-item-detail-section">
				<SquareStoreItemDetail item={item} />
			</PageSection>
		</>
	);
}
