FROM node:24-alpine

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund

COPY admin-server ./admin-server
COPY public/category-admin ./public/category-admin

ENV ADMIN_HOST=0.0.0.0
ENV ADMIN_PORT=8788
ENV ADMIN_DB_PATH=/data/category-admin.sqlite
VOLUME ["/data"]
EXPOSE 8788

CMD ["node", "admin-server/start.mjs"]
