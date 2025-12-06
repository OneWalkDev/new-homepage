# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app

FROM base AS dev
ENV NODE_ENV=development

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies in the container
RUN npm install

# Copy the rest of the application
COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]
