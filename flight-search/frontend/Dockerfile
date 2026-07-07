# Build stage - build the Angular application
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG API_URL=http://localhost:5001
ENV API_URL=$API_URL
RUN npm run build --configuration=Production

# Production stage - serve with nginx
FROM nginx:alpine
COPY --from=builder /app/dist/weekend-flights-frontend/browser/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 4200
CMD ["nginx", "-g", "daemon off;"]