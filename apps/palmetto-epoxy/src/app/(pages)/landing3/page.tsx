 
"use client"; 

import * as CalloutLibrary from "@/app/elements/calloutlibrary";
import { Callout } from "@pixelated-tech/components";
// import { ContentfulReviewsCarousel } from "@pixelated-tech/components";
import { PageSection, PageSectionHeader, PageGridItem } from "@pixelated-tech/components";
import { FacebookPixel, FormEngine, getFacebookAttributionData } from "@pixelated-tech/components";
import formData from "@/app/data/contactform.json";

formData.fields.find((field) => field.props?.name === "to")!.props.value = "brian.whaley@gmail.com";

export default function Landing3Page() {
    
	const trackLead = () => {
		if (typeof window === "undefined") return;
		const fbq = (window as Window & {
            fbq?: (...args: unknown[]) => void;
        }).fbq;
		if (typeof fbq !== "function") return;
		const attributionData = getFacebookAttributionData();
		fbq("trackCustom", "ContactSubmit", attributionData);
		fbq("track", "Lead", attributionData);
	};

	return (
		<div id="landing3-page">

			<CalloutLibrary.PageTitle title="Palmetto Epoxy" />

			<PageSection columns={3} maxWidth="1024px" id="landing-3-section">

				<PageGridItem columnStart={1} columnEnd={-1}>
					<PageSectionHeader title="LOWCOUNTRY'S PREMIER EPOXY  AND CONCRETE SPECIALIST" />
				</PageGridItem>

				<PageGridItem columnStart={1} columnEnd={3}>
					<div className="contact-us-wrapper">
						<PageSectionHeader title="Contact Us For a Free Quote" />
						<div>
                            Please fill out the form below. 
                            We would LOVE to answer any questions or to setup 
                            an appointment to talk about our favorite subject… 
                            Epoxy Flooring! 
							<br /><br /><br /><br />
						</div>
						<FacebookPixel pixelId="2272268106901362" />
						<FormEngine formData={formData} onSuccess={trackLead} />
					</div>
				</PageGridItem>

				<PageGridItem>
					<Callout
						layout='vertical'
						img='https://images.ctfassets.net/0b82pebh837v/5TwheBNh6MYOrxKHSmGtbF/bb2f8512d1eeeff6ace108e0da5798b4/595227417_1426058442860777_4196327792176917288_n_v2.jpg?fm=webp'
						title="Epoxy" />

					<Callout
						layout='vertical' 
						img='https://images.ctfassets.net/0b82pebh837v/6DVnMXkegjtf8hJoPoj3PJ/b2270332d1136dc6a559c7df8cbe70b3/image-asset.jpeg?fm=webp'
						title='Polished Concrete' />

					<Callout
						layout='vertical' 
						img='https://images.ctfassets.net/0b82pebh837v/7fRzxBO5FYaxHAWTg6Mkpd/7ca150775b44985748f9b33fb80e2790/IMG_8829-countertop.jpeg?fm=webp'
						title='Resin Counters' />

					<Callout
						layout='vertical' 
						img='https://images.ctfassets.net/0b82pebh837v/4XSmKyMglzHAGa3PrDrnyt/b42f90a173ca7d860acadbb0defa9eeb/IMG_6229.jpg?fm=webp'
						title='Paver Sealer' />
				</PageGridItem>

			</PageSection>

			{ /* <PageSection columns={1} maxWidth="1024px"id="home-reviews-section">
				<PageSectionHeader title="Clean, Polished Epoxy Flooring for a Space you will Love!" />
				<ContentfulReviewsCarousel
					reviewContentType="reviews"
					itemName="Epoxy Flooring Service"
					itemType="Service"
					publisherName="Palmetto Epoxy"
					maxReviews={100}
					draggable={true}
					imgFit='contain'
				/>
			</PageSection> */}

		</div>
	);
}
