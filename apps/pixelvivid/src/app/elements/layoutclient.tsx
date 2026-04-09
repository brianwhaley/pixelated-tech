"use client";

import React, { useEffect } from "react";
import { loadAllImagesFromCloudinary } from "@pixelated-tech/components";
// import { deferAllCSS } from "@pixelated-tech/components";
import { preloadImages } from "@pixelated-tech/components";
import { usePixelatedConfig } from "@pixelated-tech/components";


export default function LayoutClient() {
	const config = usePixelatedConfig();
	useEffect(() => {
		// document.addEventListener('DOMContentLoaded', deferAllCSS);
		preloadImages();
		// deferAllCSS();
		loadAllImagesFromCloudinary({ 
			origin: window.location.origin,
			product_env: config?.cloudinary?.product_env || '',
		});
	}, []);
	return ( <></> );
}
