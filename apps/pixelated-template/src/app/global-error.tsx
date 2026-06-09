'use client';

import { GlobalErrorUI, usePixelatedConfig } from '@pixelated-tech/components';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
	const config = usePixelatedConfig();
	const siteInfo = config?.siteInfo ?? {};
	return <GlobalErrorUI error={error} reset={reset} siteInfo={siteInfo as any} />;
}
