
import { headers } from "next/headers";
import { PageMetaTags, PixelatedServerConfigProvider } from "@pixelated-tech/components/server";
import { SchemaWebPage } from "@pixelated-tech/components/server";
import { LocalBusinessSchema, WebsiteSchema } from "@pixelated-tech/components";
import { BreadcrumbListSchema } from "@pixelated-tech/components/server";
import { VisualDesignStyles } from "@pixelated-tech/components/server";
import { LayoutClient } from "@/app/elements/layoutclient";
import { ContentfulAlerts } from "@pixelated-tech/components";
import { InteractionGuardrail } from "@pixelated-tech/components";
import Header from "@/app/elements/header";
import HeaderNav from "@/app/elements/headernav";
import Nav from "@/app/elements/nav";
import Search from '@/app/elements/search';
import Footer from '@/app/elements/footer';
// import { BlogPostsProvider } from "@/app/providers/blog-posts-provider";
import "@pixelated-tech/components/css/pixelated.global.css";
import "@pixelated-tech/components/css/pixelated.grid.scss";
import "@/app/styles/globals.css";

export default async function RootLayout({children}: Readonly<{children: React.ReactNode}>) {

	const reqHeaders: Headers = await (headers() as Promise<Headers>);
	const path = reqHeaders.get("x-path") ?? "/";
	const pathname = path.endsWith("/") && path !== "/" ? path.slice(0, -1) : path;
		
	const regexPattern = /^\/samples\/.+$/;
	const samplesBody = <>{children}</>;
	const pixelatedBody = (
		<>
			<header>
				<div id="page-header" className="fixed-header"><Header /></div>
				<div id="page-header-nav" className="fixed-header-nav">
					<div className="section-container">
						<HeaderNav />
					</div>
				</div>
				<div id="fixed-header-spacer"></div>
				<div id="fixed-header-nav-spacer"></div>
				<div id="page-search" className="no-mobile">
					<Search />
				</div>
			</header>
			<nav>
				<Nav />
			</nav>
			<main>
				<ContentfulAlerts alertContentType="alert" />
				{children}
			</main>
			<footer>
				<Footer />
			</footer>
		</>
	) ;

	const layoutBody = (regexPattern.test(pathname)) ? samplesBody : pixelatedBody;

	return (
		<>
			<LayoutClient />
			<html lang="en">
				<head>
					<PixelatedServerConfigProvider>
						<PageMetaTags />
					    <SchemaWebPage />
						<BreadcrumbListSchema />
						<WebsiteSchema />
						<LocalBusinessSchema />
						<VisualDesignStyles />
						<LocalBusinessSchema
							streetAddress="4 Raymond Court"
							addressLocality="Bluffton"
							addressRegion="SC"
							postalCode="29909"
							addressCountry="US"
							telephone="+1-843-699-6611"
						/>
						<meta name="google-site-verification" content="t2yy9wL1bXPiPQjBqDee2BTgpiGQjwVldlfa4X5CQkU" />
						<meta name="google-site-verification" content="l7D0Y_JsgtACBKNCeFAXPe-UWqo13fPTUCWhkmHStZ4" />
						<meta name="blogarama-site-verification" content="blogarama-255c1bbf-7596-49bc-9d50-91af781055c2" />
					</PixelatedServerConfigProvider>
				</head>
				<body>
					<PixelatedServerConfigProvider>
						<InteractionGuardrail>
							{ layoutBody }
						</InteractionGuardrail>
					</PixelatedServerConfigProvider>
				</body>
			</html></>
	);
}

