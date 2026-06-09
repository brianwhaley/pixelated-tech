import { PageSection, PageSectionHeader, PageTitleHeader, PageGridItem, Callout, BlogPostList } from '@pixelated-tech/components';
// import { SquareFeaturedItems } from '@pixelated-tech/components';
// import { getSquareStoreItems } from '@pixelated-tech/components/server';
import * as componentLibrary from '../../elements/componentlibrary';

// This page is intentionally a server component so it can fetch featured boutique
// items before render. BlogPostList remains a client component and will fetch
// its WordPress content on the client using the configured `wordpress.site`
// value from pixelated config if no explicit `posts` prop is supplied.

export default async function Home() {
	/* let featuredItems = [];
	try {
		const storeResponse = await getSquareStoreItems({ featuredOnly: true });
		featuredItems = storeResponse?.items ?? [];
	} catch (error: any) {
		console.error('Unable to load featured boutique items:', error);
	} */

	return (
		<>
			<PageSection columns={1} maxWidth="100%" id="welcome-section">
				<PageTitleHeader title="Welcome to The Three Muses of Bluffton" />
				<div>
					<p>
					Welcome to The Three Muses of Bluffton, a sanctuary where classical artistry meets Lowcountry craftsmanship. Our studio nurtures your creative spirit through three distinct pillars: professional dancewear and expert pointe shoe fittings, comprehensive sewing classes and high-end alterations, and a curated boutique of artisanal treasures. Whether you are preparing for a debut recital, tailoring a cherished garment, or seeking a bespoke gift for a special milestone, we provide a community-centered atmosphere where artistry is sewn into every stitch. Experience a unique destination where grace is found in every step.
					</p>
				</div>
			</PageSection>

			<PageSectionHeader title="Our Services" />
			<PageSection columns={3} maxWidth="100%" id="home-services-section">

				<PageGridItem>
					<Callout
						variant="grid"
						layout="vertical"
						img="/images/logo/muse1-terpsichore.png"
						url="/dancewear"
						title="The Spirit of the Dance"
						subtitle="The Muse of Dance" 
						content="Grace meets performance at the barre. Whether you are preparing for your first recital or your final curtain call, we offer premium leotards, pointe shoes, and essentials designed to move with you. Step into confidence with dancewear that feels as good as it looks."
						buttonText="Explore Our Dancewear Collection"
					/>
				</PageGridItem>

				<PageGridItem>
					<Callout
						variant="grid"
						layout="vertical"
						img="/images/logo/muse2-erato.png"
						url="/sewing"
						title="The Heart of the Stitch"
						subtitle="The Muse of Craft & Creation"
						content="Precision is an art form. We celebrate the rhythm of the needle through our expert alteration services and hands-on sewing classes. From tailoring your favorite garment to teaching you the skills to create your own, we find the beauty in every stitch."
						buttonText="Learn to Sew & Book Alterations"
					/>
				</PageGridItem>

				<PageGridItem>
					<Callout
						variant="grid"
						layout="vertical"
						img="/images/logo/muse3-thalia.png"
						url="/boutique"
						title="The Joy of the Find"
						subtitle="The Muse of Celebration"
						content="Every gift tells a story. Our custom boutique is a curated space filled with unique treasures, bespoke accessories, and handcrafted items perfect for life's special moments. Discover a gift as unique as the person receiving it."
						buttonText="Shop the Custom Boutique"
					/>
				</PageGridItem>

			</PageSection>

			{ /* <PageSection columns={4} maxWidth="1024px" id="store-items-section">
				<SquareFeaturedItems
					items={featuredItems}
					title="Featured Boutique Items"
					intro="Discover a rotating selection of our favorite boutique pieces."
				/>
			</PageSection> */ }

			

			<PageSection columns={1} maxWidth="1024px" id="home-events-section">
				<componentLibrary.UpcomingSewingEvents />
			</PageSection>

		

			<PageSection columns={1} maxWidth="1024px" id="home-consign-section">
				<componentLibrary.ConsignWithUs />
			</PageSection>

			<PageSection id="social-section" columns={1} background="var(--accent1-color)" >
				<PageSectionHeader title="Read Our Most Recent Blog Post" />
				<BlogPostList count={1} showCategories={false} />
			</PageSection>
		</>
	);
}

