FROM node:14-alpine

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install dependencies
COPY . .
RUN npm install

# Bundle app source
RUN ./node_modules/.bin/tsc

# Exports
CMD [ "npm", "run", "start" ]
