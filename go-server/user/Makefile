postgres-cli-user:
	docker exec -it postgres_user_db psql -U user db

migrate-up:
	migrate -path db/migrations -database postgres://user:password@localhost:5432/db?sslmode=disable up

migrate-down:
	migrate -path db/migrations -database postgres://user:password@localhost:5432/db?sslmode=disable down
