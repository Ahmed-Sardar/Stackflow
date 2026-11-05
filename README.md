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

## Render deployment

The repository includes a `render.yaml` Blueprint for one Render web service. The service builds the React frontend and serves it from Express alongside `/api`, keeping cookie authentication on the same origin. It uses Render's free web service plan in Singapore.

1. Create a MongoDB Atlas deployment and obtain an application connection string for a database such as `stockflow`. A local `mongodb://localhost` URI will not work from Render. Allow the Render service's outbound IP addresses in Atlas Network Access, as described in Render's MongoDB Atlas guide.
2. In Render, create a Blueprint from this GitHub repository. When prompted for `MONGODB_URI`, enter the Atlas URI in Render's environment settings; do not commit it. Render generates `JWT_SECRET` automatically.
3. Deploy and open the service's `onrender.com` URL. The frontend and backend share that URL. Check `/api/health` for a healthy API, then sign up or log in. Existing local MongoDB users and products are not automatically moved to Atlas.

The build command is `npm ci --include=dev && npm run build`; the start command is `npm run server`. Each push to the linked branch triggers a deploy. No separate frontend URL, proxy, or CORS configuration is needed in production.

## Vercel frontend with Render API

For a separate frontend on Vercel, use the repository root as the Vercel Root Directory (leave the setting blank), rather than `client`. The root contains `package.json`, `index.html`, and `vercel.json`. The build command is `npm run build` and the output directory is `dist`.

The included `vercel.json` forwards `/api/*` to `https://stackflow-je48.onrender.com/api/*` before applying the React Router fallback to `index.html`. Update that destination if the Render service URL changes. The browser continues to use same-origin requests and authentication cookies through Vercel; no client environment variables or CORS changes are needed. Keep `MONGODB_URI`, `JWT_SECRET`, and `NODE_ENV=production` configured on Render only.

Commit and push the configuration, then deploy that commit on Vercel. Verify `/api/health` on the Vercel domain returns JSON with `status: ok`, then test signing in. A `401` JSON response from `/api/auth/me` before signing in is expected; a `404` or an HTML response indicates API routing is still missing. Check that refreshing `/login` loads the app as well.

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
