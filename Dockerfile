FROM node:18-alpine
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Install TypeScript globally
RUN npm install -g typescript

# Build the project (compile TypeScript)
RUN npm run build

# Clean install production dependencies only
RUN npm ci --omit=dev

# Expose port
EXPOSE 3000

# Start the application - point to compiled server file
CMD ["node", "dist/server.js"]
