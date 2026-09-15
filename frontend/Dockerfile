# Dev-mode image: runs the same Vite dev server as `npm run dev` on the
# host, just inside a container so the whole stack (mysql, backend,
# phpMyAdmin, frontend) can be brought up with one `docker compose` command.
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
# `npm ci` (not `npm install`) plus explicit retry/timeout tuning and
# --no-audit/--no-fund (fewer registry round-trips): on a slow connection,
# plain `npm install` reliably hits npm's own "Exit handler never called!"
# bug (a real npm CLI bug, not a project misconfiguration) when a fetch
# times out mid-install.
RUN npm config set fetch-retries 5 \
  && npm config set fetch-retry-mintimeout 20000 \
  && npm config set fetch-retry-maxtimeout 120000 \
  && npm config set fetch-timeout 300000 \
  && npm ci --no-audit --no-fund

COPY . .

EXPOSE 5173

# --host so Vite binds 0.0.0.0 instead of localhost-only, which would be
# unreachable from outside the container.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
