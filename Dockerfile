FROM node:22.13.1-slim

ENV TZ="Europe/London"

USER root

RUN apt-get update -qq && apt-get install -qqy --no-install-recommends \
    ca-certificates curl gnupg unzip zip openjdk-17-jre-headless \
    xvfb libnss3 libxss1 libgbm1 libasound2 fonts-liberation \
  && rm -rf /var/lib/apt/lists/*

# AWS CLI v2
RUN curl -fsSL https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip -o /tmp/awscliv2.zip \
  && unzip -q /tmp/awscliv2.zip -d /tmp \
  && /tmp/aws/install \
  && rm -rf /tmp/aws /tmp/awscliv2.zip

# Chrome for Testing (stable) + matching Chromedriver
RUN set -eux; \
    VER="$(curl -fsSL https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions.json \
      | grep -oP '\"stable\"\\s*:\\s*\"\\K[0-9.]+' )"; \
    BASE="https://storage.googleapis.com/chrome-for-testing-public/${VER}/linux64"; \
    curl -fsSL "${BASE}/chrome-linux64.zip" -o /tmp/chrome.zip; \
    curl -fsSL "${BASE}/chromedriver-linux64.zip" -o /tmp/chromedriver.zip; \
    unzip -q /tmp/chrome.zip -d /opt; \
    unzip -q /tmp/chromedriver.zip -d /opt; \
    ln -sf /opt/chrome-linux64/chrome /usr/bin/google-chrome; \
    install -m755 /opt/chromedriver-linux64/chromedriver /usr/local/bin/chromedriver; \
    rm -f /tmp/chrome.zip /tmp/chromedriver.zip

ENV CHROME_BIN=/usr/bin/google-chrome \
    CHROMEDRIVER_PATH=/usr/local/bin/chromedriver

WORKDIR /app
COPY . .
RUN npm ci || npm install

ENTRYPOINT ["./entrypoint.sh"]
