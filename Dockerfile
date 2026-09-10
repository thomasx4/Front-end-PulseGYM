# Etapa 1: Construcción de la aplicación Angular
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration production

# Etapa 2: Servir la aplicación con Nginx
FROM nginx:alpine
COPY --from=build /app/dist/front-end /usr/share/nginx/html
# Copiamos nuestro nginx.conf personalizado para que maneje las rutas de Angular
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]