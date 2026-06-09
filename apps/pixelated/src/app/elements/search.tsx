"use client";

import React from "react";
import PropTypes from 'prop-types';
import { GoogleSearch } from "@pixelated-tech/components";

export default function Search() {
	return (
		<div className="section-container" suppressHydrationWarning>
			<GoogleSearch />
		</div>
	);
}
Search.prototypes = {
	id: PropTypes.string.isRequired,
};