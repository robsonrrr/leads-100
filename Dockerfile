FROM node:20-alpine AS frontend_builder

WORKDIR /app/frontend

COPY www/frontend/package*.json ./
RUN npm install

COPY www/frontend/ ./

ENV VITE_API_URL=/api
ENV VITE_BASE_PATH=/

RUN npm run build


FROM node:20-alpine AS backend_builder

WORKDIR /app/backend

COPY www/backend/package*.json ./
RUN npm install --omit=dev

COPY www/backend/ ./


FROM node:20-alpine

RUN apk add --no-cache nginx
RUN mkdir -p /run/nginx /var/cache/nginx

WORKDIR /app

COPY --from=backend_builder /app/backend /app/backend
COPY --from=frontend_builder /app/frontend/dist /usr/share/nginx/html
COPY www/frontend/nginx.conf /etc/nginx/http.d/default.conf

EXPOSE 3001
EXPOSE 80

CMD ["node", "/app/backend/src/index.js"]
