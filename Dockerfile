# Etapa 1: Construcción de la aplicación Angular
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

RUN npm run build -- --configuration production

FROM nginx:alpine
COPY --from=build /app/dist/front-end/browser /usr/share/nginx/html/browser

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80