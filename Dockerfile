# Build stage for Python
FROM python:3.12-slim-bookworm AS python-builder

# Install uv using the official method
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Install system dependencies required for building certain Python packages
RUN apt-get update && apt-get upgrade -y && apt-get install -y \
    gcc g++ git make \
    libmagic-dev \
    && rm -rf /var/lib/apt/lists/*

# Set build optimization environment variables
ENV MAKEFLAGS="-j$(nproc)"
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy

# Set the working directory in the container to /app
WORKDIR /app

# Copy dependency files and minimal package structure first for better layer caching
COPY pyproject.toml uv.lock ./
COPY open_notebook/__init__.py ./open_notebook/__init__.py

# Install dependencies with optimizations (this layer will be cached unless dependencies change)
RUN uv sync --frozen --no-dev

# Copy the rest of the application code
COPY . /app

# Build stage for Next.js
FROM node:20-slim AS nextjs-builder

WORKDIR /app/frontend

# Copy package files
COPY app/package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the Next.js app
COPY app/ ./

# Build the Next.js app
RUN npm run build

# Runtime stage
FROM python:3.12-slim-bookworm AS runtime

# Install only runtime system dependencies (no build tools)
RUN apt-get update && apt-get upgrade -y && apt-get install -y \
    libmagic1 \
    ffmpeg \
    supervisor \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js for running Next.js
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install uv using the official method
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Set the working directory in the container to /app
WORKDIR /app

# Copy the virtual environment from python builder stage
COPY --from=python-builder /app/.venv /app/.venv

# Copy the application code
COPY --from=python-builder /app /app

# Copy the built Next.js app from nextjs builder stage
COPY --from=nextjs-builder /app/frontend/.next /app/app/.next
COPY --from=nextjs-builder /app/frontend/node_modules /app/app/node_modules
COPY --from=nextjs-builder /app/frontend/package*.json /app/app/
COPY --from=nextjs-builder /app/frontend/next.config.js /app/app/

# Expose ports for Next.js and API
EXPOSE 3000 5055

RUN mkdir -p /app/data

# Copy supervisord configuration
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Create log directories
RUN mkdir -p /var/log/supervisor

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
