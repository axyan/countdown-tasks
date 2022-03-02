.PHONY: all run test clean up down blacklist-redis-cli user-mongodb-cli

all: run

run: up
	bash -c "trap 'make down' EXIT; npm run dev"

test:
	docker compose up -d redis
	npm run test

clean: down

up:
	docker compose up -d

down:
	docker compose down

blacklist-redis-cli: up
	docker exec -it redis_blacklist_db redis-cli

user-mongodb-cli: up
	docker exec -it mongo_user_db mongo admin -u root -p password
