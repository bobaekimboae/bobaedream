.PHONY: setup test analyse format doctor up down

setup:
	cp .env.example .env
	docker compose up -d --build
	docker compose exec app composer install
	docker compose exec app php artisan key:generate
	docker compose exec app php artisan migrate --seed

test:
	docker compose exec app php artisan test
	node --test tests-contract/*.test.mjs

analyse:
	docker compose exec app vendor/bin/phpstan analyse

format:
	docker compose exec app vendor/bin/pint

doctor:
	docker compose exec app php artisan category-admin:doctor
	docker compose exec app php artisan route:list

up:
	docker compose up -d

down:
	docker compose down
