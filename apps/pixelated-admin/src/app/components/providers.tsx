'use client';

import PropTypes, {InferProps} from 'prop-types';
import { SessionProvider } from 'next-auth/react';

/**
 * Providers — Wraps application with necessary context providers (e.g., authentication).
 *
 * @param {node} [props.children] - Child components to be wrapped by providers.
 */
Providers.propTypes = {
	children: PropTypes.node.isRequired,
};
export type ProvidersType = InferProps<typeof Providers.propTypes>;
export function Providers({ children }: ProvidersType) {
	return <SessionProvider>{children}</SessionProvider>;
}