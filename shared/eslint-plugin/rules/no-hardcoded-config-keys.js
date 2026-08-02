export const noHardcodedConfigKeysRule = {
	meta: {
		type: 'problem',
		docs: {
			description: 'Prevent hardcoded Pixelated configuration keys that should come from config provider',
			category: 'Security',
			recommended: true,
		},
		fixable: false,
		schema: [],
		messages: {
			secretConfigKey: 'Hardcoded SECRET configuration key "{{keyName}}" ({{serviceName}}) detected. Must use config provider (usePixelatedConfig) or environment variables.',
			publicConfigKey: 'Hardcoded Pixelated config key "{{keyName}}" ({{serviceName}}) detected. Should use config provider (usePixelatedConfig) or pass as parameter instead.',
		},
	},
	create(context) {
		const pixelatedConfigKeys = {
			contentful: ['space_id', 'delivery_access_token', 'management_access_token', 'preview_access_token', 'proxyURL', 'base_url', 'environment'],
			ebay: ['appId', 'appDevId', 'appCertId', 'sbxAppId', 'sbxAppDevId', 'sbxAppCertId', 'globalId', 'baseTokenURL', 'baseSearchURL', 'baseAnalyticsURL', 'qsSearchURL', 'baseItemURL', 'qsItemURL'],
			aws: ['access_key_id', 'secret_access_key', 'session_token'],
			cloudinary: ['product_env', 'api_key', 'api_secret'],
			flickr: ['user_id'],
			github: ['token', 'apiBaseUrl', 'defaultOwner'],
			google: ['client_id', 'client_secret', 'api_key', 'refresh_token'],
			googleAnalytics: [],
			googleMaps: ['apiKey'],
			hubspot: ['portalId', 'formId', 'trackingCode'],
			instagram: ['accessToken', 'userId'],
			nextAuth: ['secret'],
			paypal: ['sandboxPayPalApiKey', 'sandboxPayPalSecret', 'payPalApiKey', 'payPalSecret'],
			wordpress: ['baseURL', 'site'],
			puppeteer: ['executable_path', 'cache_dir'],
			global: ['PIXELATED_CONFIG_KEY'],
		};

		const secretKeys = new Set([
			'access_key_id', 'secret_access_key', 'session_token',
			'api_key', 'api_secret',
			'management_access_token', 'preview_access_token',
			'sbxAppId',
			'token',
			'accessToken',
			'sandboxPayPalApiKey', 'sandboxPayPalSecret', 'payPalApiKey', 'payPalSecret',
			'secret',
			'PIXELATED_CONFIG_KEY',
		]);

		const allConfigKeys = new Set();
		Object.values(pixelatedConfigKeys).forEach(keys => keys.forEach(key => allConfigKeys.add(key)));

		function findServiceForKey(keyName) {
			for (const [serviceName, keys] of Object.entries(pixelatedConfigKeys)) {
				if (keys.includes(keyName)) return serviceName;
			}
			return 'unknown';
		}

		function isConfigKey(keyName) {
			return allConfigKeys.has(keyName);
		}

		function isSecretKey(keyName) {
			return secretKeys.has(keyName);
		}

		return {
			ObjectExpression(node) {
				node.properties.forEach(prop => {
					if (prop.type === 'Property' && prop.key) {
						const keyName = prop.key.name || prop.key.value;
						if (isConfigKey(keyName)) {
							if (prop.value.type === 'Literal' && typeof prop.value.value === 'string') {
								const stringValue = prop.value.value;
								if (stringValue && stringValue.length > 0) {
									const serviceName = findServiceForKey(keyName);
									const messageId = isSecretKey(keyName) ? 'secretConfigKey' : 'publicConfigKey';
									context.report({ node: prop, messageId, data: { keyName, serviceName } });
								}
							}
						}
					}
				});
			},
		};
	},
};
