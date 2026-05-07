# Build stage
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY tsconfig.json vite.config.ts index.html ./
COPY src ./src
RUN npm run build

# Serve stage (minimal)
FROM nginx:alpine
ENV PORT=8080

RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

# Substitute PORT at runtime (Render.com sets PORT)
CMD ["/bin/sh", "-c", "sed \"s/__PORT__/${PORT}/g\" /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"]
