# docker/frontend/Dockerfile
FROM node:16

# Build argument for environment
ARG BUILD_ENV=DEV

# Make app directory
WORKDIR /usr/src/app

# Install dependency
COPY package*.json ./
RUN npm install

# Add app
COPY . .
EXPOSE 4401

# Use build argument to determine command
CMD if [ "$BUILD_ENV" = "DEV" ]; then \
        npm run dev; \
    else \
        npm run product; \
    fi