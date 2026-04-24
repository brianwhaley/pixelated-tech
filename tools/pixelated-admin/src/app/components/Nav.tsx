'use client';

import React, { useState } from 'react';
import { SidePanel, MenuAccordion } from '@pixelated-tech/components';
import { useSession, signOut } from 'next-auth/react';
import siteConfig from '../data/siteconfig.json';
const allRoutes = siteConfig.routes;

export default function Nav() {
	const [isOpen, setIsOpen] = useState(false);
	const { data: session, status } = useSession();

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
			<MenuAccordion menuItems={allRoutes} />
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