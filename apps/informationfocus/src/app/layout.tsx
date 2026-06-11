import { headers } from "next/headers";
import { PageMetaTags, PixelatedServerConfigProvider } from "@pixelated-tech/components/server";
import { WebsiteSchema, LocalBusinessSchema, ServicesSchema } from "@pixelated-tech/components";
import { VisualDesignStyles, BreadcrumbListSchema } from "@pixelated-tech/components/server";
import LayoutClient from "@/app/elements/layoutclient";
import Header from "@/app/elements/header";
import Nav from "@/app/elements/nav";
import Footer from '@/app/elements/footer';
import "@pixelated-tech/components/css/pixelated.global.css";
import "@pixelated-tech/components/css/pixelated.grid.scss";
import "./styles/globals.css";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	await headers();

	return (
		<>
			<html lang="en">
				<head>
					<PixelatedServerConfigProvider>
						<PageMetaTags />
						<BreadcrumbListSchema />
						<WebsiteSchema />
						<LocalBusinessSchema />
						<ServicesSchema />
						<VisualDesignStyles />
					</PixelatedServerConfigProvider>
				</head>
				<body>
					<PixelatedServerConfigProvider>
						<LayoutClient />
						<header><Header /></header>
						<nav><Nav /></nav>
						<main>{children}</main>
						<footer><Footer /></footer>
					</PixelatedServerConfigProvider>
				</body>
			</html>
		</>
	);
}
