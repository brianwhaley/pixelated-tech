import { PageSection, PageTitleHeader, ServicesSchema } from '@pixelated-tech/components';
import { Callout } from '@pixelated-tech/components';
import { SquareFeaturedItems } from '@pixelated-tech/components';
import { getSquareStoreItems } from '@pixelated-tech/components/server';
import * as componentLibrary from "../../elements/componentlibrary";

export default async function BoutiquePage() {
	let featuredItems = [];
	try {
		const storeResponse = await getSquareStoreItems({ featuredOnly: true });
		featuredItems = storeResponse?.items ?? [];
	} catch (error: any) {
		console.error('Unable to load featured boutique items:', error);
	}

	return (
		<>
			<PageSection columns={1} maxWidth="100%" id="boutique-section">
				<PageTitleHeader title="The Three Muses of Bluffton Boutique" />
				<div>
					<p>
					Our Boutique, presided over by the Muse of Celebration, is a curated treasure trove bringing the Lowcountry's artistic spirit to life through high-end, handcrafted goods. The Three Muses of Bluffton showcases exceptional local and regional artisans specializing in one-of-a-kind accessories, home decor, and bespoke gifts. Every item, from hand-stitched scarves to artisanal jewelry, is selected for superior craftsmanship and lasting beauty. By focusing on small-batch production, The Three Muses of Bluffton offers truly original pieces that reflect your personal aesthetic.
					</p>
					<p>
					The shopping experience is defined by elegance and a passion for storytelling through craft. We offer personalized services, including professional gift wrapping and custom commissions, ensuring every gift is as special as its recipient. Our expert staff provides deep insight into our rotating collection and the makers behind each piece. Because we work closely with local artisans, we can often facilitate unique modifications or custom color palettes. Visit us to experience the artistry of the human hand and discover gifts to be cherished for a lifetime.
					</p>
				</div>
			</PageSection>
			<ServicesSchema />

			<PageSection columns={1} maxWidth="1024px" id="boutique-items-section">


				<Callout
					variant="boxed grid"
					layout="horizontal"
					direction="left"
					gridColumns={{ left: 1, right: 3 }}
					title="Shop the Boutique"
					subtitle="Browse our curated local collection online."
					content="Experience the full boutique collection, hand-selected by our local artisans. Click through to shop items online and view details for each piece."
					img="https://images.ctfassets.net/luf8eony1687/rX8FOFylfPZfkOJStyV4M/79247da0e8ebf8e767325de2924cbfc7/ThreeMusesFinal-6157.jpg?fm=webp"
					url="/store"
					urlTarget="_self"
				/> 

				{ /* <Callout
					variant="boxed grid"
					layout="horizontal"
					direction="left"
					gridColumns={{ left: 1, right: 3 }}
					img="https://images.ctfassets.net/luf8eony1687/rX8FOFylfPZfkOJStyV4M/79247da0e8ebf8e767325de2924cbfc7/ThreeMusesFinal-6157.jpg?fm=webp"
					title="Check Back Soon"
					subtitle="Join Us in the store or check back here for updates on our custom Boutique Items" 
					content="Our boutique is a dynamic space that is constantly evolving with new and exciting items. We are currently in the process of curating a collection of high-end, handcrafted goods that will be available for purchase both in-store and online. We invite you to visit us in person to experience the beauty and craftsmanship of our boutique items firsthand, and we encourage you to check back here regularly for updates on our latest offerings. Whether you're looking for a unique gift or a special treat for yourself, our Boutique will soon be your go-to destination for one-of-a-kind treasures that celebrate the artistry of the Lowcountry."
				/>*/ }

			</PageSection>


			<PageSection columns={4} maxWidth="1024px" id="store-items-section">
				<SquareFeaturedItems
					items={featuredItems}
					title="Featured Boutique Items"
					intro="Discover a rotating selection of our favorite boutique pieces."
				/>
			</PageSection>


			<PageSection columns={1} maxWidth="1024px" id="boutique-consign-section">
				<componentLibrary.ConsignWithUs />
			</PageSection>

		</>
	);
}
