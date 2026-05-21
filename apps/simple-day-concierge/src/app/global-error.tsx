'use client';

import siteConfig from './data/siteconfig.json';
import { GlobalErrorUI } from '@pixelated-tech/components';

const site = (siteConfig as any).siteInfo ?? {};

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
	return <GlobalErrorUI error={error} reset={reset} siteInfo={site} />;
}
