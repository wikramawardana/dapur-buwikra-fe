# Dapur Bu Wikra

**Restaurant Order Management & Admin Platform**

> A streamlined order management system for Dapur Bu Wikra -- handling menus, pricing, weekly orders, and business analytics all in one place.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

<!-- Add screenshot here -->

---

## Overview

Dapur Bu Wikra is a purpose-built order management platform for a home-based food business. It provides both an admin panel for managing menus, pricing, and users, and a customer-facing order flow with week-based tracking, status filtering, and export capabilities.

## Features

- **Order Management** -- Create, view, filter, and paginate orders with status tracking
- **Week-Based Order Tracking** -- Organize orders by week for easy batch processing
- **Admin Panel** -- Full CRUD for menus, pricelist items, and user management
- **Dashboard Analytics** -- Revenue, order count, and trend charts with Recharts
- **Order Export** -- Export orders to markdown format for reporting
- **Image Capture** -- Generate order summaries as images via html2canvas
- **Role-Based Access** -- Separate admin and user views with permission guards
- **Carousel Views** -- Browse menus with Embla Carousel
- **SSO Authentication** -- Centralized login via OIDC provider
- **API Collection** -- Included Postman collection for API testing

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4, Radix UI, shadcn/ui |
| Charts | Recharts |
| Tables | TanStack Table |
| Forms | React Hook Form + Zod |
| Carousel | Embla Carousel |
| Auth | better-auth (OIDC client) |
| Database | PostgreSQL with pg |
| Quality | Husky + lint-staged + Biome |
| Deployment | Docker (multi-stage build) |

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm
- PostgreSQL 15+
- Running instance of [wikramawardana/auth](https://github.com/wikramawardana/auth)

### Installation

```bash
git clone https://github.com/wikramawardana/dapur-buwikra-fe.git
cd dapur-buwikra-fe
pnpm install
```

### Environment Variables

Create a `.env` file:

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# BetterAuth
BETTER_AUTH_SECRET=your-secret-here

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/dapur-buwikra

# Auth service (OIDC provider)
NEXT_PUBLIC_AUTH_URL=http://localhost:3001
AUTH_CLIENT_ID=dapur-buwikra
AUTH_CLIENT_SECRET=your-client-secret-from-auth-dashboard
```

### Development

```bash
pnpm dev
```

The app starts at `http://localhost:3000`.

### API Testing

A Postman collection is included at the project root:

```
dapur-buwikra.postman_collection.json
```

Import it into Postman to test all API endpoints.

## Production Deployment

Production image tags use the short git SHA. After you push to `main`, GitHub
Actions builds and pushes `ghcr.io/wikramawardana/dapur-buwikra-fe:<short-sha>`.
If the build succeeds, the workflow automatically updates GitOps:

`wikra-gitops/manifests/dapur-buwikra-fe/overlays/prod/kustomization.yaml`

So the normal flow is:

1. Edit this repo.
2. Commit and push to `main`.
3. Wait for the GitHub Actions build to succeed.
4. Confirm the workflow committed the new GitOps `newTag`.
5. Wait for Argo CD to show `dapur-buwikra-fe` as `Synced` and `Healthy`.

## Docker Deployment

### Build

```bash
docker build \
  --build-arg NEXT_PUBLIC_APP_URL=https://dapur.yourdomain.com \
  --build-arg NEXT_PUBLIC_AUTH_URL=https://auth.yourdomain.com \
  -t dapur-buwikra-fe .
```

### Run

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/dapur-buwikra \
  -e BETTER_AUTH_SECRET=your-production-secret \
  -e AUTH_CLIENT_ID=dapur-buwikra \
  -e AUTH_CLIENT_SECRET=your-secret \
  dapur-buwikra-fe
```

### Docker Compose

```bash
# Development
docker compose up -d

# Production
docker compose -f docker-compose.prod.yml up -d
```

## Architecture

```
src/
├── app/
│   ├── (auth)/             # Auth-related routes (login, callback)
│   ├── (admin)/            # Admin panel (menus, pricelist, users)
│   ├── (dashboard)/        # Main dashboard with analytics
│   ├── (orders)/           # Order management pages
│   └── api/                # API routes
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   └── ...                 # Feature-specific components
├── hooks/                  # Custom React hooks
├── lib/
│   ├── auth-client.ts      # better-auth client setup
│   └── services/           # Service layer (DB queries)
└── middleware.ts           # Auth + role guard middleware
```

**Key Patterns:**
- Route groups for logical separation of admin, orders, and dashboard
- Service layer pattern for database operations
- Custom hooks for data fetching and state management
- Middleware-based auth with role-based route protection
- Pre-commit hooks via Husky + lint-staged for code quality

## Authentication

This app authenticates users via the centralized [Auth Server](https://github.com/wikramawardana/auth) using OpenID Connect. Admin and user roles are managed centrally, enabling fine-grained access control.

## Related Projects

| Project | Description |
|---------|-------------|
| [auth](https://github.com/wikramawardana/auth) | Central SSO/OIDC identity provider |
| [expense-tracker-fe](https://github.com/wikramawardana/expense-tracker-fe) | Personal finance tracker |
| [starport](https://github.com/wikramawardana/starport) | Docker container dashboard |
| [roamly](https://github.com/wikramawardana/roamly) | Travel trip planner |

## License

[MIT](LICENSE)
