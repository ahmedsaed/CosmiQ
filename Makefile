.PHONY: run check ruff database lint docker-build docker-build-dev docker-build-multi-test docker-build-multi-load docker-push docker-buildx-prepare docker-release api start-all stop-all status clean-cache docker-build-dev-clean docker-build-single-dev docker-build-single-multi-test docker-build-single docker-build-single-latest docker-release-single docker-release-both docker-release-all-versions

# Get version from pyproject.toml
VERSION := $(shell grep -m1 version pyproject.toml | cut -d'"' -f2)
IMAGE_NAME := lfnovo/open_notebook

PLATFORMS=linux/amd64,linux/arm64

database:
	docker compose up -d surrealdb

run:
	@echo "⚠️  Warning: Starting UI only. For full functionality, use 'make start-all'"
	@echo "🌐 Starting Next.js UI on http://localhost:3000..."
	cd app && npm run dev

lint:
	uv run python -m mypy .

ruff:
	ruff check . --fix

# buildx config for multi-plataform
docker-buildx-prepare:
	docker buildx create --use --name multi-platform-builder --driver docker-container || \
	docker buildx use multi-platform-builder

# Single-platform build for development (much faster)
docker-build-dev:
	docker build \
		-t $(IMAGE_NAME):$(VERSION)-dev \
		.

# Multi-platform build test (builds both platforms, doesn't load or push)
docker-build-multi-test: docker-buildx-prepare
	docker buildx build --pull \
		--platform $(PLATFORMS) \
		-t $(IMAGE_NAME):$(VERSION)-multi \
		.

# Load current platform only from multi-platform build
docker-build-multi-load: docker-buildx-prepare
	docker buildx build --pull \
		--platform linux/amd64 \
		-t $(IMAGE_NAME):$(VERSION)-multi \
		--load \
		.

# multi-plataform build with buildx (pushes to registry)
docker-build: docker-buildx-prepare
	docker buildx build --pull \
		--platform $(PLATFORMS) \
		-t $(IMAGE_NAME):$(VERSION) \
		--push \
		.

# Build and push combined
docker-release: docker-build

# Check supported platforms
docker-check-platforms:
	docker manifest inspect $(IMAGE_NAME):$(VERSION)

docker-update-latest: docker-buildx-prepare
	docker buildx build \
		--platform $(PLATFORMS) \
		-t $(IMAGE_NAME):latest \
		--push \
		.

# Release with latest
docker-release-all: docker-release docker-update-latest

tag:
	@version=$$(grep '^version = ' pyproject.toml | sed 's/version = "\(.*\)"/\1/'); \
	echo "Creating tag v$$version"; \
	git tag "v$$version"; \
	git push origin "v$$version"


dev:
	docker compose -f docker-compose.dev.yml up --build 

full:
	docker compose -f docker-compose.full.yml up --build 


api:
	uv run run_api.py

# === Frontend Management ===
.PHONY: ui ui-install ui-build ui-dev

ui: ui-dev

ui-install:
	@echo "📦 Installing Next.js dependencies..."
	cd app && npm install

ui-build:
	@echo "🔨 Building Next.js production bundle..."
	cd app && npm run build

ui-dev:
	@echo "🌐 Starting Next.js development server..."
	cd app && npm run dev

# === Worker Management ===
.PHONY: worker worker-start worker-stop worker-restart

worker: worker-start

worker-start:
	@echo "Starting surreal-commands worker..."
	uv run --env-file .env surreal-commands-worker --import-modules commands

worker-stop:
	@echo "Stopping surreal-commands worker..."
	pkill -f "surreal-commands-worker" || true

worker-restart: worker-stop
	@sleep 2
	@$(MAKE) worker-start

# === Service Management ===
start-all:
	@echo "🚀 Starting CosmiQ (Database + API + Worker + UI)..."
	@echo "📊 Starting SurrealDB..."
	@docker compose up -d surrealdb
	@sleep 3
	@echo "🔧 Starting API backend..."
	@uv run run_api.py &
	@sleep 3
	@echo "⚙️ Starting background worker..."
	@uv run --env-file .env surreal-commands-worker --import-modules commands &
	@sleep 2
	@echo "🌐 Starting Next.js UI..."
	@echo "✅ All services started!"
	@echo "📱 UI: http://localhost:3000"
	@echo "🔗 API: http://localhost:5055"
	@echo "📚 API Docs: http://localhost:5055/docs"
	cd app && npm run dev

stop-all:
	@echo "🛑 Stopping all CosmiQ services..."
	@pkill -f "next dev" || true
	@pkill -f "surreal-commands-worker" || true
	@pkill -f "run_api.py" || true
	@pkill -f "uvicorn api.main:app" || true
	@docker compose down
	@echo "✅ All services stopped!"

status:
	@echo "📊 CosmiQ Service Status:"
	@echo "Database (SurrealDB):"
	@docker compose ps surrealdb 2>/dev/null || echo "  ❌ Not running"
	@echo "API Backend:"
	@pgrep -f "run_api.py\|uvicorn api.main:app" >/dev/null && echo "  ✅ Running" || echo "  ❌ Not running"
	@echo "Background Worker:"
	@pgrep -f "surreal-commands-worker" >/dev/null && echo "  ✅ Running" || echo "  ❌ Not running"
	@echo "Next.js UI:"
	@pgrep -f "next dev" >/dev/null && echo "  ✅ Running" || echo "  ❌ Not running"

# Clean up cache directories to reduce build context size
clean-cache:
	@echo "🧹 Cleaning cache directories..."
	@find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
	@find . -name ".mypy_cache" -type d -exec rm -rf {} + 2>/dev/null || true
	@find . -name ".ruff_cache" -type d -exec rm -rf {} + 2>/dev/null || true
	@find . -name ".pytest_cache" -type d -exec rm -rf {} + 2>/dev/null || true
	@find . -name "*.pyc" -type f -delete 2>/dev/null || true
	@find . -name "*.pyo" -type f -delete 2>/dev/null || true
	@find . -name "*.pyd" -type f -delete 2>/dev/null || true
	@echo "✅ Cache directories cleaned!"

# Fast development build with cache cleanup
docker-build-dev-clean: clean-cache docker-build-dev

# === Single Container Builds ===
# Single-container build for development (much faster)
docker-build-single-dev:
	docker build \
		-f Dockerfile.single \
		-t $(IMAGE_NAME):$(VERSION)-single-dev \
		.

# Single-container multi-platform build test
docker-build-single-multi-test: docker-buildx-prepare
	docker buildx build --pull \
		--platform $(PLATFORMS) \
		-f Dockerfile.single \
		-t $(IMAGE_NAME):$(VERSION)-single-multi \
		.

# Single-container multi-platform build with buildx (pushes to registry)
docker-build-single: docker-buildx-prepare
	docker buildx build --pull \
		--platform $(PLATFORMS) \
		-f Dockerfile.single \
		-t $(IMAGE_NAME):$(VERSION)-single \
		--push \
		.

# Single-container build and push with latest tag
docker-build-single-latest: docker-buildx-prepare
	docker buildx build --pull \
		--platform $(PLATFORMS) \
		-f Dockerfile.single \
		-t $(IMAGE_NAME):latest-single \
		--push \
		.

# Single-container release (both versioned and latest)
docker-release-single: docker-build-single docker-build-single-latest

# Release both multi-container and single-container versions
docker-release-both: docker-release docker-release-single

# Release all versions (both multi and single with latest tags)
docker-release-all-versions: docker-release-all docker-release-single