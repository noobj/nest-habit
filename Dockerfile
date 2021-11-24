FROM node:14-alpine

ENV VUE_APP_IMG_S3_URL=https://nest-habit-img-dev.s3.ap-southeast-1.amazonaws.com/
# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
RUN apk add git

# Install dependencies
RUN git clone https://github.com/noobj/nest-habit.git .
RUN npm install

RUN npm install vue-loader

# Bundle app source
RUN npm run build
RUN npm run vue:build

# Exports
EXPOSE 3000
CMD [ "npm", "run", "start:prod" ]
