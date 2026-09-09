# Dev-mode image: runs the same `tsx watch` dev server as `npm run dev` on
# the host, just inside a container so it can be stopped/started with
# `docker compose` instead of hunting down orphaned background processes.
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 8001

CMD ["npm", "run", "dev"]
