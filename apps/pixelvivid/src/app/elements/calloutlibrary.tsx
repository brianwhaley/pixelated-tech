import { Callout, CalloutType } from "@pixelated-tech/components";

export type CalloutLibraryType = {
	variant?: CalloutType["variant"];
	gridColumns?: CalloutType["gridColumns"];
	layout?: CalloutType["layout"];
	direction?: CalloutType["direction"];
};

export function customSunglasses(props: CalloutLibraryType) {
	return (
		<Callout
			variant={props.variant || undefined}
			aboveFold={true}
			gridColumns={props.gridColumns || undefined}
			layout={props.layout || 'vertical'}
			direction={props.direction || undefined}
			url='/customsunglasses' 
			img='/images/customs/blue-splatter-3.jpg'
			imgShape='squircle'
			title='Customized Sunglasses'
			content='PixelVivid sunglasses offer a wide variety of 
                activewear sunglasses with color splashed, marbled, splattered, 
                dripped and pixeled! Oakley frames are our favorite glasses 
                to paint but we can paint on almost any brand. ' />
	);
}

export function photography(props: CalloutLibraryType) {
	return (
		<Callout
			variant={props.variant || undefined}
			aboveFold={true}
			gridColumns={props.gridColumns || undefined}
			layout={props.layout || 'vertical'} 
			direction={props.direction || undefined}
			url='/photography' 
			img='https://farm6.staticflickr.com/5682/21652998256_7c5d0ce495_b.jpg'
			imgShape='squircle'
			title='Stock Photography'
			content='I have converted my passion of Landscape, Macro, and Travel Photography 
            into a budding Stock Photography Portfolio.  Check out my work on 
            iStockPhoto or ShutterStock, or see my books on Blurb or Shutterfly. '/>
	);
}

export function homeDesign(props: CalloutLibraryType) {
	return (
		<Callout
			variant={props.variant || undefined} 
			gridColumns={props.gridColumns || undefined}
			layout={props.layout || 'vertical'}
			direction={props.direction || undefined}
			url='/homedesign' 
			img='https://farm66.static.flickr.com/65535/54513221006_5d2117cdf3_b.jpg'
			imgShape='squircle'
			title='Home Design & Remodeling'
			content='We design a holistic plan for interior and exterior design 
                of homes, including kitchens, bathrooms, bedrooms, 
                color schemes, artwork, garages, patios, decks, and more.' />
	);
}

export function sunglassStore(props: CalloutLibraryType){
	return (
		<Callout
			variant={props.variant || undefined}
			gridColumns={props.gridColumns || undefined}
			layout={props.layout || 'vertical'} 
			direction={props.direction || undefined}
			url='/store'
			img='/images/customs/neon-splatter.jpg'
			imgShape='squircle'
			title='Custom Sunglasses Store'
			content='View some cutomized Oakley sunglasses available for purchase.'/>
	);
}

export function subscribe(props: CalloutLibraryType) {
	return (
		<Callout
			variant={props.variant || undefined}
			gridColumns={props.gridColumns || undefined}
			layout={props.layout || 'vertical'}
			direction={props.direction || undefined}
			url='/subscribe'
			img='/images/icons/email-icon.png'
			imgShape="squircle" 
			title='Subscribe'
			content='Subscribe for updates and announcements about new products, 
				launches, events, and upcoming drops.'/>
	);
}

export function specialOrder(props: CalloutLibraryType) {
	return (
		<Callout
			variant={props.variant || undefined}
			gridColumns={props.gridColumns || undefined}
			layout={props.layout || 'vertical'} 
			direction={props.direction || undefined}
			url='/requests'
			img='/images/icons/request-icon.jpg'
			imgShape='squircle'
			title='Special Sunglass Orders'
			content='Pixelvivid can co-create a personalized pair of 
                really cool sunglasses with you! The artistic design of 
                your sunglasses can include one color, or a combination of 
                complimentary colors. Paint designs can be smaller or larger, 
                thin or thick, dense or sparse. Your special order sunglasses 
                are personal and vivid!'/>
	);
}

export function feedback(props: CalloutLibraryType) {
	return (
		<>
			<Callout
			// url="https://www.google.com/maps/place/PixelVivid/@36.51455,-77.7273335,6z/data=!3m1!4b1!4m6!3m5!1s0x209fb9352c67abff:0xcee141d8b6841e15!8m2!3d36.51455!4d-77.7273335!16s%2Fg%2F11xzgp2g5v?entry=ttu&g_ep=EgoyMDI1MTAwOC4wIKXMDSoASAFQAw%3D%3D" 
			// url="https://share.google/35XwN8k9tpSwv9mX3"
				variant={props.variant || undefined}
				gridColumns={props.gridColumns || undefined}
				layout={props.layout || 'horizontal'} 
				direction={props.direction || undefined}
				url="https://g.page/r/CRUehLbYQeHOEBM/review"
				img='/images/logos/google-business.png'
				imgShape='squircle'
				title='Leave a Google Review'
				content='If you have worked with us, and you were thrilled with your experience, please leave a review on our 
				Google Business page. 
				Your feedback is valuable to us to remain focused on you - our customers - and helps new customers learn about PixelVivid.
				We appreciate your feedback!'/>
		</>
	);
}

export function sustainabilityMessage(props: CalloutLibraryType) {
	return (
		<Callout
			variant={props.variant || undefined}
			gridColumns={props.gridColumns || undefined}
			layout={props.layout || 'horizontal'} 
			direction={props.direction || undefined}
			url={undefined}
			img='/images/icons/globe-icon.png'
			imgShape='squircle'
			title='Sustainability Message'
			content='By purchasing PixelVivid custom painted 
                sunglasses, you are supporting “creative upcycling”, 
				a form of waste reduction that focuses on extending 
				the life of materials by giving them a new purpose through 
				artistic and innovative means.  
                PixelVivid encourages a culture that reconnects and reuses 
                a quality product with a new and artistic aesthetic applied. 
				We are happy to creative-upcycle quality sunglass frames from 
				Oakley, Ray Ban, Costa del Mar, and more. Many of the frames 
				are vintage and are no longer manufactured, but brings back 
				great times and great memories! Now, they are reborn at PixelVivid for you.  
                Thank you for choosing a better product for our planet!' />
	);
}
