#!/usr/bin/env bash
# 보배드림 촬영 키트 서버 설치(2026-11-06). Ubuntu 24.04 · root 로 실행.
# 준비된 것: nginx 1.24 · PHP 8.4(FPM) · Composer · PostgreSQL 15 · Redis(이 서버는 안 씀)
# 하는 일: 저장소 받기 → composer → DB(shoot_api/shoot_app) → .env → migrate · storage:link → nginx → https(sslip.io + certbot)
# 다시 실행해도 안전하다(이미 있는 것은 건너뜀). 배포본만 바꾸려면: bash deploy/server-setup.sh update
set -euo pipefail

HOST="${SHOOT_HOST:-121-78-125-73.sslip.io}"
REPO="${SHOOT_REPO:-https://github.com/bobaekimboae/bobaedream.git}"
DIR=/var/www/bobaedream
API="$DIR/shootkit-api"
DB=shoot_api
DBUSER=shoot_app

if [ "${1:-}" = "update" ]; then
  cd "$DIR" && git pull --ff-only
  cd "$API" && composer install --no-dev --no-interaction --optimize-autoloader -q
  php artisan migrate --force
  php artisan config:clear -q && php artisan route:clear -q
  chown -R www-data:www-data storage bootstrap/cache
  echo "갱신 완료: $(git -C "$DIR" rev-parse --short HEAD)"
  exit 0
fi

echo "[1/6] 저장소"
apt-get install -y -q git certbot python3-certbot-nginx >/dev/null
if [ ! -d "$DIR/.git" ]; then
  git clone --depth 1 "$REPO" "$DIR"
else
  git -C "$DIR" pull --ff-only
fi
cd "$API"
composer install --no-dev --no-interaction --optimize-autoloader -q

echo "[2/6] 데이터베이스 $DB"
DBPASS_FILE=/root/.shoot_db_pass
if [ ! -f "$DBPASS_FILE" ]; then
  openssl rand -base64 33 | tr -d '/+=' > "$DBPASS_FILE"; chmod 600 "$DBPASS_FILE"
fi
DBPASS=$(cat "$DBPASS_FILE")
sudo -u postgres psql -v ON_ERROR_STOP=1 -tc "SELECT 1 FROM pg_roles WHERE rolname='$DBUSER'" | grep -q 1 || \
  sudo -u postgres psql -v ON_ERROR_STOP=1 -c "CREATE USER $DBUSER WITH PASSWORD '$DBPASS';"
sudo -u postgres psql -v ON_ERROR_STOP=1 -tc "SELECT 1 FROM pg_database WHERE datname='$DB'" | grep -q 1 || \
  sudo -u postgres psql -v ON_ERROR_STOP=1 -c "CREATE DATABASE $DB OWNER $DBUSER;"

echo "[3/6] .env"
if [ ! -f .env ]; then
cat > .env <<ENV
APP_NAME=bobaedream-shootkit
APP_ENV=production
APP_DEBUG=false
APP_KEY=
APP_URL=https://$HOST
LOG_CHANNEL=daily
LOG_LEVEL=info
CACHE_STORE=file
SESSION_DRIVER=array
FILESYSTEM_DISK=public

# 촬영 키트
SHOOT_STORE=db
SHOOT_UPLOAD=direct
SHOOT_ORIGINS=https://bobaekimboae.github.io,https://dev.bbmuseum.co.kr,http://localhost:5191,http://127.0.0.1:5191

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=$DB
DB_USERNAME=$DBUSER
DB_PASSWORD=$DBPASS
ENV
  php artisan key:generate --force -q
fi
mkdir -p storage/app/public storage/framework/{cache,views,sessions} storage/logs bootstrap/cache
php artisan migrate --force
php artisan storage:link >/dev/null 2>&1 || true
chown -R www-data:www-data storage bootstrap/cache
chmod -R u+rwX,g+rwX storage bootstrap/cache

echo "[4/6] PHP 업로드 한도"
PHPINI=/etc/php/8.4/fpm/conf.d/90-shootkit.ini
cat > "$PHPINI" <<INI
upload_max_filesize = 320M
post_max_size = 320M
max_execution_time = 300
memory_limit = 256M
INI
systemctl reload php8.4-fpm

echo "[5/6] nginx"
sed "s/121-78-125-73.sslip.io/$HOST/g" deploy/nginx-shootkit.conf > /etc/nginx/sites-available/shootkit
ln -sf /etc/nginx/sites-available/shootkit /etc/nginx/sites-enabled/shootkit
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "[6/6] https ($HOST)"
if [ ! -d "/etc/letsencrypt/live/$HOST" ]; then
  certbot --nginx -d "$HOST" --non-interactive --agree-tos --register-unsafely-without-email --redirect
else
  echo "인증서 있음"
fi

echo
echo "확인: curl -s https://$HOST/api/health"
curl -s "https://$HOST/api/health" || true
echo
echo "촬영 키트: https://bobaekimboae.github.io/bobaedream/nuxt-shootkit/  (서버 주소는 화면 코드에 들어 있음)"
