.PHONY: all
all:
	@bash -c "trap '$(MAKE) down --no-print-directory' EXIT; $(MAKE) up --no-print-directory; sleep 3; $(MAKE) -j 2 --output-sync=target run --no-print-directory"

.PHONY: run
run: up auth-service user-service

.PHONY: clean
clean: down auth-clean user-clean

.PHONY: auth-service
auth-service:
	@$(MAKE) -C auth auth-service --no-print-directory

.PHONY: auth-clean
auth-clean:
	@$(MAKE) -C auth clean --no-print-directory

.PHONY: user-service
user-service:
	@$(MAKE) -C user user-service --no-print-directory

.PHONY: user-clean
user-clean:
	@$(MAKE) -C user clean --no-print-directory

.PHONY: up
up:
	@echo "----------> Starting containers..."
	@docker compose up -d

.PHONY: down
down:
	@echo "----------> Stopping containers..."
	@docker compose down
