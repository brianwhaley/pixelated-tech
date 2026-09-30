"use client";

import React from "react";
import PropTypes, { InferProps } from "prop-types";
import "./listitems.css";

export type ListItemsData = Record<string, unknown>;

/**
 * ListItems — renders object properties as list items.
 */
ListItems.propTypes = {
	/** Array of objects to render. */
	items: PropTypes.arrayOf(PropTypes.object).isRequired,
};
export type ListItemsType = InferProps<typeof ListItems.propTypes>;
export function ListItems({ items }: ListItemsType) {
	const listItems = items as ListItemsData[];

	return (
		<div className="list-items">
			{listItems.map((item, index) => (
				<div className="list-item" key={`${String(item.title ?? "item")}-${index}`}>
					<h2 className="list-item-title">{String(item.title)}</h2>
					<ul>
						{Object.entries(item)
							.filter(([key]) => key !== "title")
							.map(([key, value]) => (
								<li key={key}>
									{key}:{" "}
									{Array.isArray(value) && value.length > 1 ? (
										<ul>
											{value.map((item, valueIndex) => (
												<li key={`${String(item)}-${valueIndex}`}>{String(item)}</li>
											))}
										</ul>
									) : String(Array.isArray(value) ? value[0] ?? "" : value)}
								</li>
							))}
					</ul>
				</div>
			))}
		</div>
	);
}