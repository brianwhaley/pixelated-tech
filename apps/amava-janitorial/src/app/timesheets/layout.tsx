import { cookies } from 'next/headers';
import { getAuthenticatedTimesheetUser } from '@pixelated-tech/components/server';
import { DEFAULT_PASSCODE_COOKIE } from '@pixelated-tech/components/server';
import { MenuSimple } from '@pixelated-tech/components';
import { PixelatedFooter } from "@pixelated-tech/components";
import { headers } from "next/headers";
import { getFullPixelatedConfig } from "@pixelated-tech/components/server";
import { PageSection, SmartImage } from "@pixelated-tech/components";

const DOMAIN = 'amavajanitorial.com';

function menuItems(isAdmin: boolean) {
	return [
		{ name: 'View My Timesheets', path: '/timesheets/summary' },
		{ name: 'Submit a New Timesheet', path: '/timesheets/new' },
		...(isAdmin ? [{ name: 'Admin View', path: '/timesheets/admin' }] : []),
		{ name: 'Logout', path: '/timesheets/auth?action=logout' },
	];
}

export default async function TimesheetsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	const cookieStore = await cookies();
	const user = await getAuthenticatedTimesheetUser(DOMAIN, cookieStore.get(DEFAULT_PASSCODE_COOKIE)?.value);

	const reqHeaders = await headers();
	const path = reqHeaders.get("x-path") ?? "/";
	const pathname = path.endsWith("/") && path !== "/" ? path.slice(0, -1) : path;
	const config = await getFullPixelatedConfig();
	const siteName = config?.siteInfo?.name || "AMAVA Janitorial";
        
	return (
		<>
			<header>
				<PageSection columns={1} maxWidth="1440px" padding="0px" id="header-section">
					<a href="/" className="logo-link">
						<SmartImage
							id="logo"
							src="/images/amava-logo.png"
							alt={config?.siteInfo?.name ? `${config.siteInfo.name} Logo` : "Site Logo"}
							aboveFold={true}
							width={448} /* 400 */
							height={123} /* 110 */ />
					</a>
					{user && <MenuSimple menuItems={menuItems(user.role === 'admin')} />}
				</PageSection>
			</header>
            
			<main className="timesheet-shell-main">{children}</main>
            
			<footer className="timesheet-shell-footer">
				<div className="centered">
					<p className="footer-text">&copy; {new Date().getFullYear()} {siteName}. All rights reserved.</p>
					<PixelatedFooter pathname={pathname} />
				</div>
			</footer>
		</>
	);
}
