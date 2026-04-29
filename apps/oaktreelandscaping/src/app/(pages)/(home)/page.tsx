"use client";

import React, { useState, useEffect } from 'react';
import { PageSection, PageGridItem, PageSectionHeader, BusinessFooter, usePixelatedConfig } from "@pixelated-tech/components";
import { Callout } from "@pixelated-tech/components";
import { BlogPostList , type BlogPostType, getCachedWordPressItems } from '@pixelated-tech/components';
import { ToggleLoading } from '@pixelated-tech/components';
import { MicroInteractions } from '@pixelated-tech/components';
import siteConfig from "@/app/data/siteconfig.json";
const siteInfo = (siteConfig as any).siteInfo;

const wpSite = "blog.oaktree-landscaping.com";

export default function Home() {
	const config = usePixelatedConfig();
	const googleMapsApiKey = config?.googleMaps?.apiKey ?? undefined;

	const [ wpPosts, setWpPosts ] = useState<BlogPostType[]>([]);
	useEffect(() => {
		ToggleLoading({show: true});
		(async () => {
			const posts = await getCachedWordPressItems({ site: wpSite, count: 1 }); // 1 week
			setWpPosts(posts ?? []);
			ToggleLoading({show: false});
		})();
	}, []);


	useEffect(() => {
		MicroInteractions({ 
			scrollfadeElements: '.tile , .blog-post-summary, .scroll-fade-element',
		});
	}, []); 
	
		
    
	return (
		<>

			<PageSection columns={1} maxWidth="1024px" padding="20px" id="home-section">
				<Callout 
					variant="split"
					direction="left"
					// img="https://www.bednarlandscape.com/wp-content/uploads/2023/12/bednar-portfolio-07.jpg"
					img="https://images.ctfassets.net/h791s4nkwi9z/4O8TMN4425q2m6TMjq3Dca/0d60ed6dc4dfbb30837b755a4420d5ac/natural-grass-close-up.jpg"
					aboveFold={true}
					title="Welcome to Oaktree Landscaping"
					subtitle="Outstanding Landscapes and Breathtaking Results"
					content="With over 7 years of experience in the landscape industry, 
					our company has become a trusted name in creating exquisite 
					landscapes and maintaining lush lawns in the local area
					for both Residential and Commercial properties.  
					We take immense pride in our work, and our dedication to 
					excellence is evident in every project we undertake. 
					At our company, we understand that every customer is unique, 
					with their own distinct vision and preferences. 
					That's why we go above and beyond to tailor the 
					individual needs and desires of each client. 
					From stunning flower beds and serene water features to 
					corporate site maintenance, we pay meticulous attention to 
					detail to ensure that every element of the landscape skills 
					reflects the customer's personal style and preferences." 
				/>
			</PageSection>



			<PageSection id="social-section" columns={1} >
				<PageSectionHeader title="Read Our Most Recent Blog Post" />
				<BlogPostList site={wpSite} posts={wpPosts} count={1} showCategories={false} />
			</PageSection>



			<PageSection columns={3} id="services-section" 
				maxWidth="100%" padding="5%" gap="5%" 
				background="var(--accent1-color)">
				<PageGridItem columnStart={1} columnEnd={-1}>
					<PageSectionHeader title="Commercial & Residential Services" />
				</PageGridItem>
				<PageGridItem>
					<Callout 
						variant="overlay"
						url="/services#callout-lawn-care"
						// img="https://media.istockphoto.com/id/2044312647/photo/professional-latino-man-using-a-riding-lawnmower-caring-for-a-park-with-a-landscaping-company.jpg?b=1&s=612x612&w=0&k=20&c=n_n3hcmZ1U3SHzwlZX-7wGElqZggxGFuVuDV7i_V9-k="
						img="https://images.ctfassets.net/h791s4nkwi9z/5EipAWtqUyBZyIXoGjRu3P/93520a3368de11f797ce3a423cc843f4/pexels-luis-negron-260501657-13630739.jpg"
						title="Lawn Care"
						buttonText="View"
					/>
				</PageGridItem>
				<PageGridItem>
					<Callout 
						variant="overlay"
						url="/services#callout-garden-care"
						// img="https://media.istockphoto.com/id/1324918160/photo/professional-gardener-trimming-hedge.jpg?b=1&s=612x612&w=0&k=20&c=PyPsxSuD3XFWk8eAmFj2I7JFxDjsS1w4AJZICRFBQ_8="
						// img="/images/stock/pexels-shvetsa-5027602.jpg"
						img="https://images.ctfassets.net/h791s4nkwi9z/5boSsCxiNMe5NC5RZxhl1Q/2ecc1d8b8c8dbfaeae47e1d38c49ae7b/worker-cutting-bush-with-hedge-shears-outdoors-closeup-gardening-tool.jpg"
						title="Garden Care"
						buttonText="View"
					/>
				</PageGridItem>
				<PageGridItem>
					<Callout 
						variant="overlay"
						url="/services#callout-hardscape"
						// img="https://www.bednarlandscape.com/wp-content/uploads/2023/12/bednar-portfolio-07.jpg"
						img="https://images.ctfassets.net/h791s4nkwi9z/4O8TMN4425q2m6TMjq3Dca/0d60ed6dc4dfbb30837b755a4420d5ac/natural-grass-close-up.jpg"
						title="Hardscape"
						buttonText="View"
					/>
				</PageGridItem>
				<PageGridItem>
					<Callout 
						variant="overlay"
						url="/services#callout-lighting"
						// img="https://media.istockphoto.com/id/157479391/photo/evening-sidewalk.webp?a=1&b=1&s=612x612&w=0&k=20&c=hhEwI_ou_3OUHtnMD7uPvp_G2mnsE9KzIzrcT2c8b_g="
						// img="/images/stock/outside-view-restaurant-cottage-night-time.jpg"
						img="https://images.ctfassets.net/h791s4nkwi9z/1j6SKy7OXQkXwZLuN1WPro/1a5c3dde8178c98950dc6206d43008e0/city-view.jpg"
						title="Lighting"
						buttonText="View"
					/>
				</PageGridItem>
				<PageGridItem>
					<Callout 
						variant="overlay"
						url="/services#callout-irrigation"
						// img="https://media.istockphoto.com/id/1336134773/photo/nozzle-automatic-lawn-watering-macro-close-up.webp?a=1&b=1&s=612x612&w=0&k=20&c=-486z3g7B7ANj9mJNdODqiSY20brS4qadCVTq005NwM="
						img="https://images.ctfassets.net/h791s4nkwi9z/77H7t1IuFc9FjKMXn72pbu/eee4e3dfb01eea84a5ea45bb8c3841f0/automatic-sprinkler-lawn-watering-system-sprays-water-circle-lawn-summer-day.jpg"
						title="Irrigation"
						buttonText="View"
					/>
				</PageGridItem>
				<PageGridItem>
					<Callout 
						variant="overlay"
						url="/services#callout-tree-services"
						// img="https://media.istockphoto.com/id/457790295/photo/tree-service-arborist-pruning-trimming-cutting-diseased-branches-with-chainsaw.jpg?s=612x612&w=0&k=20&c=0prSggo7LM7guW7-X3NDj8xq_eRqz6kA0MofEefTuK8="
						img="https://images.ctfassets.net/h791s4nkwi9z/4ZD7kOExWrsam0kmJOsx4I/ecb691bdefbd8d936635f7af37970971/asian-man-cutting-trees-using-electrical-chainsaw.jpg"
						title="Tree Services"
						buttonText="View"
					/>
				</PageGridItem>
			</PageSection>

			<PageSection maxWidth="1024px" id="service-area-section" columns={1}>
				<BusinessFooter siteInfo={siteInfo} googleMapsApiKey={googleMapsApiKey} />
			</PageSection>
		</>
	);
}
