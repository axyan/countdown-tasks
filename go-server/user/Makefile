.PHONY: all user-service
all user-service: run

.PHONY: install
install:
	which migrate || go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest

.PHONY: build
build:
	@go build -o user-service pkg/server/main.go

.PHONY: run
run: up build sleep migrate-up
	@echo "----------> Starting User Service..."
	@bash -c "trap '$(MAKE) clean --no-print-directory' EXIT; ./user-service"

# Used to delay migrations in run command above or else error since docker not fully up
.PHONY: sleep
sleep:
	@sleep 1.5

.PHONY: clean
clean: down
	@go clean
	@-rm user-service || true

.PHONY: migrate-up
migrate-up:
	@echo "----------> Starting database migrations..."
	migrate -path migrations -database postgres://user:password@localhost:5432/db?sslmode=disable up
	@echo "----------> Database migrations complete"

.PHONY: migrate-down
migrate-down:
	@echo "----------> Reversing database migrations..."
	migrate -path migrations -database postgres://user:password@localhost:5432/db?sslmode=disable down
	@echo "----------> Database migrations undone"

.PHONY: up
up:
	@echo "----------> Starting User Service containers..."
	@docker compose up -d

.PHONY: down
down:
	@echo "----------> Stopping User Service containers..."
	@docker compose down

.PHONY: postgres-cli-user
postgres-cli-user: up
	docker exec -it postgres_user_db psql -U user db
