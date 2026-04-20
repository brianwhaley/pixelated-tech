import React from "react";
import { headers } from 'next/headers';
import { PixelatedServerConfigProvider, type SiteInfo } from "@pixelated-tech/components/server";
import { descriptionToKeywords, getRouteByKey } from "@pixelated-tech/components/server";
import { getEbayItem, getEbayProductSchema } from "@pixelated-tech/components/server";
import { WebsiteSchema, LocalBusinessSchema, ServicesSchema, BreadcrumbListSchema, ProductSchema } from "@pixelated-tech/components";
import { VisualDesignStyles } from "@pixelated-tech/components/server";
import Header from "@/app/elements/header";
import HeaderNav from "./elements/headernav";
import Nav from "@/app/elements/nav";
import Search from '@/app/elements/search';
import Footer from '@/app/elements/footer';
import Interactions from "@/app/elements/interactions";
import LayoutClient from "./elements/layoutclient";
import myRoutes from "@/app/data/routes.json";
import "@pixelated-tech/components/css/pixelated.global.css";
import "@pixelated-tech/components/css/pixelated.grid.scss";
import "./styles/globals.css";

import { generateMetaTags } from "@pixelated-tech/components/server";

export default async function RootLayout({ children }: { children: React.ReactNode }) {

	const headersList = await headers();
	const url = headersList.get("x-url") || "";
	const origin = headersList.get("x-origin") || "";
	const pathname = headersList.get("x-path") || "";
	const siteInfo = myRoutes.siteInfo;

	let myMetadata = getRouteByKey(myRoutes.routes, "path", pathname);
	let productSchema = null;

	if (!myMetadata && pathname.includes('/store/')) {
		/// NO METADATA FOUND - EBAY STORE ITEM 
		const itemID = pathname.split("/store/")[1];
		const apiProps = {
			qsItemURL: `/v1|${itemID}|0?fieldgroups=PRODUCT,ADDITIONAL_SELLER_DETAILS`,
		};

		try {
			const ebayItem = await getEbayItem({ apiProps });
			if (ebayItem && ebayItem.title) {
				const thisItemTitle = "PixelVivid - Item " + ebayItem.legacyItemId + " - " + ebayItem.title;

				myMetadata = {
					name: ebayItem.title,
					path: `/store/${ebayItem.legacyItemId}`,
					title: thisItemTitle,
					description: ebayItem.description?.replace(/[\r\n]+/g, ' '),
					keywords: descriptionToKeywords(thisItemTitle + " " + ebayItem.description, 30).join(", "),
				};

				// Generate product schema from the fetched item
				productSchema = getEbayProductSchema({
					item: ebayItem,
					siteUrl: `${origin}/store/${itemID}`
				});
			}
		} catch (error) {
			console.error('Error fetching eBay item:', error);
		}
	}

	return (
		<html lang="en">
			<head>
				{generateMetaTags({
					title: myMetadata?.title ?? "",
					description: myMetadata?.description ?? "",
					keywords: myMetadata?.keywords ?? "",
					origin: origin ?? "",
					url: url ?? "",
					siteInfo: siteInfo as SiteInfo,
				})}
				<BreadcrumbListSchema routes={myRoutes.routes} currentPath={pathname} siteUrl={siteInfo.url} />
				{productSchema && <ProductSchema product={productSchema} />}
				<WebsiteSchema siteInfo={siteInfo as SiteInfo} />
				<LocalBusinessSchema siteInfo={siteInfo} />
				<ServicesSchema siteInfo={siteInfo} />
				<VisualDesignStyles visualdesign={myRoutes.visualdesign} />
			</head>

			<body>
				<PixelatedServerConfigProvider>
					<LayoutClient />
					<Interactions />
					<header>
						<div id="page-header" className="fixed-header">
							<Header />
						</div>
						<div id="page-header-nav" className="fixed-header-nav">
							<div className="section-container">
								<HeaderNav />
							</div>
						</div>
						<div id="fixed-header-spacer" />
						<div id="fixed-header-nav-spacer" />
						<div id="page-search" className="no-mobile">
							<Search />
						</div>
					</header>
					<nav><Nav /></nav>
					<main>{children}</main>
					<footer><Footer /></footer>
				</PixelatedServerConfigProvider>
			</body>
		</html>
	);
}
