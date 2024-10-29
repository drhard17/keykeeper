FROM node:alpine
WORKDIR /app
COPY ./src ./src
COPY package.json ./
COPY .env ./
RUN npm install
CMD ["npm", "run", "start"]