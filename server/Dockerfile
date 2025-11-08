FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy server files
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose port (Cloud Run uses PORT env variable, default to 8080)
EXPOSE 8080

# Start server
CMD ["node", "index.js"]
