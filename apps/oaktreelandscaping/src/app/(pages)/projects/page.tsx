import React from "react";
import { getContentfulEntriesByType, getContentfulImagesFromEntries, ProjectsClient, PageTitleHeader, ProjectTilesType } from "@pixelated-tech/components";
import { getFullPixelatedConfig } from "@pixelated-tech/components/server";

export default async function ProjectsPage() {
	const cfg = getFullPixelatedConfig();
	const apiProps = {
		base_url: cfg.contentful?.base_url ?? "",
		space_id: cfg.contentful?.space_id ?? "",
		environment: cfg.contentful?.environment ?? "",
		delivery_access_token: cfg.contentful?.delivery_access_token ?? "",
	};

	const contentType = "4upe5EGYMjJulOSqyXJsuw";
	const typeCards = await getContentfulEntriesByType({ apiProps, contentType });
	const projectCards: ProjectTilesType[] = [];
	let cardCount = 0;
	for (const card of typeCards.items) {
		if (card.sys.contentType.sys.id == contentType) {
			cardCount++;
			let images: any[] = [];
			if (card.fields.images && card.fields.images.length > 0) {
				images = await getContentfulImagesFromEntries({ images: [...card.fields.images], assets: typeCards.includes?.Asset ?? [] });
				images = images.map((img: any, index: number) => {
					const imgUrl = img.image.startsWith("//images.ctfassets.net")
						? img.image.replace("//images.ctfassets.net", "https://images.ctfassets.net")
						: img.image;
					return {
						index: 100 * cardCount + index,
						cardIndex: index,
						cardLength: images.length,
						image: imgUrl,
						imageAlt: img.imageAlt ?? "",
					};
				});
			}
			projectCards.push({
				title: card.fields.title ?? "",
				description: card.fields.description ?? "",
				tileCards: images ?? [],
			});
		}
	}

	// projectCards.sort((a, b) => (a.title > b.title ? -1 : 1));

	projectCards.sort((a, b) => {
		const aIsNum = /^\d/.test(a.title);
		const bIsNum = /^\d/.test(b.title);
		// 1. If one starts with a number and the other doesn't
		if (aIsNum && !bIsNum) return -1; // 'a' (number) comes first
		if (!aIsNum && bIsNum) return 1;  // 'b' (number) comes first
		// 2. If both are the same type, sort descending
		if (aIsNum && bIsNum) {
			// For numeric value comparison (e.g., 30 > 10 > 2)
			return parseFloat(b.title) - parseFloat(a.title);
		}
		// For alphabetical descending (e.g., banana > apple)
		return b.title.localeCompare(a.title);
	});

	return (
		<>
			<PageTitleHeader title="Oaktree Landscaping Projects" />
			<ProjectsClient projects={projectCards} />
		</>
	);
}


