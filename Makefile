# Entry point for development commands. Node / pnpm exist only inside the container (docker/compose.yaml):
# the host goes through docker compose, and a container terminal calls pnpm directly.

.DEFAULT_GOAL := help

COMPOSE := docker compose -f docker/compose.yaml

ifdef IN_CONTAINER
PNPM := pnpm --dir $(CURDIR)
else
PNPM := $(COMPOSE) run --rm workspace pnpm
endif

# Targets that operate docker are host only (there is no docker inside the container)
define host_only
	@if [ -n "$$IN_CONTAINER" ]; then echo "run make $@ on the host" >&2; exit 1; fi
endef

.PHONY: help
help: ## Show the list of targets
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*## "} {printf "  make %-12s %s\n", $$1, $$2}'

.PHONY: setup
setup: ## Build the image and install dependencies (first time, and when the Dockerfile changes)
	$(host_only)
	@# workspace and dev share the same image, so build only one
	$(COMPOSE) build workspace
	$(MAKE) install

.PHONY: install
install: ## pnpm install (when package.json / lockfile change)
	$(PNPM) install

.PHONY: up
up: ## Start the dev server in the background (http://localhost:4321)
	$(host_only)
	$(COMPOSE) up -d --wait dev

.PHONY: down
down: ## Stop the containers
	$(host_only)
	$(COMPOSE) down

.PHONY: logs
logs: ## Follow the dev server logs
	$(host_only)
	$(COMPOSE) logs -f dev

.PHONY: build
build: ## Build the site (dist/)
	$(PNPM) run build

.PHONY: typecheck
typecheck: ## Typecheck (astro check)
	$(PNPM) run typecheck

.PHONY: lint
lint: ## Check with Biome
	$(PNPM) run lint

.PHONY: fix
fix: ## Auto-fix with Biome
	$(PNPM) run lint:fix

.PHONY: test
test: ## Run the unit tests (node --test)
	$(PNPM) run test

.PHONY: check
check: ## Typecheck, lint, test and build (what CI runs, minus zizmor)
	$(PNPM) run check

.PHONY: pnpm
pnpm: ## Any pnpm command (example: make pnpm ARGS="add -D foo")
	$(PNPM) $(ARGS)

.PHONY: sh
sh: ## Open a shell in the container
	$(host_only)
	$(COMPOSE) run --rm workspace bash

.PHONY: clean
clean: ## Remove the containers and volumes (node_modules and pnpm store)
	$(host_only)
	$(COMPOSE) down -v
