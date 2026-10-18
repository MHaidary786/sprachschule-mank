# --- Build stage ---------------------------------------------------------
FROM node:24-alpine AS build

WORKDIR /app

COPY client/package*.json ./
RUN npm ci

COPY client/ .
RUN npm run build -- --configuration production

# --- Serve stage ---------------------------------------------------------
FROM nginx:1.27-alpine

COPY client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/client/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
