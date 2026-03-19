# mobile_app/Dockerfile

# ---------- build
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# 🚨 IMPORTANT: clean cache
RUN rm -rf .next

RUN npm run build