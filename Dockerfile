FROM node:22.13.1-slim

ENV TZ="Europe/London"

USER root

# Base utils + Java + unzip (needed for awscli + chromedriver)
RUN apt-get update -qq && apt-get install -qqy --no-install-recommends \
    ca-certificates \
    curl \
    gnupg \
    unzip \
    zip \
    openjdk-17-jre-headless \
  && rm -rf /var/lib/apt/lists/*

# --- Install AWS CLI v2 ---
RUN curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "/tmp/awscliv2.zip" \
  && unzip -q /tmp/awscliv2.zip -d /tmp \
  && /tmp/aws/install \
  && rm -rf /tmp/aws /tmp/awscliv2.zip

# --- Install Google Chrome (stable) + required libs ---
RUN mkdir -p /etc/apt/keyrings \
  && curl -fsSL https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /etc/apt/keyrings/google-linux-signing-keyring.gpg \
  && echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/google-linux-signing-keyring.gpg] http://dl.google.com/linux/chrome/deb/ stable main" \
     > /etc/apt/sources.list.d/google-chrome.list \
  && apt-get update -qq && apt-get install -qqy --no-install-recommends \
     google-chrome-stable \
     # common headless deps
     xvfb \
     libnss3 \
     libxss1 \
     libgbm1 \
     libasound2 \
     fonts-liberation \
  && rm -rf /var/lib/apt/lists/*

# --- Install matching ChromeDriver ---
# Fetch the exact major version Chromedriver that matches the installed Chrome.
RUN set -eux; \
    CHROME_VERSION="$(google-chrome --version | awk '{print $3}')" ; \
    CHROME_MAJOR="${CHROME_VERSION%%.*}" ; \
    CD_VERSION="$(curl -fsSL "https://chromedriver.storage.googleapis.com/LATEST_RELEASE_${CHROME_MAJOR}")" ; \
    curl -fsSL "https://chromedriver.storage.googleapis.com/${CD_VERSION}/chromedriver_linux64.zip" -o /tmp/chromedriver.zip ; \
    unzip -q /tmp/chromedriver.zip -d /usr/local/bin/ ; \
    rm /tmp/chromedriver.zip ; \
    chmod +x /usr/local/bin/chromedriver

# Helpful envs many tools look for (optional)
ENV CHROME_BIN=/usr/bin/google-chrome \
    CHROMEDRIVER_PATH=/usr/local/bin/chromedriver

WORKDIR /app

COPY . .

# Install Node deps
RUN npm ci || npm install

ENTRYPOINT [ "./entrypoint.sh" ]

# Note for Apple Silicon: build with --platform=linux/amd64 if required
