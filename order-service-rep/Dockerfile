# Use the latest version of Node.js
FROM node:latest

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

# Expose the port your app runs on (e.g., 3003)
EXPOSE 3003

# Command to run your app
CMD ["npm", "start"]
