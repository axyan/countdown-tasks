MAKEFLAGS += --no-print-directory

.PHONY: all
all:
	@bash -c "trap '$(MAKE) down' EXIT; $(MAKE) up; $(MAKE) -j 2 --output-sync=target run"

.PHONY: run
run: up auth-service user-service

.PHONY: clean
clean: down auth-clean user-clean

.PHONY: auth-service
auth-service: up
	@$(MAKE) -C auth auth-service

.PHONY: auth-clean
auth-clean:
	@$(MAKE) -C auth clean

.PHONY: user-service
user-service: up
	@$(MAKE) -C user user-service

.PHONY: user-clean
user-clean:
	@$(MAKE) -C user clean

.PHONY: up
up:
	@echo "----------> Starting containers..."
	@docker compose up -d
	@sleep 3

.PHONY: down
down:
	@echo "----------> Stopping containers..."
	@docker compose down
