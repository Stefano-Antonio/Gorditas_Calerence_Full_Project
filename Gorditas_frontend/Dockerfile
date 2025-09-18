# Etapa 1: Build del frontend
FROM node:18.17.0-alpine AS build
WORKDIR /app

COPY project/package*.json ./
RUN npm install

COPY project/ ./
RUN npm run build

# Etapa 2: Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5173
CMD ["nginx", "-g", "daemon off;"]
