"use client";

import React from "react";
import { ContentfulItems, EbayItems, usePixelatedConfig, Loading } from "@pixelated-tech/components";
import { PageTitleHeader } from "@pixelated-tech/components";

export function createEbayStoreApiProps(pixelatedConfig: any) {
	return {
		proxyURL: pixelatedConfig?.integrations?.ebay?.proxyURL || '',
		// qsSearchURL: '?q=sunglasses&fieldgroups=full&category_ids=79720&aspect_filter=categoryId:79720&filter=sellers:{pixelatedtech}&sort=newlyListed&limit=200',
		// eslint-disable-next-line pixelated/no-hardcoded-config-keys
		qsSearchURL: '?q=sunglasses&fieldgroups=FULL&category_ids=79720&aspect_filter=categoryId:79720&filter=sellers:{pixelatedtech}&sort=newlyListed&limit=200',
		appId: pixelatedConfig?.integrations?.ebay?.appId || '', // clientId
		appCertId: pixelatedConfig?.integrations?.ebay?.appCertId || '', // clientSecret
		tokenScope: pixelatedConfig?.integrations?.ebay?.tokenScope || '',
		globalId: pixelatedConfig?.integrations?.ebay?.globalId || 'EBAY-US',
	};
}

export function createStoreCloudinaryProductEnv(pixelatedConfig: any) {
	return pixelatedConfig?.integrations?.cloudinary?.product_env || "";
}

export default function EbayPage() {
	const pixelatedConfig = usePixelatedConfig();

	if (!pixelatedConfig) {
		return <Loading />;
	}

	const ebayApiProps = createEbayStoreApiProps(pixelatedConfig);
	const cloudinaryProductEnv = createStoreCloudinaryProductEnv(pixelatedConfig); // Cloudinary environment for product images

	return (
		<>
			<section id="ebay-section">
				<div className="section-container">
					<PageTitleHeader title="Custom Sunglasses For Sale" />
					<ContentfulItems />
					<EbayItems apiProps={ebayApiProps} cloudinaryProductEnv={cloudinaryProductEnv} />
				</div>
			</section>
		</>
	);
}
