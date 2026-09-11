# Etapa 1: Construcción de la aplicación Angular
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration production

# Etapa 2: Servir la aplicación con Nginx
FROM nginx:alpine

# Angular 17 con el builder "application" genera la salida dentro de /browser
COPY --from=build /app/dist/front-end/browser /usr/share/nginx/html/

# Eliminamos la configuración por defecto de Nginx y copiamos la nuestra personalizada
RUN rm -rf /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]