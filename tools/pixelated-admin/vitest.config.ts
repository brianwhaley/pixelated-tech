import { createAppVitestConfig } from '../../shared/configs/vitest.config.base.ts';

export default createAppVitestConfig(__dirname, {
	globals: true,
});