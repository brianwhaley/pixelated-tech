FROM public.ecr.aws/lambda/nodejs:24-x86_64 AS build

COPY aws/services/social-publish-worker/package.json /workspace/aws/services/social-publish-worker/package.json
COPY packages/pixelated-components/package.json /workspace/packages/pixelated-components/package.json
COPY packages/pixelated-components/dist /workspace/packages/pixelated-components/dist
COPY packages/pixelated-components/dist/components/admin/socialpublish/socialpublish.server.js /workspace/socialpublish.server.js
WORKDIR /workspace/aws/services/social-publish-worker
RUN npm install --omit=dev --install-links
RUN cp /workspace/socialpublish.server.js /workspace/aws/services/social-publish-worker/node_modules/@pixelated-tech/components/dist/components/admin/socialpublish/socialpublish.server.js
RUN node --input-type=module -e "import fs from 'node:fs'; if (!fs.readFileSync('node_modules/@pixelated-tech/components/dist/components/admin/socialpublish/socialpublish.server.js', 'utf8').includes('.nextdoor.com')) process.exit(1);"
RUN cp -R node_modules ${LAMBDA_TASK_ROOT}/node_modules
ENV PUPPETEER_CACHE_DIR=${LAMBDA_TASK_ROOT}/.cache/puppeteer
RUN dnf install -y unzip findutils nspr nss atk at-spi2-atk gtk3 cups-libs libdrm libXcomposite libXdamage libXext libXfixes libXrandr libxkbcommon mesa-libgbm pango alsa-lib && dnf clean all
RUN npx puppeteer browsers install chrome
RUN chrome_binary=$(find "${PUPPETEER_CACHE_DIR}/chrome" -type f -path "*/chrome-linux64/chrome" -print -quit) \
	&& mv "$chrome_binary" "$chrome_binary.real" \
	&& printf '%s\n' '#!/bin/sh' 'exec "$0.real" --no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --disable-gpu --disable-software-rasterizer --no-zygote "$@"' > "$chrome_binary" \
	&& chmod +x "$chrome_binary"
RUN npx esbuild ${LAMBDA_TASK_ROOT}/node_modules/@pixelated-tech/components/dist/scripts/config-vault.js --bundle --platform=node --format=esm --outfile=${LAMBDA_TASK_ROOT}/config-vault.mjs
WORKDIR ${LAMBDA_TASK_ROOT}
COPY aws/services/social-publish-worker/package.json ${LAMBDA_TASK_ROOT}/package.json

COPY aws/services/social-publish-worker/src ${LAMBDA_TASK_ROOT}/src
RUN npx esbuild ${LAMBDA_TASK_ROOT}/src/index.mjs --bundle --platform=node --format=esm --outfile=${LAMBDA_TASK_ROOT}/index.mjs --external:puppeteer --external:nodemailer --alias:@pixelated-tech/components/config/server=${LAMBDA_TASK_ROOT}/node_modules/@pixelated-tech/components/dist/components/config/config.js --alias:@pixelated-tech/components/wordpress/server=${LAMBDA_TASK_ROOT}/node_modules/@pixelated-tech/components/dist/components/integrations/wordpress.server.js --alias:@pixelated-tech/components/socialpublish/server=${LAMBDA_TASK_ROOT}/node_modules/@pixelated-tech/components/dist/components/admin/socialpublish/socialpublish.server.js
COPY apps/pixelated-admin/src/app/config/pixelated.config.json.enc ${LAMBDA_TASK_ROOT}/src/app/config/pixelated.config.json.enc

FROM public.ecr.aws/lambda/nodejs:24-x86_64

ENV PUPPETEER_CACHE_DIR=${LAMBDA_TASK_ROOT}/.cache/puppeteer

COPY --from=build ${LAMBDA_TASK_ROOT}/node_modules ${LAMBDA_TASK_ROOT}/node_modules
COPY packages/pixelated-components/dist/components/admin/socialpublish/socialpublish.server.js ${LAMBDA_TASK_ROOT}/node_modules/@pixelated-tech/components/dist/components/admin/socialpublish/socialpublish.server.js
COPY --from=build ${LAMBDA_TASK_ROOT}/.cache/puppeteer ${LAMBDA_TASK_ROOT}/.cache/puppeteer
COPY --from=build ${LAMBDA_TASK_ROOT}/config-vault.mjs ${LAMBDA_TASK_ROOT}/config-vault.mjs
COPY --from=build ${LAMBDA_TASK_ROOT}/index.mjs ${LAMBDA_TASK_ROOT}/index.mjs
COPY --from=build ${LAMBDA_TASK_ROOT}/package.json ${LAMBDA_TASK_ROOT}/package.json
COPY --from=build ${LAMBDA_TASK_ROOT}/src/app/config/pixelated.config.json.enc ${LAMBDA_TASK_ROOT}/src/app/config/pixelated.config.json.enc

RUN dnf install -y nspr nss atk at-spi2-atk gtk3 cups-libs libdrm libXcomposite libXdamage libXext libXfixes libXrandr libxkbcommon mesa-libgbm pango alsa-lib && dnf clean all

CMD ["index.handler"]
