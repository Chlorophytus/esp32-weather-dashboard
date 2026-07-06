FROM node:lts

# Drop privileges
USER node
WORKDIR /app

# Copy dependency files first to leverage Docker cache
COPY --chown=node:node package*.json ./

# Install
RUN npm install

# Copy the rest of the application
COPY --chown=node:node . .

# Expose Vite port
EXPOSE 5173

# Host web app
ENTRYPOINT ["npm", "run", "dev"]
