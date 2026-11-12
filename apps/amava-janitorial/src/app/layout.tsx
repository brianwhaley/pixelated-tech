import { WebsiteSchema, LocalBusinessSchema } from "@pixelated-tech/components";
import { PageMetaTags, PixelatedServerConfigProvider } from '@pixelated-tech/components/server';
import { BreadcrumbListSchema } from '@pixelated-tech/components/server';
import { SchemaWebPage } from '@pixelated-tech/components/server';
import { VisualDesignStyles } from "@pixelated-tech/components/server";
import LayoutClient from '@/app/elements/layout-client';
import "@pixelated-tech/components/css/pixelated.global.css";
import "@pixelated-tech/components/css/pixelated.grid.scss";
import './styles/globals.css';

export default async function RootLayout({
	children,
}: Readonly<{
  children: React.ReactElement;
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
					{children}
				</PixelatedServerConfigProvider>
			</body>
		</html>
	);
}
