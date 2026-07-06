FROM node:lts

USER nobody
WORKDIR /app

# Copy dependency files first to leverage Docker cache
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Expose Vite port
EXPOSE 5173

# Host web app
ENTRYPOINT ["npm", "run", "dev"]