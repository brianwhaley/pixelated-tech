"use client";

import React from "react";
import { PageSectionHeader, PageSection, PageGridItem } from "@pixelated-tech/components";
import { Callout } from "@pixelated-tech/components";

export default function SocialTags() {
	return (
		<>

        	<PageSection id="socialtag-section" columns={9} padding={"0px"}>

				<PageGridItem columnStart={1} columnEnd={-1}>
					<PageSectionHeader url="" title="Personal Social Media" />
				</PageGridItem>


			    <PageGridItem><Callout variant="full" imgShape="squircle" url="http://www.linkedin.com/in/brianwhaley" img="/images/logos/linkedin-logo.png" imgAlt="LinkedIn" title={""} content={""} /></PageGridItem>

				<PageGridItem><Callout variant="full" imgShape="squircle" url="https://github.com/brianwhaley" img="/images/logos/github-logo.png" imgAlt="Github" title={""} content={""} /></PageGridItem>

				<PageGridItem><Callout variant="full" imgShape="squircle" url="http://www.facebook.com/brian.t.whaley" img="/images/logos/facebook-logo.png" imgAlt="Facebook" title={""} content={""} /></PageGridItem>

				<PageGridItem><Callout variant="full" imgShape="squircle" url="http://www.instagram.com/brian.t.whaley" img="/images/logos/instagram-logo.png" imgAlt="Instagram" title={""} content={""} /></PageGridItem>

				<PageGridItem><Callout variant="full" imgShape="squircle" url="http://www.threads.com/brian.t.whaley" img="/images/logos/threads-logo.png" imgAlt="Threads" title={""} content={""} /></PageGridItem>

				<PageGridItem><Callout variant="full" imgShape="squircle" url="https://nextdoor.com/p/ySPZCrQQtxCq" img="/images/logos/nextdoor-logo.png" imgAlt="Nextdoor" title={""} content={""} /></PageGridItem>

				<PageGridItem><Callout variant="full" imgShape="squircle" url="http://twitter.com/brianwhaley" img="/images/logos/twitter-logo.png" imgAlt="Twitter" title={""} content={""} /></PageGridItem>

				<PageGridItem><Callout variant="full" imgShape="squircle" url="http://reddit.com/user/btw-73/saved" img="/images/logos/reddit-logo.png" imgAlt="Reddit" title={""} content={""} /></PageGridItem>

				<PageGridItem><Callout variant="full" imgShape="squircle" url="https://www.amazon.com/author/brian.t.whaley" img="/images/logos/amazon-logo.png" imgAlt="Amazon" title={""} content={""} /></PageGridItem>

				<PageGridItem><Callout variant="full" imgShape="squircle" url="https://www.goodreads.com/user/show/49377228-brian-whaley" img="/images/logos/goodreads-logo.png" imgAlt="Goodreads" title={""} content={""} /></PageGridItem>

				<PageGridItem><Callout variant="full" imgShape="squircle" url="https://patch.com/users/brian-whaley-0/articles" img="/images/logos/patch-logo.png" imgAlt="Patch" title={""} content={""} /></PageGridItem>

				<PageGridItem><Callout variant="full" imgShape="squircle" url="https://maps.app.goo.gl/j5Tpcxxr9roydxd2A" img="/images/logos/googlemaps-logo.png" imgAlt="Google Maps Travelogue" title={""} content={""} /></PageGridItem>

				<PageGridItem><Callout variant="full" imgShape="squircle" url="http://www.youtube.com/user/brianwhaley" img="/images/logos/youtube-logo.png" imgAlt="YouTube" title={""} content={""} /></PageGridItem>

				<PageGridItem><Callout variant="full" imgShape="squircle" url="http://www.pinterest.com/brianwhaley" img="/images/logos/pinterest-logo.png" imgAlt="Pinterest" title={""} content={""} /></PageGridItem>

				<PageGridItem><Callout variant="full" imgShape="squircle" url="http://pixelatedviews.tumblr.com" img="/images/logos/tumblr-logo.png" imgAlt="Feed Reader" title={""} content={""} /></PageGridItem>

				<PageGridItem><Callout variant="full" imgShape="squircle" url="https://www.etsy.com/people/bwhaley73" img="/images/logos/etsy-logo.png" imgAlt="Etsy" title={""} content={""} /></PageGridItem>

				<PageGridItem><Callout variant="full" imgShape="squircle" url="http://trees.ancestry.com/tree/7237865" img="/images/logos/ancestry-logo.jpg" imgAlt="Ancestry" title={""} content={""} /></PageGridItem>

			</PageSection>

		</>
	);
}