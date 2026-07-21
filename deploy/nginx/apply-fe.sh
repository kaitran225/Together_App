#!/usr/bin/env bash
set -euo pipefail

install -d /var/www/together-fe /var/www/certbot

if [ -d /tmp/together-fe-dist ]; then
  find /var/www/together-fe -mindepth 1 -delete
  cp -a /tmp/together-fe-dist/. /var/www/together-fe/
  echo "fe installed"
fi

# Prefer full HTTPS config if certs exist; else keep HTTP-only.
if [ -f /etc/letsencrypt/live/togetherexe.duckdns.org/fullchain.pem ]; then
  install -m 644 /tmp/together.conf /etc/nginx/sites-available/together
else
  echo "WARN: no LE cert found; not overwriting site with HTTPS template"
fi

ln -sfn /etc/nginx/sites-available/together /etc/nginx/sites-enabled/together
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
echo "nginx ok"
curl -s -o /dev/null -w "fe=%{http_code}\n" https://togetherexe.duckdns.org/
curl -s https://togetherexe.duckdns.org/actuator/health
echo
