import pkg from '../package.json' assert { type: 'json' };

export const pixelatedComponentsVersion = typeof pkg?.version === 'string' ? pkg.version : '';
