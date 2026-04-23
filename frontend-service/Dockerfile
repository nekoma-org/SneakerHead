# sneakerhead/frontend-service/Dockerfile

# ── Stage 1: builder ──────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json .
RUN npm install --silent
COPY . .
RUN npm run build

# ── Stage 2: runner ───────────────────────────────
FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
