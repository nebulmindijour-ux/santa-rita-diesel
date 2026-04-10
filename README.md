# Santa Rita Diesel — Sistema de Gestão

Sistema corporativo premium para gestão logística e administrativa.

## Stack

- **Backend:** Python 3.12, FastAPI, SQLAlchemy 2, PostgreSQL 16 + PostGIS, Redis
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, TanStack Query
- **Infra:** Docker, Docker Compose, MinIO

## Pré-requisitos

- Git 2.30+
- Node.js 18+ (recomendado 20 LTS)
- Python 3.12+
- Docker + Docker Compose
- VS Code

## Setup Rápido

```bash
# 1. Clone o repositório
git clone <repo-url>
cd santa-rita-diesel

# 2. Copie as variáveis de ambiente
cp .env.example .env

# 3. Suba os serviços (PostgreSQL, Redis, MinIO)
docker compose up -d

# 4. Backend
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Linux/Mac
pip install -e ".[dev]"
alembic upgrade head
uvicorn src.main:app --reload

# 5. Frontend (novo terminal)
cd frontend
npm install
npm run dev
```

## Acessos Locais

| Serviço          | URL                          |
|------------------|------------------------------|
| Frontend         | http://localhost:5173        |
| Backend API      | http://localhost:8000        |
| API Docs         | http://localhost:8000/docs   |
| MinIO Console    | http://localhost:9001        |

## Estrutura

```
santa-rita-diesel/
├── backend/       # API FastAPI
├── frontend/      # Admin SPA React
├── portal/        # Portal externo do cliente
├── docs/          # Documentação
├── docker/        # Dockerfiles
└── docker-compose.yml
```

## Comandos Úteis

```bash
make up              # Sobe serviços Docker
make down            # Para serviços Docker
make logs            # Logs de todos os serviços
make test            # Testes backend
make lint            # Lint backend
make migrate         # Roda migrations
```
