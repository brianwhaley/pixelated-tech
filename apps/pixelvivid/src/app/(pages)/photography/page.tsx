"use client";

import React, { useState, useEffect } from "react";
import { PageTitleHeader, Loading } from "@pixelated-tech/components";
import { Callout } from "@pixelated-tech/components";
import { Carousel, FlickrWrapper, usePixelatedConfig } from "@pixelated-tech/components";
import type { CarouselCardType } from "@pixelated-tech/components";

export default function Photography() {
	const pixelatedConfig = usePixelatedConfig();

	if (!pixelatedConfig) {
		return <Loading />;
	}

	const [ flickrCards, setFlickrCards ] = useState<CarouselCardType[]>([]);
	const props = { 
		api_key: pixelatedConfig?.flickr?.urlProps.api_key || "",
		user_id: pixelatedConfig?.flickr?.urlProps.user_id || "",
		tags: "", // "pixelatedviewsgallery"
		method: "flickr.photosets.getPhotos", 
		photoset_id: "72157712416706518",
		photoSize: "Large", 
		callback: setFlickrCards 
	};
	useEffect(() => {
		async function fetchGallery() {
			await FlickrWrapper(props);
		}
		fetchGallery();
	}, []); 
    
	return (
		<>
			<section id="gallery-section">
				<div className="section-container">
					<PageTitleHeader title="PixelVivid Photography" />
					<Carousel 
						cards={flickrCards} 
						draggable={true}
						imgFit="contain" />
				</div>
			</section>

			<div className="section-container">
				<div className="row-4col">
					<Callout
						layout='vertical'
						url="https://secure.istockphoto.com/portfolio/brianwhaley" 
						img='/images/logos/istock-logo.jpg'
						imgShape='squircle'
						title='iStockPhoto'
						content='I have converted my passion of Landscape, Macro, and Travel Photography 
							into a budding Stock Photography Portfolio.  Check out my work on 
							iStockPhoto or ShutterStock. 
							iStock is the original stock content site created by creatives for creatives. 
							They offer unique images and videos that connect with your audience, 
							at prices that fit your budget. Check out my work on iStockPhoto.'  />
					<Callout
						layout='vertical'
						url='http://www.shutterstock.com/g/brianwhaley' 
						img='/images/logos/shutterstock-logo.png'
						imgShape='squircle'
						title='ShutterStock'
						content='Shutterstock helps creative professionals from all backgrounds 
							and businesses of all sizes produce their best work 
							with incredible content and innovative tools, all on one platform.  
							Check out my work on iStockPhoto.'  />
					<Callout
						layout='vertical'
						url="http://www.blurb.com/user/brianwhaley" 
						img='/images/logos/blurb-logo.png'
						imgShape='squircle'
						title='Blurb'
						content="Blurb is a self-publishing and marketing platform that unleashes 
							the creative genius inside everyone. 
							Blurb's platform makes it easy to design, publish, promote, and sell 
							professional-quality printed books and ebooks.  
							Check out the books I have published on Blurb."  />
					<Callout
						layout='vertical'
						url="http://brianwhaley.shutterfly.com/" 
						img='/images/logos/shutterfly-logo.png'
						imgShape='squircle'
						title='ShutterFly'
						content='The Shutterfly family of brands together make up a leading 
							e-commerce company purpose-built for personalized products and custom design. 
							Head over to Shutterfly to see my published books.'  />
					<Callout
						layout='vertical'
						url="http://twitter.com/pixelatedviews" 
						img='/images/logos/x-logo.png'
						imgShape='squircle'
						title='X (Twitter)'
						content='Twitter, now known as X, is a microblogging and social networking service 
							where users share short text messages, images, and videos.  
							I regularly post on X updates on projects, articles on industry trends, product reviews, 
							cool artists or events, and much more.  '  />
					<Callout
						layout='vertical' 
						url="https://500px.com/brianwhaley" 
						img='/images/logos/500px-logo.png'
						imgShape='squircle'
						title='500px'
						content="500px is a global online platform for photographers to discover, share, and sell their work. 
							It's a community-focused site that allows users to showcase their photography and connect with other creatives. 
							Log into 500px to see my photos and share in the community." />
					<Callout
						layout='vertical' 
						url="http://www.flickr.com/photos/brianwhaley/" 
						img='/images/logos/flickr-logo.png'
						imgShape='squircle'
						title='Flickr'
						content='Flickr is a free, ad-supported photo-sharing service and online community 
							for photographers, offering a platform to upload, organize, share, and discover photos.
							I use Flickr not only to share and store my photos, 
							i use it as an easy integration into carousels and image hosting. ' />
					<Callout
						layout='vertical'
						url="https://www.instagram.com/pixelated.views/" 
						img='/images/logos/instagram-logo.jpg'
						imgShape='squircle'
						title='Instagram'
						content="Instagram is a free, online photo and video sharing app and social network platform. 
							It allows users to share photos and videos with their followers, 
							like and comment on posts, and engage in a variety of features 
							like Stories, Reels, and direct messaging. 
							I 'gram, do you?"  />
				</div>
			</div>
		</>
	);
}
