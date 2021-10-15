FROM node:14-alpine

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
RUN apk add git

# Install dependencies
RUN git clone https://github.com/noobj/nest-habit.git .
RUN npm install
# Bundle app source
RUN npm run build
RUN npm run vue:build

# Exports
EXPOSE 3000
CMD [ "npm", "run", "start:prod" ]
