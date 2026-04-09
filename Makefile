.PHONY: help up down build logs db-shell redis-shell backend-shell frontend-shell lint test migrate

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# --- Docker ---
up: ## Start all services
	docker compose up -d

down: ## Stop all services
	docker compose down

build: ## Build all services
	docker compose build

logs: ## Tail all logs
	docker compose logs -f

logs-backend: ## Tail backend logs
	docker compose logs -f backend

logs-frontend: ## Tail frontend logs
	docker compose logs -f frontend

# --- Shells ---
db-shell: ## Open PostgreSQL shell
	docker compose exec postgres psql -U srd_app -d santa_rita_diesel

redis-shell: ## Open Redis shell
	docker compose exec redis redis-cli

backend-shell: ## Open backend container shell
	docker compose exec backend bash

# --- Backend ---
migrate: ## Run database migrations
	docker compose exec backend alembic upgrade head

migrate-generate: ## Generate new migration (usage: make migrate-generate msg="description")
	docker compose exec backend alembic revision --autogenerate -m "$(msg)"

lint: ## Run backend linting
	cd backend && ruff check src/ tests/ && ruff format --check src/ tests/

lint-fix: ## Fix backend linting
	cd backend && ruff check --fix src/ tests/ && ruff format src/ tests/

type-check: ## Run mypy type checking
	cd backend && mypy src/

test: ## Run backend tests
	cd backend && pytest tests/ -v

test-unit: ## Run backend unit tests
	cd backend && pytest tests/unit/ -v

test-integration: ## Run backend integration tests
	cd backend && pytest tests/integration/ -v

# --- Frontend ---
frontend-dev: ## Start frontend dev server
	cd frontend && npm run dev

frontend-build: ## Build frontend
	cd frontend && npm run build

frontend-lint: ## Lint frontend
	cd frontend && npm run lint

frontend-test: ## Test frontend
	cd frontend && npm run test
