.PHONY: all auth-service
all auth-service: run

.PHONY: build
build:
	@go build -o auth-service pkg/server/main.go

.PHONY: run
run: up build
	@echo "----------> Starting Auth Service..."
	@bash -c "trap '$(MAKE) clean --no-print-directory' EXIT; ./auth-service"

.PHONY: clean
clean: down
	@go clean
	@-rm auth-service || true

.PHONY: up
up:
	@echo "----------> Starting Auth Service containers..."
	@docker compose up -d

.PHONY: down
down:
	@echo "----------> Stopping Auth Service containers..."
	@docker compose down

.PHONY: redis-cli-auth
redis-cli-auth: up
	docker exec -it redis_auth_db redis-cli -a password
