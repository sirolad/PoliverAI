FROM node:20-alpine AS builder
WORKDIR /app
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
COPY frontend/package.json frontend/yarn.lock ./
COPY frontend/ ./
RUN yarn install --frozen-lockfile --production=false
RUN yarn build

FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80 443
CMD ["/usr/sbin/nginx", "-g", "daemon off;"]
