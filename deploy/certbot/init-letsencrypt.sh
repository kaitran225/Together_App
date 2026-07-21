#!/usr/bin/env bash
# One-time bootstrap to obtain the first Let's Encrypt certificate.
# Run from the repo root: bash deploy/certbot/init-letsencrypt.sh
#
# Why this exists: nginx refuses to start with `ssl_certificate` pointing at a file that
# doesn't exist yet, but certbot needs nginx running on port 80 to answer the HTTP-01
# challenge. This script breaks that chicken-and-egg loop with a throwaway dummy cert.
set -euo pipefail
cd "$(dirname "$0")/../.."

if [ ! -f .env ]; then
  echo "Missing .env — copy .env.docker.example to .env and fill it in first." >&2
  exit 1
fi
set -a; source .env; set +a

if [ -z "${DOMAIN:-}" ] || [ "$DOMAIN" = "your-subdomain.duckdns.org" ]; then
  echo "Set a real DOMAIN in .env first." >&2
  exit 1
fi

EMAIL="${LETSENCRYPT_EMAIL:-}"
STAGING="${LETSENCRYPT_STAGING:-0}"

echo "==> Creating dummy self-signed cert so nginx can boot for $DOMAIN"
docker compose run --rm --entrypoint "\
  mkdir -p /etc/letsencrypt/live/$DOMAIN && \
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout /etc/letsencrypt/live/$DOMAIN/privkey.pem \
    -out /etc/letsencrypt/live/$DOMAIN/fullchain.pem \
    -subj '/CN=localhost'" certbot

echo "==> Starting nginx with the dummy cert"
docker compose up -d nginx

echo "==> Deleting dummy cert and requesting the real one from Let's Encrypt"
docker compose run --rm --entrypoint "rm -rf /etc/letsencrypt/live/$DOMAIN /etc/letsencrypt/archive/$DOMAIN /etc/letsencrypt/renewal/$DOMAIN.conf" certbot

STAGING_ARG=""
if [ "$STAGING" = "1" ]; then
  STAGING_ARG="--staging"
  echo "==> Using Let's Encrypt STAGING (no rate limits, browsers won't trust the cert)"
fi

EMAIL_ARG="--register-unsafely-without-email"
if [ -n "$EMAIL" ]; then
  EMAIL_ARG="--email $EMAIL --no-eff-email"
fi

docker compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $STAGING_ARG $EMAIL_ARG \
    -d $DOMAIN --agree-tos --force-renewal" certbot

echo "==> Reloading nginx with the real cert"
docker compose exec nginx nginx -s reload

echo "==> Done. https://$DOMAIN should now serve a valid certificate."
echo "    The 'certbot' service in docker-compose.yml will keep renewing it automatically."
