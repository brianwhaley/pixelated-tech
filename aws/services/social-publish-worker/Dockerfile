FROM public.ecr.aws/lambda/nodejs:24-x86_64

COPY aws/services/social-publish-worker/package.json /workspace/aws/services/social-publish-worker/package.json
COPY packages/pixelated-components/package.json /workspace/packages/pixelated-components/package.json
COPY packages/pixelated-components/dist /workspace/packages/pixelated-components/dist
WORKDIR /workspace/aws/services/social-publish-worker
RUN npm install --omit=dev --install-links
RUN cp -R node_modules ${LAMBDA_TASK_ROOT}/node_modules
WORKDIR ${LAMBDA_TASK_ROOT}
COPY aws/services/social-publish-worker/package.json ${LAMBDA_TASK_ROOT}/package.json

COPY aws/services/social-publish-worker/src ${LAMBDA_TASK_ROOT}/src
RUN npx esbuild ${LAMBDA_TASK_ROOT}/src/index.mjs --bundle --platform=node --format=esm --outfile=${LAMBDA_TASK_ROOT}/index.mjs --external:puppeteer --alias:@pixelated-tech/components/config/server=${LAMBDA_TASK_ROOT}/node_modules/@pixelated-tech/components/dist/components/config/config.js --alias:@pixelated-tech/components/wordpress/server=${LAMBDA_TASK_ROOT}/node_modules/@pixelated-tech/components/dist/components/integrations/wordpress.server.js --alias:@pixelated-tech/components/socialpublish/server=${LAMBDA_TASK_ROOT}/node_modules/@pixelated-tech/components/dist/components/admin/socialpublish/socialpublish.server.js
COPY apps/pixelated-admin/src/app/config/pixelated.config.json.enc ${LAMBDA_TASK_ROOT}/src/app/config/pixelated.config.json.enc

CMD ["index.handler"]
