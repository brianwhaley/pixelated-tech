import { headers } from 'next/headers';
import { PageMetaTags, PixelatedServerConfigProvider } from '@pixelated-tech/components/server';
import { WebsiteSchema, LocalBusinessSchema, ServicesSchema } from "@pixelated-tech/components";
import { BreadcrumbListSchema } from "@pixelated-tech/components/server";
import { GoogleFonts } from "@pixelated-tech/components/server";
import { VisualDesignStyles } from "@pixelated-tech/components/server";
import LayoutClient from '@/app/elements/layout-client';
import { PageBg } from '@pixelated-tech/components';
import Header from '@/app/elements/header';
import Nav from '@/app/elements/nav';
import Footer from '@/app/elements/footer';
import "@pixelated-tech/components/css/pixelated.global.css";
import "@pixelated-tech/components/css/pixelated.grid.scss";
import './styles/globals.css';

export default async function RootLayout({
	children,
}: Readonly<{
  children: React.ReactNode;
}>) {
	await headers();

	return (
		<html lang="en">
			<LayoutClient />
			<head>
				<PixelatedServerConfigProvider>
					<PageMetaTags />
					<BreadcrumbListSchema />
					<WebsiteSchema />
					<LocalBusinessSchema />
					<ServicesSchema />
					<VisualDesignStyles />
					<GoogleFonts />
				</PixelatedServerConfigProvider>
			</head>
			<body>
				<PixelatedServerConfigProvider>
					<PageBg image="/images/3d-style-flowing-white-golden-wavy-background.png" />
					<nav><Nav /></nav>
					<header><Header /></header>
					<main>{children}</main>
					<footer><Footer /></footer>
				</PixelatedServerConfigProvider>
			</body>
		</html>
	);
}
