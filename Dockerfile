FROM node:lts

WORKDIR /app

# Copy dependency files first to leverage Docker cache
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .