import { getFullPixelatedConfig } from '../../config/config';

type NextAuthConfig = {
  secret?: string;
};

type GoogleConfig = {
  client_id?: string;
  client_secret?: string;
};

export type GoogleOAuthCredentials = {
  clientId: string;
  clientSecret: string;
};

export type NextAuthCredentials = {
  secret: string;
};

export function getNextAuthCredentials(): NextAuthCredentials {
	const fullConfig = getFullPixelatedConfig();
	const nextAuthCfg = (fullConfig.integrations?.nextAuth ?? {}) as NextAuthConfig;
	if (!nextAuthCfg.secret) {
		throw new Error('nextAuth.secret not configured in pixelated.config.json');
	}
	return { secret: nextAuthCfg.secret };
}

export function getGoogleOAuthCredentials(): GoogleOAuthCredentials {
	const fullConfig = getFullPixelatedConfig();
	const googleCfg = (fullConfig.integrations?.google ?? {}) as GoogleConfig;
	if (!googleCfg.client_id || !googleCfg.client_secret) {
		throw new Error('Google OAuth credentials not configured in pixelated.config.json');
	}
	return {
		clientId: googleCfg.client_id,
		clientSecret: googleCfg.client_secret,
	};
}
