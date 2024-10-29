FROM node:alpine
WORKDIR /app
COPY *.js* ./
COPY .env ./
RUN npm ci
CMD ["npm", "run", "start"]