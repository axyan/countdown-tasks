.PHONY: all user-service
all user-service: run

.PHONY: install
install:
	which migrate || go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest

.PHONY: build
build:
	go build -o user-service pkg/server/main.go

.PHONY: run
run: up build sleep-1 migrate-up
	bash -c "trap 'make clean' EXIT; ./user-service"

.PHONY: sleep-1
# Used to delay migrations in run command above or else error since docker not fully up
sleep-1:
	sleep 1.5

.PHONY: clean
clean: down
	go clean
	rm user-service

.PHONY: migrate-up
migrate-up:
	migrate -path migrations -database postgres://user:password@localhost:5432/db?sslmode=disable up

.PHONY: migrate-down
migrate-down:
	migrate -path migrations -database postgres://user:password@localhost:5432/db?sslmode=disable down

.PHONY: up
up:
	docker compose up -d

.PHONY: down
down:
	docker compose down

.PHONY: postgres-cli-user
postgres-cli-user:
	docker exec -it postgres_user_db psql -U user db
