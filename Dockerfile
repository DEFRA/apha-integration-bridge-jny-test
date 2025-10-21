FROM node:22.13.1-slim

ENV TZ="Europe/London" \
    NODE_ENV=production

USER root

# Base tools + certs (quiet, no recommends)
RUN apt-get update -qq \
 && apt-get install -qqy --no-install-recommends \
    curl \
    unzip \
    ca-certificates \
    openjdk-17-jre-headless \
 && rm -rf /var/lib/apt/lists/*

# AWS CLI v2
RUN curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" \
 && unzip -q awscliv2.zip \
 && ./aws/install \
 && rm -rf aws awscliv2.zip

WORKDIR /app

# Install deps first for better layer caching
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the rest
COPY . .

# Ensure scripts are executable
RUN chmod +x ./entrypoint.sh ./bin/publish-tests.sh

ENTRYPOINT ["./entrypoint.sh"]

# For Apple Silicon builds (local): add --platform=linux/amd64 when building.
