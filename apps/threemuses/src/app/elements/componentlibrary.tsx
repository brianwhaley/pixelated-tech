
import { Callout } from "@pixelated-tech/components";

export function UpcomingSewingEvents() {
	return (
		<Callout    
			variant="boxed grid"
			layout="horizontal"
			direction="left"
			gridColumns={{ left: 1, right: 3 }}
			img="/images/logo/muse2-erato.png"
			url="/events"
			title="Upcoming Sewing Events"
			subtitle="Join Us for Sewing Workshops, Classes, and Summer Camps" 
			content="Whether you're a beginner eager to learn the basics or an experienced sewer looking to refine your skills, our sewing events offer something for everyone. Our workshops and classes cover a range of topics, from mastering the fundamentals of sewing to exploring advanced techniques. Plus, our summer camps provide an immersive experience for young creatives to dive into the world of sewing in a fun and supportive environment. Join us and let our expert instructors inspire your creativity with every stitch."
			buttonText="Upcoming Sewing Events"
		/>
	);
}

export function ConsignWithUs() {
	return (
		<Callout
			variant="grid"
			layout="horizontal"
			direction="right"
			gridColumns={{ left: 3, right: 1 }}
			img="https://images.ctfassets.net/luf8eony1687/6RlzYli6GihWE5ZlX5NMjd/7062a3019f693b0aea9b98cf2a2c6797/dress-from-collection-museum-fine-arts.jpg"
			url="/consign"
			title="Consign With Us"
			subtitle="Turn Your Gently Loved Items into Something Beautiful" 
			content="The Three Muses of Bluffton invites you to consign your gently loved costumes and formal dresses to turn them into something beautiful. Bring in clean, high-quality, and excellent condition items that are ready to sell. We will price, display, and sell the items for you, allowing you to earn money as soon as they find a new home. We are ready to help you make beautiful new connections through your cherished wardrobe pieces."
			buttonText="Consign With Us"
		/>
	);
}