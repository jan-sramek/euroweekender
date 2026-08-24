FROM node:20-alpine AS builder
WORKDIR /src
ARG VITE_UMAMI_SCRIPT_URL=
ARG VITE_UMAMI_WEBSITE_ID=
ENV VITE_UMAMI_SCRIPT_URL=$VITE_UMAMI_SCRIPT_URL
ENV VITE_UMAMI_WEBSITE_ID=$VITE_UMAMI_WEBSITE_ID

COPY flight-search/frontend/package*.json ./flight-search/frontend/
WORKDIR /src/flight-search/frontend
RUN npm ci

WORKDIR /src
# prerender-seo.mjs imports ../../../scripts/seo-*.mjs from frontend/scripts.
COPY scripts ./scripts
COPY flight-search/frontend ./flight-search/frontend

WORKDIR /src/flight-search/frontend
RUN npm run build

FROM nginx:alpine
COPY --from=builder /src/flight-search/frontend/dist/ /usr/share/nginx/html/
COPY flight-search/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
