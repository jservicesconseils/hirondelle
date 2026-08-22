FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# start.sh polls each service's /health with curl before considering it started.
RUN apk add --no-cache curl

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY start.sh ./start.sh

RUN chmod +x ./start.sh

EXPOSE 8080 8081 8082
CMD ["./start.sh"]
