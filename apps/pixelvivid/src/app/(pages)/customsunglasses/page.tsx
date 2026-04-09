 
"use client";

import React, { useState, useEffect } from "react";
import { PageTitleHeader, PageSectionHeader, Loading } from "@pixelated-tech/components";
import { Callout } from "@pixelated-tech/components";
import * as CalloutLibrary from "@/app/elements/calloutlibrary";
import { Modal, handleModalOpen } from "@pixelated-tech/components";
import { Carousel } from "@pixelated-tech/components";
import { usePixelatedConfig } from "@pixelated-tech/components";
import { getContentfulEntriesByType, getContentfulReviewsSchema, ReviewSchema } from "@pixelated-tech/components";
// import GalleryWrapper from "@/app/elements/gallerywrapper";
import type { CarouselCardType } from "@pixelated-tech/components";
import { SmartImage } from "@pixelated-tech/components";

export default function CustomSunglasses() {
	const pixelatedConfig = usePixelatedConfig();

	if (!pixelatedConfig) {
		return <Loading />;
	}

	const cloudinaryAPI = "https://res.cloudinary.com/dlbon7tpq/image/fetch/f_auto,q_auto/";
	const [modalContent, setModalContent] = useState<NonNullable<React.ReactNode>>(<></>);
	const handleImageClick = (event: React.MouseEvent, url: string) => {
		const myContent = <div className="modal-image-container">
			<SmartImage src={url} alt="Modal Image" />
		</div>;
		setModalContent(myContent);
		handleModalOpen(event.nativeEvent);
  	};

	const [ carouselCards , setCarouselCards ] = useState<CarouselCardType[]>([]);
	const [ reviewSchemas , setReviewSchemas ] = useState<any[]>([]);
	const apiProps = {
		base_url: pixelatedConfig?.contentful?.base_url || "",
		space_id: pixelatedConfig?.contentful?.space_id || "",
		environment: pixelatedConfig?.contentful?.environment || "",
		delivery_access_token: pixelatedConfig?.contentful?.delivery_access_token || "",
	};
	useEffect(() => {
		async function getCarouselCards() {
			const contentType = "feedback"; 
			const typeCards = await getContentfulEntriesByType({ apiProps: apiProps, contentType: contentType }); 
			const items = typeCards.items.filter((card: any) => card.sys.contentType.sys.id === contentType);
			const cardLength = items.length;
			const reviewCards = items.map(function (card: any, index: number) {
				return {
					headerText: card.fields.description,
					bodyText: card.fields.reviewer,
					index: index,
					cardIndex: index,
					cardLength: cardLength,
				};
			});
			setCarouselCards(reviewCards);
			
			const schemas = await getContentfulReviewsSchema({
				apiProps: apiProps,
				itemName: "PixelVivid Custom Sunglasses",
				itemType: "Service",
				publisherName: "PixelVivid"
			});
			setReviewSchemas(await schemas);
		}
		getCarouselCards();
	}, []);

	return (
		<>
			<section id="customs-section">
				<div className="section-container">
					<PageTitleHeader title="Custom Painted Sunglasses by PixelVivid" />
					<div className="row-3col">
						<div className="grid-item">
							<CalloutLibrary.sunglassStore />
						</div>
						<div className="grid-item">
							<CalloutLibrary.subscribe />
						</div>
						<div className="grid-item">
							<CalloutLibrary.specialOrder />
						</div>
					</div>
				</div>
			</section>


			<section style={{backgroundColor: "var(--accent1-color)"}} id="gallery-section">
				<div className="section-container">
					<Callout
						variant='boxed'
						layout='horizontal'
						url='/customsgallery'
						img='/images/customs/blue-holo-hex.jpg' 
						imgAlt="Custom Sunglasses Gallery" 
						title='Custom Sunglasses Gallery' 
						content='Visit the PixelVivid Custom Sunglasses Gallery You will see 
						unique, hand-painted designs of all colors and styles.  
						These include Marbles, Splatters, Drips, Fades, Confetti, Linears, repairs, working photos and more.  
						Styles can be applied to a variety of frames including 
						Oakley, Ray-Ban, Costa del Mar, Maui Jim, and more.'  />
				</div>
			</section>


			<section className="section" id="styles-section">
				<div className="section-container">
					<PageSectionHeader title="Color Styles" />
					<div className="row-4col">
						<div className="grid-item">
							<Callout
								layout='vertical'
								img='/images/customs/camo-marble.jpg' 
								imgShape='round' 
								imgAlt="Marbles" 
								title='Marbles' 
								content='Customized glasses with mottled streaks of color.  
									Custom marbled paint can be done with a number of complimentary colors, one single color, 
									with metallics, lographic or colorshift paints, or even with clear candy colors.'  />
						</div><div className="grid-item">
							<Callout
								// url='https://farm66.static.flickr.com/65535/50652292218_3df2a75475_b.jpg'
								img='/images/customs/blue-splatter-3.jpg'
								title='Splatters'
								content='This style is customized with a splash of colors.  
									Custom splatter paint can be one color, or a combination of complimentary colors.  
									Splatters can also be small or large, thin or thick, dense or sparse. '
								layout='vertical' 
								imgShape='round' />
						</div><div className="grid-item">
							<Callout
								// url='https://farm66.static.flickr.com/65535/51062706291_097827a69d_b.jpg'
								img='/images/customs/neon-drip.jpg'
								title='Drips'
								content='This style is customized with color dripped all over the frame.  
									Dripping paint can be one color, or a combination of complimentary colors.  
									It can also be done with the drips dense or sparse. '
								layout='vertical' 
								imgShape='round' />
						</div><div className="grid-item">
							<Callout
								// url='https://farm66.static.flickr.com/65535/51062706291_097827a69d_b.jpg'
								img='/images/customs/blended-fade.jpg'
								title='Fades'
								content='This style can be used on its own, or as a base for other styles like Drips or Splatters.  
									The fade can be solid colors, metallics, or candy colors.  Candy fades look especially great on clear frames.  
									The fade can be on part of the frame or end-to-end, can be one color or many, translucent or opaque. '
								layout='vertical' 
								imgShape='round' />
						</div><div className="grid-item">
							<Callout
								// url='https://farm66.static.flickr.com/65535/51062706291_097827a69d_b.jpg'
								img='/images/customs/green-confetti.jpg'
								title='Confetti'
								content='This style is customized with individual dots of color individually painted all over the frame.  
									The dots paint can be one color, complimentary colors, or any color pattern you choose.  
									It can also be done with confetti dots large or small, and dense or sparse. '
								layout='vertical' 
								imgShape='round' />
						</div><div className="grid-item">
							<Callout
								// url='https://farm66.static.flickr.com/65535/51062706291_097827a69d_b.jpg'
								img='/images/customs/fire-red-linear.jpg'
								title='Linears'
								content='This style is customized with individual lines of color individually drawn all over the frame.  
									The lines can paint can be one color, a combination of complimentary colors, or a variety of colors of your preference.  
									It can also be done with the lines dense or sparse. '
								layout='vertical' 
								imgShape='round' />
						</div><div className="grid-item">
							<Callout
								// url='https://farm66.static.flickr.com/65535/51062706291_097827a69d_b.jpg'
								img='/images/customs/holo-fade-drip-splatter.jpg'
								title='Your Choice'
								content='Combine styles and colors to create your own custom look - fades, drips, splatters, confetti, marbles, linears, 
									all done in your choice pof paint - neon, metallics, colorshift, holographic, candy clears, and more.  
									Contact us with your ideas and we will work with you to create a one-of-a-kind pair of custom sunglasses. '
								layout='vertical' 
								imgShape='round' />
						</div><div className="grid-item">
							<Callout
								// url='https://farm66.static.flickr.com/65535/50652294433_b48c9ef0e4_b.jpg'
								img='/images/customs/repair-nose.jpg'
								title='Repairs'
								content='Reinforced with metal strips and glued back together.  
									A new custom coat of paint is recommended after a repair to ensure color match.'
								layout='vertical' 
								imgShape='round' />
						</div>
					</div>
				</div>
			</section>


			<section style={{backgroundColor: "var(--accent1-color)"}} id="feedback-section">
				<div className="section-container">
					<PageSectionHeader title="Customer Feedback" />
					{reviewSchemas.map((review, idx) => (
						<ReviewSchema key={idx} review={review} />
					))}
					<Carousel 
						cards={carouselCards} 
						draggable={false}
						imgFit='contain' />
				</div>
			</section>


			<section className="section" id="examples-section">
				<div className="section-container">
					<PageSectionHeader title="Color Examples" />
					<div className="row-6col">
							
						<div className="grid-item">
							<Callout variant="full" layout="vertical" url={cloudinaryAPI + "https://farm66.static.flickr.com/65535/50797219348_a7f5b18dd5_b.jpg"} 
								imgClick={handleImageClick} 
								img="/images/customs/black-white-splatter.jpg" imgAlt="Black White Splatter" subtitle="Black & White" imgShape="squircle" />
						</div>
						<div className="grid-item">
							<Callout variant="full" layout="vertical" url={cloudinaryAPI + "https://farm66.static.flickr.com/65535/50652292218_3df2a75475_b.jpg"} 
								imgClick={handleImageClick} img="/images/customs/blue-splatter-3.jpg" imgAlt="Blue Splatter" subtitle="Winter Blue" imgShape="squircle" />
						</div>
						<div className="grid-item">
							<Callout variant="full" layout="vertical" url={cloudinaryAPI + "https://farm66.static.flickr.com/65535/50653036651_8cc8ec0a1c_b.jpg"} 
								imgClick={handleImageClick} img="/images/customs/gold-silver-splatter.jpg" imgAlt="Gold Silver Splatter" subtitle="Gold & Silver" imgShape="squircle" />
						</div>
						<div className="grid-item">
							<Callout variant="full" layout="vertical" url={cloudinaryAPI + "https://farm66.static.flickr.com/65535/50664254938_bb746893d0_b.jpg"} 
								imgClick={handleImageClick} img="/images/customs/neon-splatter.jpg" imgAlt="Neon Splatter" subtitle="Neon Splatter" imgShape="squircle" />
						</div>
						<div className="grid-item">
							<Callout variant="full" layout="vertical" url={cloudinaryAPI + "https://farm66.static.flickr.com/65535/50653037331_449ba8cece_b.jpg"} 
								imgClick={handleImageClick} img="/images/customs/blue-marble.jpg" imgAlt="Blue Marble" subtitle={"Cobalt / Planet X"} imgShape="squircle" />
						</div>
						<div className="grid-item">
							<Callout variant="full" layout="vertical" url={cloudinaryAPI + "https://farm66.static.flickr.com/65535/50653126162_1479ff31f5_b.jpg"} 
								imgClick={handleImageClick} img="/images/customs/camo-marble.jpg" imgAlt="Camo Marble" subtitle="Camo Marble" imgShape="squircle" />
						</div>
						<div className="grid-item">
							<Callout variant="full" layout="vertical" url={cloudinaryAPI + "https://farm66.static.flickr.com/65535/50755818913_37cdca4924_b.jpg"} 
								imgClick={handleImageClick} img="/images/customs/neon-marble.jpg" imgAlt="Neon Marble" subtitle="Neon Marble" imgShape="squircle" />
						</div>
						<div className="grid-item">
							<Callout variant="full" layout="vertical" url={cloudinaryAPI + "https://farm66.static.flickr.com/65535/51152648154_918278d13f_b.jpg"} 
								imgClick={handleImageClick} img="/images/customs/blue-clear-drip.jpg" imgAlt="Blue Frost Clear Drip" subtitle="Blue Frost" imgShape="squircle" />
						</div>
						<div className="grid-item">
							<Callout variant="full" layout="vertical" url={cloudinaryAPI + "https://farm66.static.flickr.com/65535/51152648149_1194b3d58d_b.jpg"} 
								imgClick={handleImageClick} img="/images/customs/green-gold-drip-2.jpg" imgAlt="Irish Green Gold Drip" subtitle="Irish Gold" imgShape="squircle" />
						</div>
						<div className="grid-item">
							<Callout variant="full" layout="vertical" url={cloudinaryAPI + "https://farm66.static.flickr.com/65535/50920141601_54c8c15e8f_b.jpg"} 
								imgClick={handleImageClick} img="/images/customs/neon-marble-clear.jpg" imgAlt="Neon Marble Candy Clear" subtitle="Neon Candy" imgShape="squircle" />
						</div>
						<div className="grid-item">
							<Callout variant="full" layout="vertical" url={cloudinaryAPI + "https://farm66.static.flickr.com/65535/51370100893_fc70898a3d_b.jpg"} 
								imgClick={handleImageClick} img="/images/customs/neon-splatter-3.jpg" imgAlt="Neon Splatter" subtitle="Neon Splatter" imgShape="squircle" />
						</div>
						<div className="grid-item">
							<Callout variant="full" layout="vertical" url={cloudinaryAPI + "https://farm66.static.flickr.com/65535/53229618619_16517610cd_b.jpg"} 
								imgClick={handleImageClick} img="/images/customs/blended-fade.jpg" imgAlt="Blended Fade" subtitle="Blended" imgShape="squircle" />
						</div>
						<div className="grid-item">
							<Callout variant="full" layout="vertical" url={cloudinaryAPI + "https://farm66.static.flickr.com/65535/54784796846_b4d78b2392_b.jpg"} 
								imgClick={handleImageClick} img="/images/customs/galaxy.jpg" imgAlt="Galaxy" subtitle="Galaxy" imgShape="squircle" />
						</div>
						<div className="grid-item">
							<Callout variant="full" layout="vertical" url={cloudinaryAPI + "https://farm66.static.flickr.com/65535/51272602619_d46db46cff_b.jpg"} 
								imgClick={handleImageClick} img="/images/customs/red-white-blue-splatter.jpg" imgAlt="Red White Blue Splatter" subtitle="Red White Blue" imgShape="squircle" />
						</div>
						<div className="grid-item">
							<Callout variant="full" layout="vertical" url={cloudinaryAPI + "https://farm66.static.flickr.com/65535/54594687134_161df8ef6f_b.jpg"} 
								imgClick={handleImageClick} img="/images/customs/rainbow-confetti.jpg" imgAlt="Rainbow Confetti" subtitle="Rainbow Confetti" imgShape="squircle" />
						</div>
						<div className="grid-item">
							<Callout variant="full" layout="vertical" url={cloudinaryAPI + "https://farm66.static.flickr.com/65535/52463376820_6fc4201c0a_b.jpg"} 
								imgClick={handleImageClick} img="/images/customs/colorshift-fade.jpg" imgAlt="ColorShift Fade" subtitle="ColorShift" imgShape="squircle" />
						</div>
						<div className="grid-item">
							<Callout variant="full" layout="vertical" url={cloudinaryAPI + "https://farm66.static.flickr.com/65535/52193578261_1ccec2384e_b.jpg"} 
								imgClick={handleImageClick} img="/images/customs/vintage-blue.jpg" imgAlt="Vintage Mumbo Blue" subtitle="Vintage Mumbo Blue" imgShape="squircle" />
						</div>
						<div className="grid-item">
							<Callout variant="full" layout="vertical" url={cloudinaryAPI + "https://farm66.static.flickr.com/65535/52235792754_f5309d7d08_b.jpg"} 
								imgClick={handleImageClick} img="/images/customs/vintage-yellow.jpg" imgAlt="Vintage Mumbo Yellow" subtitle="Vintage Mumbo Yellow" imgShape="squircle" />
						</div>
						<div className="grid-item">
							<Callout variant="full" layout="vertical" url={cloudinaryAPI + "https://farm66.static.flickr.com/65535/52253164864_3974441ee9_b.jpg"} 
								imgClick={handleImageClick} img="/images/customs/vintage-pink.jpg" imgAlt="Vintage Mumbo Pink" subtitle="Vintage Mumbo Pink" imgShape="squircle" />
						</div>
						<div className="grid-item">
							<Callout variant="full" layout="vertical" url={cloudinaryAPI + "https://farm66.static.flickr.com/65535/51062706291_097827a69d_b.jpg"} 
								imgClick={handleImageClick} img="/images/customs/neon-drip.jpg" imgAlt="Neon Drip Candy Stripe" subtitle="Candy Stripe" imgShape="squircle" />
						</div>
						<div className="grid-item">
							<Callout variant="full" layout="vertical" url={cloudinaryAPI + "https://farm66.static.flickr.com/65535/51025141073_903dab34df_b.jpg"} 
								imgClick={handleImageClick} img="/images/customs/black-rain.jpg" imgAlt="Black Rain" subtitle="Black Rain" imgShape="squircle" />
						</div>
						<div className="grid-item">
							<Callout variant="full" layout="vertical" url={cloudinaryAPI + "https://farm66.static.flickr.com/65535/51154097191_bbff7101f7_b.jpg"} 
								imgClick={handleImageClick} img="/images/customs/neon-tiger-stripe.jpg" imgAlt="Neon Tiger Stripe" subtitle="Neon Tiger" imgShape="squircle" />
						</div>
						<div className="grid-item">
							<Callout variant="full" layout="vertical" url={cloudinaryAPI + "https://farm66.static.flickr.com/65535/54817521600_2c626d6486_b.jpg"} 
								imgClick={handleImageClick} img="/images/customs/halloween.jpg" imgAlt="Halloween" subtitle="Halloween" imgShape="squircle" />
						</div>

						{/* 
						<div className="grid-item">
							<Callout variant="full" layout="vertical" url="" imgClick ={handleImageClick} img="/images/customs/btw-signature.jpg" imgAlt="Black Gold" subtitle="Black Gold" content={""} />
						</div>
						<div className="grid-item">
							<Callout variant="full" layout="vertical" url="" imgClick ={handleImageClick} img="/images/customs/btw-signature.jpg" imgAlt="Halloween" subtitle="Halloween" content={""} />
						</div>
						*/}

						{/* 
						===== Additional Examples =====
						<div className="grid-item">
							<Callout variant="full" layout="vertical" url="https://farm66.static.flickr.com/65535/50797971781_69834d1b6f_b.jpg" imgClick ={handleImageClick} img="/images/customs/brown-splatter.jpg" imgAlt="Brown Splatter" title={""} content={""} />
						</div>
						<div className="grid-item">
							<Callout variant="full" layout="vertical" url="https://farm66.static.flickr.com/65535/50756659327_c4ca8fdb52_b.jpg" imgClick ={handleImageClick} img="/images/customs/gold-silver-splatter-2.jpg" imgAlt="Gold Silver Splatter" title={""} content={""} />
						</div>
						<div className="grid-item">
							<Callout variant="full" layout="vertical" url="https://farm66.static.flickr.com/65535/50685248287_3e8ebe5201_b.jpg" imgClick ={handleImageClick} img="/images/customs/green-splatter.jpg" imgAlt="Green Splatter" title={""} content={""} />
						</div>
						<div className="grid-item">
							<Callout variant="full" layout="vertical" url="https://farm66.static.flickr.com/65535/50652294433_b48c9ef0e4_b.jpg'" imgClick ={handleImageClick} img="/images/customs/repair-nose.jpg" imgAlt="Repair Nose" title={""} content={""} />
						</div>
						<div className="grid-item">
							<Callout variant="full" layout="vertical" url="https://farm66.static.flickr.com/65535/51202265371_9830735bb9_b.jpg" imgClick ={handleImageClick} img="/images/customs/blue-drip.jpg" imgAlt="Blue Drip" title={""} content={""} />
						</div>
						<div className="grid-item">
							<Callout variant="full" layout="vertical" url="https://farm66.static.flickr.com/65535/50961082721_cb3bc6daf7_b.jpg" imgClick ={handleImageClick} img="/images/customs/camo-drip-2.jpg" imgAlt="Camo Drip" title={""} content={""} />
						</div>
						<div className="grid-item">
							<Callout variant="full" layout="vertical" url="https://farm66.static.flickr.com/65535/51062790717_0e1496d383_b.jpg" imgClick ={handleImageClick} img="/images/customs/red-drip.jpg" imgAlt="Red Drip" title={""} content={""} />
						</div>
						<div className="grid-item">
							<Callout variant="full" layout="vertical" url="https://farm66.static.flickr.com/65535/51203329450_38d7a8bf74_b.jpg" imgClick ={handleImageClick} img="/images/customs/red-white-blue-drip.jpg" imgAlt="Red White Blue Drip" title={""} content={""} />
						</div>
						*/}

					</div>
				</div>
			</section>


			<Modal modalContent={modalContent} />

		</>
	);
}
