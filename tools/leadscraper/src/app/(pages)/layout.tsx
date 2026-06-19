import { PixelatedServerConfigProvider } from "@pixelated-tech/components/server";
import { VisualDesignStyles } from "@pixelated-tech/components/server";
import { GoogleFonts } from "@pixelated-tech/components/server";
import "@pixelated-tech/components/css/pixelated.global.css";
import "@pixelated-tech/components/css/pixelated.grid.scss";
// LOAD THIS AS LAST CSS FILE
import "../styles/globals.css";

export const metadata = {
	title: 'Pixelated LeadScraper',
	description: 'Pixelated Leadscraper',
};

export default function RootLayout({
	children,
}: {
  children: React.ReactNode
}) {
	return (
		<html lang="en">
			<head>
				<PixelatedServerConfigProvider>
					<GoogleFonts />
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
