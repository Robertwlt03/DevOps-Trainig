# Use a base image
FROM node:20-slim AS base
WORKDIR /app
COPY package*.json ./

# Define the "development" stage
FROM base AS development
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

# (Optional) Define a production stage
FROM base AS production
RUN npm ci --only=production
COPY . .
CMD ["node", "src/index.js"]