#!/bin/sh
set -e

if [ ! -f .env ]; then
  cp .env.example .env
fi

if [ -z "$(grep '^APP_KEY=base64' .env || true)" ]; then
  php artisan key:generate --force
fi

echo "Waiting for database..."
until php artisan migrate --force 2>/dev/null; do
  sleep 3
done

php artisan db:seed --class=Database\\Seeders\\CatalogSeeder --force || true

php artisan serve --host=0.0.0.0 --port=8000
