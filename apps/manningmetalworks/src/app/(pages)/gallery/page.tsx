import { getContentfulAssetsByTag, normalizeContentfulAssetUrl, PageSection, PageTitleHeader, Tiles } from '@pixelated-tech/components';
import { getFullPixelatedConfig } from '@pixelated-tech/components/server';


export default async function GalleryPage() {
	const pixelatedConfig = getFullPixelatedConfig();
	const contentful = pixelatedConfig.integrations?.contentful;
	const assets = await getContentfulAssetsByTag({
		apiProps: {
			base_url: contentful?.base_url ?? '',
			space_id: contentful?.space_id ?? '',
			environment: contentful?.environment ?? '',
			delivery_access_token: contentful?.delivery_access_token ?? '',
		},
		tag: 'gallery',
	});
	const imageAssets = Array.isArray(assets?.items)
		? assets.items.filter((asset: any) => asset.fields?.file?.contentType?.startsWith('image/'))
		: [];
	const galleryCards = imageAssets.map((asset: any, index: number) => ({
		index,
		cardLength: imageAssets.length,
		image: `${normalizeContentfulAssetUrl(asset.fields.file.url)}?fm=webp&q=50`,
		imageAlt: asset.fields.description || asset.fields.title || 'Manning Metalworks project',
	}));

	return (
		<>
			<PageTitleHeader title="Manning Metalworks Gallery" />
			<PageSection columns={1} maxWidth="1024px" id="gallery-section">
				<Tiles cards={galleryCards} rowCount={3} modalOnClick={true} showOverlay={false} />
			</PageSection>
		</>
	);
}
