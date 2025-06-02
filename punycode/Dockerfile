# Use official Node.js image as base image
FROM node:lts

# Set working directory in the container
WORKDIR /app

# Copy package.json and pnpm-lock.yaml first (for better caching)
COPY package.json pnpm-lock.yaml ./

# Install pnpm globally
RUN npm install -g pnpm

# Install dependencies using pnpm
RUN pnpm install

# Copy the rest of the application code
COPY . .

# Expose the port that the app will run on
EXPOSE 3000

# Start the app
CMD ["pnpm", "start"]
