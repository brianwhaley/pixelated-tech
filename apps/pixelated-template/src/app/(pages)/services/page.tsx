"use client";

import { Callout, PageTitleHeader, PageSection } from "@pixelated-tech/components";

export default function About() {
    
	return (
		<>

			<PageTitleHeader title="__SITE_NAME__ Services" />

			<PageSection columns={1} maxWidth="1024px" padding="20px" id="service-section">
				<Callout
					variant="boxed grid"
					gridColumns={{left:1, right:3}}
					layout="horizontal"
					direction="left"
					img="/images/placeholder.png"
					title="Service # 1"
					content="This is where you can describe your service offering in detail.
					Highlight the key benefits and features that set your service apart from competitors.
					Explain how your expertise and experience can help clients achieve their goals.
					Include any unique methodologies, tools, or approaches you use to deliver exceptional results.
					Feel free to mention any relevant certifications, awards, or client testimonials that reinforce your credibility in this area."
				/>
				<Callout
					variant="boxed grid"
					gridColumns={{left:3, right:1}}
					layout="horizontal"
					direction="right"
					img="/images/placeholder.png"
					title="Service # 2"
					content="This is where you can describe your service offering in detail.
					Highlight the key benefits and features that set your service apart from competitors.
					Explain how your expertise and experience can help clients achieve their goals.
					Include any unique methodologies, tools, or approaches you use to deliver exceptional results.
					Feel free to mention any relevant certifications, awards, or client testimonials that reinforce your credibility in this area."
				/>
				<Callout
					variant="boxed grid"
					gridColumns={{left:1, right:3}}
					layout="horizontal"
					direction="left"
					img="/images/placeholder.png"
					title="Service # 3"
					content="This is where you can describe your service offering in detail.
					Highlight the key benefits and features that set your service apart from competitors.
					Explain how your expertise and experience can help clients achieve their goals.
					Include any unique methodologies, tools, or approaches you use to deliver exceptional results.
					Feel free to mention any relevant certifications, awards, or client testimonials that reinforce your credibility in this area."
				/>
				<Callout
					variant="boxed grid"
					gridColumns={{left:3, right:1}}
					layout="horizontal"
					direction="right"
					img="/images/placeholder.png"
					title="Service # 4"
					content="This is where you can describe your service offering in detail.
					Highlight the key benefits and features that set your service apart from competitors.
					Explain how your expertise and experience can help clients achieve their goals.
					Include any unique methodologies, tools, or approaches you use to deliver exceptional results.
					Feel free to mention any relevant certifications, awards, or client testimonials that reinforce your credibility in this area."
				/>
				<Callout
					variant="boxed grid"
					gridColumns={{left:3, right:1}}
					layout="horizontal"
					direction="right"
					img="/images/placeholder.png"
					title="Service # 4"
					content="This is where you can describe your service offering in detail.
					Highlight the key benefits and features that set your service apart from competitors.
					Explain how your expertise and experience can help clients achieve their goals.
					Include any unique methodologies, tools, or approaches you use to deliver exceptional results.
					Feel free to mention any relevant certifications, awards, or client testimonials that reinforce your credibility in this area."
				/>
				<Callout
					variant="boxed grid"
					gridColumns={{left:1, right:3}}
					layout="horizontal"
					direction="left"
					img="/images/placeholder.png"
					title="Service # 5"
					content="This is where you can describe your service offering in detail.
					Highlight the key benefits and features that set your service apart from competitors.
					Explain how your expertise and experience can help clients achieve their goals.
					Include any unique methodologies, tools, or approaches you use to deliver exceptional results.
					Feel free to mention any relevant certifications, awards, or client testimonials that reinforce your credibility in this area."
				/>
				<Callout
					variant="boxed grid"
					gridColumns={{left:3, right:1}}
					layout="horizontal"
					direction="right"
					img="/images/placeholder.png"
					title="Service # 6"
					content="This is where you can describe your service offering in detail.
					Highlight the key benefits and features that set your service apart from competitors.
					Explain how your expertise and experience can help clients achieve their goals.
					Include any unique methodologies, tools, or approaches you use to deliver exceptional results.
					Feel free to mention any relevant certifications, awards, or client testimonials that reinforce your credibility in this area."
				/>
			</PageSection>

		</>
	);
}
