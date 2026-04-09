"use client";

import React from "react";
import PropTypes from 'prop-types';
import { GoogleSearch as GSearch } from "@pixelated-tech/components";

export default function Search() {
	return (
		<div className="section-container" suppressHydrationWarning>
			<GSearch id="e336d1c9d0e5e48e5" />
		</div>
	);
}
Search.prototypes = {
	id: PropTypes.string.isRequired,
};