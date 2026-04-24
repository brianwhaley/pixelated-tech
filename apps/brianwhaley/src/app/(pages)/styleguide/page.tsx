"use client";

import React from "react";
import { StyleGuideUI } from "@pixelated-tech/components";
import siteConfig from '../../data/siteconfig.json';
const routes = siteConfig.routes;

export default function StyleGuide() {
	return (
		<>
			<StyleGuideUI routes={routes} />
		</>
	);
}
