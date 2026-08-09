# Bundles every optional system dependency (ffmpeg, poppler, qpdf, LibreOffice,
# yt-dlp, spotdl, rembg) so `docker compose up` gives every tool working out of
# the box — no manual `apt install` hunting. Trades a large image (~2GB) for
# that "it just works" guarantee, which is the point of a self-hosted tool app.
FROM node:22-bookworm-slim

# System deps: ffmpeg/poppler/qpdf/libreoffice for the heavier PDF/media tools,
# python3+pip for yt-dlp/spotdl/rembg, unzip for Puppeteer's Chrome download,
# and the Chromium runtime libs Puppeteer needs. Node 22+ is required —
# pdfjs-dist 6.x won't install on Node 20.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    poppler-utils \
    qpdf \
    libreoffice \
    python3 \
    python3-pip \
    unzip \
    ca-certificates \
    fonts-liberation \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

RUN pip3 install --break-system-packages --no-cache-dir yt-dlp spotdl rembg

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .

# Puppeteer needs its bundled Chromium — install it now that npm install has run.
RUN npx puppeteer browsers install chrome

ENV PORT=4500
EXPOSE 4500

CMD ["node", "index.js"]
