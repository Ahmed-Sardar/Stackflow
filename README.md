# StockFlow MVP

StockFlow is a multi-tenant inventory management MVP built with React, Express, and MongoDB.

## Manual setup

1. Install dependencies with `npm install`.
2. Start a MongoDB instance or use a MongoDB connection string.
3. Set `MONGODB_URI` and a long, random `JWT_SECRET` in the workspace `.env` file or `server/.env`. The server loads these files automatically. `PORT` is optional and defaults to `4000`. Do not commit secrets.
4. Start the API with `npm run server`.
5. In another terminal, start the frontend with `npm run dev` and open the URL shown by Vite. The npm scripts are defined in the workspace root `package.json`; npm can find that package even when your terminal is in `client`.

The Vite development server proxies `/api` to `http://localhost:4000`. If you set a different API port, update the proxy target in `vite.config.js` to match. The frontend and API should be served from the same origin for cookie authentication; the proxy handles this during development.

The backend exits with a clear message if required configuration is missing. The workspace `.env` is ignored by Git.

## API

All responses use `{ "data": ... }` on success and `{ "error": "..." }` on failure. Authentication is stored in an HTTP-only, SameSite cookie.

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET, POST /api/products`
- `GET, PUT, DELETE /api/products/:id`
- `GET /api/dashboard/overview`
- `GET, PUT /api/settings`

All private endpoints derive the organization ID from the authenticated user. Product queries, updates, and deletes are scoped to that ID. MongoDB enforces unique SKUs within each organization.
