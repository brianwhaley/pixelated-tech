'use client';

import { GlobalErrorUI } from '@pixelated-tech/components';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
	return <GlobalErrorUI error={error} reset={reset}  />;
}
	