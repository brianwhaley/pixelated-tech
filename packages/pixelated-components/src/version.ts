import pkg from '../package.json' with { type: 'json' };

export const pixelatedComponentsVersion = typeof pkg?.version === 'string' ? pkg.version : '';
