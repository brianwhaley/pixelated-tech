"use client";

import { SmartImage } from "@pixelated-tech/components";
import '@/app/elements/page-bg.css';


type PageBgProps = {
  image: string;
};

export default function PageBg({ image }: PageBgProps) {
	return (
		<div className="page-bg">
			<SmartImage
				src={image}
				alt=""
				width={1920}
				height={1080}
				className="page-bg-image"
				aboveFold={true}
			/>
		</div>
	);
}
