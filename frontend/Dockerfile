FROM node:16

# Make app directory
WORKDIR /usr/src/app

# Install dependency
# Install package.json & package-lock.json
COPY package*.json ./
RUN npm install

# Add app
COPY . .
EXPOSE 4401

# For dev
# CMD [ "npm", "run", "dev"]

# For product
CMD [ "npm", "run", "product"]