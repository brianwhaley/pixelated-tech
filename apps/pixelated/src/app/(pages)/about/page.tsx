import { PageSection, PageGridItem, PageSectionHeader, PageTitleHeader } from '@pixelated-tech/components';
import { BlogPostCollection } from '@pixelated-tech/components';
import { Callout } from '@pixelated-tech/components';

export default function AboutPage() {
	return (
		<>
			<PageTitleHeader title="About Us" />

			<PageSection id="pixelated-section" maxWidth="768px" columns={1}>
				<PageGridItem>
					<Callout
						aboveFold={true}
						layout='vertical' 
						imgAlt='Pixelated Technologies'
						imgShape="squircle" 
						subtitle="About Pixelated Technologies"
						content='Pixelated Technologies is a Digital Services company that specializes in transforming small businesses through custom IT solutions, including web development, social media marketing, search engine optimization, content management, eCommerce solutions, and small business modernization. Our mission is to empower small businesses to thrive in the digital age by providing tailored technology services that drive growth and efficiency.'/>
				</PageGridItem>
			</PageSection>

			<PageSection columns={8} id="about-section">
				<PageGridItem columnStart={1} columnEnd={9}>
					<Callout
						variant='boxed grid'
						layout='horizontal'
						gridColumns={{left: 1, right: 3}}
						url="/workportfolio"
						img='/images/brianwhaley-headshot.jpg'
						subtitle='About Brian Whaley'
						content='The owner of Pixelated Technologies.  I am an Information Technology leader accomplished in building and managing global high-performance teams, launching and managing digital products, and developing and executing unified product and technology strategies.  I have managed Highly available e-commerce portals, web sites, web applications, and mobile applications, in the media, finance, pharmaceutical, and telecommunications industries, leading departments up to 300 staff, budgets to $50 million, using onshore staff, offshore partners, and hybrid teams.  I am a Full Stack Developer, Passionate Technologist, Digital Transformation Professional, User Experience Champion, SEO and Social Media Ninja, Landscape and Macro Photographer, Avid World Traveler, Advanced Open Water Scuba Diver, Enthusiast of Home-Cooked Food'/>
				</PageGridItem>
			</PageSection>

			<PageSection columns={1} id="about-recent-launches-section">
				<PageSectionHeader title="Recent Launches" />
				<BlogPostCollection
					site="blog.pixelated.tech"
					postIds={[1500, 1199, 1171, 1161, 986]}
				/>
			</PageSection>
		</>
	);
}
