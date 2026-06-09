"use client";

import React, { use } from 'react';
import { EbayItemDetail, usePixelatedConfig } from "@pixelated-tech/components";
import { ContentfulItemDetail } from "@pixelated-tech/components";

export function isNumeric(value: any) {
	return !isNaN(parseFloat(value)) && isFinite(value);
}

export function createEbayItemApiProps(pixelatedConfig: any, item: string) {
	return {
		proxyURL: pixelatedConfig.ebay?.proxyURL || '',
		qsItemURL: `/v1|${item}|0?fieldgroups=PRODUCT,ADDITIONAL_SELLER_DETAILS`,
		appId: pixelatedConfig.ebay?.appId || '', // clientId
		appCertId: pixelatedConfig.ebay?.appCertId || '', // clientSecret
		tokenScope: pixelatedConfig.ebay?.tokenScope || '',
		globalId: pixelatedConfig.ebay?.globalId || 'EBAY-US',
	};
}

export function createItemCloudinaryProductEnv(pixelatedConfig: any) {
	return pixelatedConfig.cloudinary?.product_env || "";
}

export default function EbayItem({params}: { params: Promise<{ item: string }> }){
	const pixelatedConfig = usePixelatedConfig();
	const debug = false;
	const { item } = use(params);

	if (!pixelatedConfig) return null;

	if (debug) console.log(item);
	const ebayApiProps = createEbayItemApiProps(pixelatedConfig.integrations ?? {}, item);
	const cloudinaryProductEnv = createItemCloudinaryProductEnv(pixelatedConfig); // Cloudinary environment for product images
	
	return (
		<>
			<section id="ebay-item-section">
				<div className="section-container">
					{ isNumeric(item) && item.length == 12 
						? <EbayItemDetail 
							apiProps={ebayApiProps} 
							itemID={item} 
							cloudinaryProductEnv={cloudinaryProductEnv} 
						/>
						: <ContentfulItemDetail entry_id={item} />
					}
				</div>
			</section>
		</>
		
	);
}
