FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends fonts-noto-cjk && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY packages/resume-document ./packages/resume-document
COPY renderer/package.json renderer/package-lock.json ./renderer/
WORKDIR /app/packages/resume-document
RUN npm ci && npm run build
WORKDIR /app/renderer
RUN npm ci && npx playwright install --with-deps chromium
COPY renderer/src ./src
COPY renderer/test ./test
ENV NODE_ENV=production
EXPOSE 3001
CMD ["npm", "start"]
