#!/usr/bin/env bash
# Apply nginx site config on the VPS.
set -euo pipefail

install -d /var/www/certbot
install -m 644 /tmp/together.conf /etc/nginx/sites-available/together
ln -sfn /etc/nginx/sites-available/together /etc/nginx/sites-enabled/together
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable --now nginx
systemctl reload nginx
echo "nginx ok"
curl -s -H "Host: togetherexe.duckdns.org" http://127.0.0.1/actuator/health
echo
curl -s http://togetherexe.duckdns.org/actuator/health
echo
