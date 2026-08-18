"use client"; 

import React, { useEffect } from "react";
import { loadAllImagesFromCloudinary, usePixelatedConfig } from "@pixelated-tech/components";
import { MicroInteractions } from "@pixelated-tech/components";
import { deferAllCSS } from "@pixelated-tech/components";
import { preloadImages } from "@pixelated-tech/components";

export default function LayoutClient() {

	const integrationsConfig = usePixelatedConfig()?.integrations;

	useEffect(() => {
		MicroInteractions({ 
			buttonring: true,
			formglow: true,
			imgscale: true,
			simplemenubutton: true,
			scrollfadeSelectors: '.callout , .calloutSmall , .carousel-container , .countup , .scroll-fade-element , .tile , .timeline-container ',
		});
	}, []);
    
	useEffect(() => {
		document.addEventListener('DOMContentLoaded', deferAllCSS);
		preloadImages();
		deferAllCSS();
		loadAllImagesFromCloudinary({ 
			origin: window.location.origin,
			product_env: integrationsConfig?.cloudinary?.product_env ?? "dlbon7tpq"
		});
	}, []);

	return ( <></> );
}