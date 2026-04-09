"use client";

import React from "react";
import { Callout } from "@pixelated-tech/components";

export default function Social() {
	return (
		<div className="section-container">
			<div className="rowfix-10col">
				<div className="grid-s1-e7">
					<div className="rowfix-6col">
						<div className="grid-item"><Callout variant="full" layout="vertical" imgShape="squircle" url="https://www.facebook.com/palmettoepoxy/" img="/images/logos/facebook-logo.png" imgAlt="Facebook" /></div>
						<div className="grid-item"><Callout variant="full" layout="vertical" imgShape="squircle" url="https://www.instagram.com/palmetto_epoxy/" img="/images/logos/instagram-logo.jpg" imgAlt="Instagram" /></div>
						<div className="grid-item"><Callout variant="full" layout="vertical" imgShape="squircle" url="https://x.com/palmetto_epoxy" img="/images/logos/x-logo.png" imgAlt="X (Twitter)" /></div>
						<div className="grid-item"><Callout variant="full" layout="vertical" imgShape="squircle" url="https://www.youtube.com/@PalmettoEpoxy" img="/images/logos/youtube-logo.png" imgAlt="Youtube" /></div>
						<div className="grid-item"><Callout variant="full" layout="vertical" imgShape="squircle" url="https://www.yelp.com/biz/palmetto-epoxy-bluffton" img="/images/logos/yelp-logo.png" imgAlt="Yelp" /></div>
						<div className="grid-item"><Callout variant="full" layout="vertical" imgShape="squircle" url="https://www.reddit.com/user/palmettoepoxy/" img="/images/logos/reddit-logo.png" imgAlt="Reddit" /></div>
					</div>
				</div>
				<div className="grid-s7-e12">
					<div className="rowfix-5col">
						<div className="grid-item"><Callout variant="full" layout="vertical" imgShape="squircle" url="https://nextdoor.com/pages/palmetto-epoxy-bluffton-sc/" img="/images/logos/nextdoor-logo.png" imgAlt="Nextdoor" /></div>
						<div className="grid-item"><Callout variant="full" layout="vertical" imgShape="squircle" url="https://www.houzz.com/hznb/professionals/flooring-contractors/palmetto-epoxy-pfvwus-pf~1171449525" img="/images/logos/houzz-logo.jpg" imgAlt="Houzz" /></div>
						<div className="grid-item"><Callout variant="full" layout="vertical" imgShape="squircle" url="https://patch.com/south-carolina/bluffton-sc/business/listing/572595/palmetto-epoxy" img="/images/logos/patch-logo.png" imgAlt="Patch" /></div>
						<div className="grid-item"><Callout variant="full" layout="vertical" imgShape="squircle" url="https://www.votedlowcountrysbest.com/listing/palmetto-epoxy.html" img="/images/logos/lowcountrysbest-logo.jpg" imgAlt="Lowcountrys Best" /></div>
						<div className="grid-item"><Callout variant="full" layout="vertical" imgShape="squircle" url="https://bni-sclowcountry.com/en-US/memberdetails?encryptedMemberId=nF5nozAX3%2BzPl0hTaNt4zQ%3D%3D" img="/images/logos/bni-logo.png" imgAlt="BNI" /></div>
					</div>
				</div>
			</div>
		</div>
	);
}
