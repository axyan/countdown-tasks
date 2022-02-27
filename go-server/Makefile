MAKEFLAGS := --jobs=2

.PHONY: all
all: up auth-service user-service

.PHONY: clean
clean: down auth-clean user-clean

.PHONY: auth-service
auth-service:
	$(MAKE) -C auth auth-service

.PHONY: auth-clean
auth-clean:
	$(MAKE) -C auth clean

.PHONY: user-service
user-service:
	$(MAKE) -C user user-service

.PHONY: user-clean
user-clean:
	$(MAKE) -C user clean

.PHONY: up
up:
	docker compose up -d

.PHONY: down
down:
	docker compose down
