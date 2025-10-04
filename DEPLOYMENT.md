# Deployment Guide

## Configuring the Backend API URL

The Next.js frontend needs to know where to find the backend API. This is configured using the `NEXT_PUBLIC_API_URL` environment variable.

### Local Development

For local development, the default is `http://localhost:5055`:

```bash
cd app
npm run dev
```

### Docker Deployment

#### Option 1: Using Default (Same Host)

By default, the Docker build assumes the API is accessible at `http://localhost:5055`. This works when:
- Users access the UI and API on the same machine
- You're running locally or using port forwarding

```bash
docker compose up -d --build
```

#### Option 2: Configure Custom API URL

For production deployments where your server has a domain name or public IP:

1. **Set environment variable before building:**

```bash
# For your domain
export NEXT_PUBLIC_API_URL=https://your-domain.com:5055

# Or for a public IP
export NEXT_PUBLIC_API_URL=http://192.168.1.100:5055

# Then build
docker compose up -d --build
```

2. **Or create a `.env` file in the project root:**

```bash
# .env file
NEXT_PUBLIC_API_URL=https://your-domain.com:5055
```

Then run:
```bash
docker compose up -d --build
```

#### Option 3: Using a Reverse Proxy (Recommended for Production)

The best approach for production is to use a reverse proxy (like Nginx or Caddy) to serve both the frontend and API under the same domain:

```
https://your-domain.com/        → Next.js (port 3000)
https://your-domain.com/api/    → FastAPI (port 5055)
```

Then set:
```bash
NEXT_PUBLIC_API_URL=https://your-domain.com
```

This eliminates CORS issues and provides a cleaner URL structure.

### Important Notes

⚠️ **The `NEXT_PUBLIC_API_URL` is baked into the JavaScript bundle at build time.**

This means:
- You must rebuild the Docker image if you change the API URL
- You cannot change it by just restarting the container
- Different deployments (staging, production) need separate builds

### Verifying the Configuration

After deployment, check the browser console in the Network tab to see which URL the app is calling. If you see errors like "Failed to fetch" or CORS errors, you likely need to:

1. Update the `NEXT_PUBLIC_API_URL` to use the correct domain/IP
2. Rebuild the Docker image
3. Ensure the API port (5055) is accessible from where users access the frontend

### Multi-Container vs Single-Container

- **Multi-container** (`docker-compose.yml`): Separate containers for SurrealDB and the application
- **Single-container** (`docker-compose.single.yml`): Everything in one container including SurrealDB

Both support the same `NEXT_PUBLIC_API_URL` configuration.
