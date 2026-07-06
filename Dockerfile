FROM node:lts

WORKDIR /app

# Copy dependency files first to leverage Docker cache
COPY --chown=node:node package*.json ./

# Drop privileges
USER node

# Install
RUN npm install

# Copy the rest of the application
COPY --chown=node:node . .

# Expose Vite port
EXPOSE 5173

# Host web app
ENTRYPOINT ["npm", "run", "dev"]
