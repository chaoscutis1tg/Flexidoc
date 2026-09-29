# Stage 1: Build Frontend React App
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend ./
RUN npm run build

# Stage 2: Build Backend Dependencies
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --production

# Stage 3: Production Final Image
FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache mongodb-tools chromium nss freetype harfbuzz ca-certificates \
    ttf-freefont font-noto font-noto-cjk font-noto-emoji fontconfig \
    libreoffice \
    && fc-cache -f

ENV NODE_ENV=production
ENV PORT=5000
ENV CHROME_BIN=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Copy Backend node_modules & Source
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY backend ./backend

# Copy Frontend Build Output into dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose Server Port
EXPOSE 5000

WORKDIR /app/backend
CMD ["npm", "start"]
