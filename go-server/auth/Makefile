.PHONY: all auth-service
all auth-service: run

.PHONY: build
build:
	go build -o auth-service pkg/server/main.go

.PHONY: run
run: up build
	bash -c "trap 'make clean' EXIT; ./auth-service"

.PHONY: clean
clean: down
	go clean
	rm auth-service

.PHONY: up
up:
	docker compose up -d

.PHONY: down
down:
	docker compose down

.PHONY: redis-cli-auth
redis-cli-auth: up
	docker exec -it redis_auth_db redis-cli -a password
