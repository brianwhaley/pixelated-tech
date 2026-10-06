import React from 'react';

export default function PrintLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="print-only-layout">
			{children}
		</div>
	);
}
