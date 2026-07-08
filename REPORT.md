# 3D DZ — Algerian 3D Models Marketplace

A full-stack web application for browsing and ordering 3D models. Built with .NET 10 + React + Vite.

## Tech Stack

- **Backend**: .NET 10, Clean Architecture (Domain/Application/Infrastructure/Api), MongoDB, JWT Auth, BCrypt
- **Frontend**: React 19 + Vite 8, TypeScript, Tailwind CSS v4, Zustand, i18next, React Router v7
- **Design**: "Kinetic Dimension" — dark glassmorphism, orange accent `#ff6a3d`, Sora font

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Node.js 20+](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/) (local or Atlas)
- [Git](https://git-scm.com/)

## Setup

### 1. Clone & Configure

```bash
git clone <repo-url> 3d-dz
cd 3d-dz
```

### 2. Backend

```bash
cd backend

# Create .env from example (or copy to appsettings.Development.json)
cp .env.example src/ThreeDDz.Api/.env
# Edit .env with your MongoDB connection string and JWT secret

# Run
dotnet run --project src/ThreeDDz.Api/ThreeDDz.Api.csproj
```

The API starts at `http://localhost:5000` with seed data (admin account, sample products, categories, etc.).

**Default admin login**: `admin@3ddz.dz` / `Admin123!`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app opens at `http://localhost:5173`.

## Project Structure

```
backend/
  src/
    ThreeDDz.Domain/         # Entities, enums, interfaces
    ThreeDDz.Application/    # DTOs, service interfaces, mappings
    ThreeDDz.Infrastructure/ # MongoDB repos, services implementation, JWT
    ThreeDDz.Api/            # Controllers, middleware, Program.cs

frontend/
  src/
    core/                    # Zustand stores (auth, cart)
    data/
      repos/                 # API client methods (productRepo, cartRepo, etc.)
      types/                 # TypeScript interfaces
    presentation/
      features/              # Page components (Home, Catalog, Cart, Auth, Account, Admin)
      shared/                # Shared components (ProductCard, NotFound)
      i18n/                  # Internationalization (ar/en)
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register user |
| POST | `/api/auth/login` | No | Login |
| GET | `/api/auth/me` | Yes | Current user profile |
| PUT | `/api/auth/profile` | Yes | Update profile |
| GET | `/api/products` | No | List products |
| GET | `/api/products/{slug}` | No | Product detail |
| POST | `/api/products` | Admin | Create product |
| PUT | `/api/products/{id}` | Admin | Update product |
| DELETE | `/api/products/{id}` | Admin | Soft-delete product |
| PATCH | `/api/products/{id}/featured` | Admin | Toggle featured |
| GET | `/api/categories` | No | List categories |
| POST | `/api/categories` | Admin | Create category |
| PUT | `/api/categories/{id}` | Admin | Update category |
| DELETE | `/api/categories/{id}` | Admin | Delete category |
| GET | `/api/collections` | No | List collections |
| POST | `/api/collections` | Admin | Create collection |
| PUT | `/api/collections/{id}` | Admin | Update collection |
| DELETE | `/api/collections/{id}` | Admin | Delete collection |
| POST | `/api/cart/add` | Yes | Add to cart |
| GET | `/api/cart` | Yes | Get cart |
| PUT | `/api/cart/update` | Yes | Update cart item |
| DELETE | `/api/cart/remove/{productId}` | Yes | Remove from cart |
| POST | `/api/orders/place` | Yes | Place order |
| GET | `/api/orders/my` | Yes | My orders |
| GET | `/api/orders/{id}` | Yes | Order detail |
| POST | `/api/reviews` | Yes | Submit review |
| GET | `/api/reviews/product/{productId}` | No | Product reviews |
| GET | `/api/banners` | No | Active banners |
| POST | `/api/banners` | Admin | Create/update banner |
| DELETE | `/api/banners/{id}` | Admin | Delete banner |
| GET | `/api/admin/analytics` | Admin | Dashboard stats |
| GET | `/api/admin/orders` | Admin | All orders |
| GET | `/api/admin/orders/{id}` | Admin | Order detail |
| PUT | `/api/admin/orders/{id}/status` | Admin | Update order status |
| POST | `/api/admin/orders/{id}/notes` | Admin | Add internal note |
| GET | `/api/admin/customers` | Admin | Customer list |
| PATCH | `/api/admin/customers/{id}/ban` | Admin | Toggle customer ban |
| GET | `/api/admin/products` | Admin | All products (incl. deleted) |
| GET | `/api/admin/reviews/pending` | Admin | Pending reviews |
| PUT | `/api/admin/reviews/{id}/status` | Admin | Approve/reject review |

## Business Model

- **No payment gateway** — manual/offline order processing
- Single owner manages everything via admin dashboard
- Customers submit orders with name, phone, email, and wilaya (Algerian region)
- Admin processes orders outside the platform

## RTL Support

The app fully supports Arabic (RTL) and English. Switch via the language toggle in the top navigation bar.
