'use client';

import React, { useMemo, useState } from 'react';
import { SidePanel, MenuAccordion } from '@pixelated-tech/components';
import { useSession, signOut } from 'next-auth/react';
import { usePixelatedConfig } from '@pixelated-tech/components';
import { getAllowedAdminRoutes } from '@pixelated-tech/components/adminclient';
import authorizationConfig from '../data/authorization.json';

export default function Nav() {
	const pixelatedConfig = usePixelatedConfig();
	const routes = pixelatedConfig?.routes ?? [];

	const [isOpen, setIsOpen] = useState(false);
	const { data: session, status } = useSession();

	const allowedRoutes = useMemo(() => {
		const email = session?.user?.email;
		return getAllowedAdminRoutes(email, routes, authorizationConfig as any);
	}, [routes, session]);

	const handleSignOut = () => {
		signOut({ callbackUrl: '/login' });
	};

  	return (
		<SidePanel
			isOpen={isOpen}
			onClose={() => setIsOpen(false)}
			onToggle={() => setIsOpen(!isOpen)}
			position="left"
			width="300px"
			showOverlay={true}
			showTab={true}
			tabIcon="☰"
		>
			<MenuAccordion menuItems={allowedRoutes} />
			<div className="nav-user-section">
				{status === 'loading' ? (
					<div className="nav-loading-text">Loading...</div>
				) : session ? (
					<div className="nav-user-info">
						<div className="nav-user-text-container">
							<div className="nav-user-name">{session.user?.name}</div>
							<div className="nav-user-email">{session.user?.email}</div>
						</div>
						<button
							onClick={handleSignOut}
							className="nav-sign-out-btn"
						>
							Sign Out
						</button>
					</div>
				) : (
					<div className="nav-not-signed-in-text">Not signed in</div>
				)}
			</div>
		</SidePanel>
	);
}