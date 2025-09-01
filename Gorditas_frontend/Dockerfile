FROM node:18

WORKDIR /app

# Instalar dependencias
COPY project/package*.json ./
RUN npm install

# Copiar el código
COPY project/ ./

# Exponer puerto del dev server de React (normalmente 5173 con Vite, o 3000 con CRA)
EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
