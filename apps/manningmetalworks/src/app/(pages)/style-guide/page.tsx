"use client";

import React from "react";
import { StyleGuideUI } from "@pixelated-tech/components";
import routesData from '../../data/routes.json';
const routes = routesData.routes;

export default function StyleGuidePage() {

	return (
		<>
			<StyleGuideUI routes={routes} />
		</>
	);
}
