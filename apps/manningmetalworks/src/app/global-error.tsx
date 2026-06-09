'use client';

import { GlobalErrorUI, usePixelatedConfig } from '@pixelated-tech/components';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
	const pixelatedConfig = usePixelatedConfig();
	const siteInfo = pixelatedConfig?.siteInfo ?? {};
	return <GlobalErrorUI error={error} reset={reset} siteInfo={siteInfo} />;
}
	