FROM node:22-bullseye AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build:ssr

FROM node:22-bullseye
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app /app
CMD ["npm", "run", "start:ssr"]
