# Use Node.js base image
FROM node:22

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Generate prisma schema
RUN npx prisma generate
RUN npx prisma migrate dev --name init

# Expose port
EXPOSE 3000

# Run the app
CMD ["node", "server.js"]
