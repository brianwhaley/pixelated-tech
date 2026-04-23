"use client";

import React, { useEffect } from "react";
 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import PropTypes, { InferProps } from "prop-types";
import { MicroInteractions } from "@pixelated-tech/components";
// import { loadAllImagesFromCloudinary } from "@pixelated-tech/components";
import { preloadAllCSS } from "@pixelated-tech/components";
import { preloadImages } from "@pixelated-tech/components";


/**
 * LayoutClient - Client-side layout component to preload assets and initialize micro-interactions
 * @param none
 */
LayoutClient.propTypes = { /* No props expected */ };
export type LayoutClientType = InferProps<typeof LayoutClient.propTypes>;
export function LayoutClient() {

	useEffect(() => {
		preloadImages();
		preloadAllCSS();
		/* loadAllImagesFromCloudinary({ 
			origin: window.location.origin,
			product_env: "dlbon7tpq"
		}); */
	}, []);

	useEffect(() => {
		MicroInteractions({ 
			buttonring: true,
			formglow: true,
			imgscale: true,
			scrollfadeElements: '.callout , .calloutSmall , .carousel-container, .scroll-fade-element',
		});
	}, []);

	return ( <></> );
}
