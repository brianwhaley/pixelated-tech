"use client";

import React, { useEffect } from "react";
import { MicroInteractions } from "@pixelated-tech/components";

export default function Interactions() {

	useEffect(() => {
		MicroInteractions({ 
			buttonring: true,
			formglow: true,
			imgtwist: true,
			scrollfadeElements: '.callout , .calloutSmall , .carousel-container, scroll-fade-element',
		});
	}, []);

	return ( <></> );
}