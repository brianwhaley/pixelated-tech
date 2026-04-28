"use client";

import React from "react";
import { ContentfulItems, EbayItems, usePixelatedConfig, Loading } from "@pixelated-tech/components";
import { PageTitleHeader } from "@pixelated-tech/components";

export function createEbayStoreApiProps(pixelatedConfig: any) {
	return {
		proxyURL: pixelatedConfig?.ebay?.proxyURL || '',
		// qsSearchURL: '?q=sunglasses&fieldgroups=full&category_ids=79720&aspect_filter=categoryId:79720&filter=sellers:{pixelatedtech}&sort=newlyListed&limit=200',
		// eslint-disable-next-line pixelated/no-hardcoded-config-keys
		qsSearchURL: '?q=sunglasses&fieldgroups=FULL&category_ids=79720&aspect_filter=categoryId:79720&filter=sellers:{pixelatedtech}&sort=newlyListed&limit=200',
		appId: pixelatedConfig?.ebay?.appId || '', // clientId
		appCertId: pixelatedConfig?.ebay?.appCertId || '', // clientSecret
		tokenScope: pixelatedConfig?.ebay?.tokenScope || '',
		globalId: pixelatedConfig?.ebay?.globalId || 'EBAY-US',
	};
}

export function createContentfulStoreApiProps(pixelatedConfig: any) {
	return {
		proxyURL: pixelatedConfig?.contentful?.proxyURL || '',
		base_url: pixelatedConfig?.contentful?.base_url || "",
		space_id: pixelatedConfig?.contentful?.space_id || "",
		environment: pixelatedConfig?.contentful?.environment || "",
		delivery_access_token: pixelatedConfig?.contentful?.delivery_access_token || "",
	};
}

export function createStoreCloudinaryProductEnv(pixelatedConfig: any) {
	return pixelatedConfig?.cloudinary?.product_env || "";
}

export default function Ebay() {
	const pixelatedConfig = usePixelatedConfig();

	if (!pixelatedConfig) {
		return <Loading />;
	}

	const ebayApiProps = createEbayStoreApiProps(pixelatedConfig);
	const contentfulApiProps = createContentfulStoreApiProps(pixelatedConfig);
	const cloudinaryProductEnv = createStoreCloudinaryProductEnv(pixelatedConfig); // Cloudinary environment for product images

	return (
		<>
			<section id="ebay-section">
				<div className="section-container">
					<PageTitleHeader title="Custom Sunglasses For Sale" />
					<ContentfulItems apiProps={contentfulApiProps} cloudinaryProductEnv={cloudinaryProductEnv} />
					<EbayItems apiProps={ebayApiProps} cloudinaryProductEnv={cloudinaryProductEnv} />
				</div>
			</section>
		</>
	);
}
