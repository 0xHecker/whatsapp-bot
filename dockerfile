FROM node:21

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y \
  wget \
  ca-certificates \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdbus-1-3 \
  libgdk-pixbuf2.0-0 \
  libnspr4 \
  libnss3 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  xdg-utils \
  libgbm1 \
  libxshmfence1 \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

COPY . .

RUN groupadd -r puppeteer && useradd -r -g puppeteer -G audio,video puppeteer \
  && mkdir -p /home/puppeteer/Downloads \
  && chown -R puppeteer:puppeteer /home/puppeteer \
  && chown -R puppeteer:puppeteer /usr/src/app

USER puppeteer

RUN npm install

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "index.js"]
