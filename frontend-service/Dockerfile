# sneakerhead/frontend-service/Dockerfile

# ── Stage 1: builder ──────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json .
RUN npm install --silent
COPY . .
RUN npm run build

# ── Stage 2: runner ───────────────────────────────
FROM nginx:1.27-alpine AS runner
RUN apk update && apk upgrade --no-cache && rm -rf /var/cache/apk/*
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
