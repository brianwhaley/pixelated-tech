import { PageMetaTags, PixelatedServerConfigProvider } from '@pixelated-tech/components/server';
import { SchemaWebPage } from '@pixelated-tech/components/server';
import { WebsiteSchema, LocalBusinessSchema } from "@pixelated-tech/components";
import { BreadcrumbListSchema } from "@pixelated-tech/components/server";
import { VisualDesignStyles } from "@pixelated-tech/components/server";
import LayoutClient from '@/app/elements/layout-client';
import Header from '@/app/elements/header';
import Footer from '@/app/elements/footer';
import "@pixelated-tech/components/css/pixelated.global.css";
import "@pixelated-tech/components/css/pixelated.grid.scss";
import './styles/globals.css';

export default async function RootLayout({
	children,
}: Readonly<{
  children: React.ReactNode;
}>) {

	return (
		<html lang="en">
			<LayoutClient />
			<head>
				<PixelatedServerConfigProvider>
					<PageMetaTags />
					<BreadcrumbListSchema />
					<SchemaWebPage />
					<WebsiteSchema />
					<LocalBusinessSchema />
					<VisualDesignStyles />
				</PixelatedServerConfigProvider>
			</head>
			<body>
				<PixelatedServerConfigProvider>
					<header><Header /></header>
					{ /* <nav><Nav /></nav> */ }
					<main>{children}</main>
					<footer><Footer /></footer>
				</PixelatedServerConfigProvider>
			</body>
		</html>
	);
}
