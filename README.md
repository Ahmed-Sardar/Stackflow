# StockFlow MVP

StockFlow is a multi-tenant inventory management MVP built with React, Express, and MongoDB.

## Manual setup

1. Install dependencies with `npm install`.
2. Start a MongoDB instance or use a MongoDB connection string.
3. Copy `server/.env.example` to `server/.env` if that file does not already exist. Set `MONGODB_URI` and a long, random `JWT_SECRET` there. The server also supports a workspace `.env`; existing process environment variables take precedence over both files. `PORT` is optional and defaults to `4000`. Do not commit secrets.
4. Start the API with `npm run server`.
5. In another terminal, start the frontend with `npm run dev` and open the URL shown by Vite. The npm scripts are defined in the workspace root `package.json`; npm can find that package even when your terminal is in `client`.

Copy `client/.env.example` to `client/.env` if that file does not already exist. Its only setting is `VITE_API_URL=/api`, which is also the default when unset. Vite loads frontend environment files from `client/`. Restart Vite after changing environment files; deployed values are baked into the frontend at build time.

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

Deploy Render first using the steps above, then copy its public service URL from the Render dashboard. Open `https://YOUR-SERVICE.onrender.com/api/health` and confirm it returns `{"data":{"status":"ok"}}`.

From this repository, run the following with your actual new Render URL:

```sh
npm run configure:render -- https://YOUR-SERVICE.onrender.com
```

This updates the `/api/*` destination in `vercel.json` while preserving the React Router fallback to `index.html`. The old service URL has been removed; the checked-in placeholder must be replaced before Vercel deployment. Vercel builds fail with a configuration message if that placeholder is still present. The hostname is public configuration and can be committed.

The browser continues to use same-origin requests and authentication cookies through Vercel. Keep `VITE_API_URL=/api` in `client/.env`. In Vercel's Environment Variables, either leave `VITE_API_URL` unset (the default is `/api`) or set it to `/api` for each environment you deploy. Remove any old value pointing directly at Render, then create a new deployment. Hosted environment variables override `.env` files. No CORS changes are needed with this proxy setup.

Set `MONGODB_URI`, `JWT_SECRET`, and `NODE_ENV=production` on Render only. When using the Blueprint, Render generates `JWT_SECRET`; for a manually created Web Service, set it yourself. Let Render supply `PORT`. Local `.env` files are ignored by Git and are not uploaded to either service.

Commit and push the configuration, then deploy that commit on Vercel. Verify `/api/health` on the Vercel domain returns JSON with `status: ok`, then test signing in. A `401` JSON response from `/api/auth/me` before signing in is expected; a `404` or an HTML response indicates API routing is still missing. Check that refreshing `/login` loads the app as well.

### When Vercel still returns 404

1. In Vercel project settings, confirm the connected Git repository and production branch (`main`). Leave Root Directory blank so Vercel can read the root `vercel.json`. Use the Vite framework preset, build command `npm run build`, and output directory `dist`.
2. Deploy the latest commit containing `vercel.json`. Redeploying an older deployment uses its older source; select the new commit instead. After changing Root Directory, create a new deployment with the updated settings.
3. Open the Production domain from the latest Ready deployment. A previously copied deployment-specific URL still points to its original deployment. If external requests redirect to Vercel sign-in, inspect Deployment Protection and use the public domain intended for your app.
4. Run `npm run check:deployment -- https://YOUR-PRODUCTION-DOMAIN`. It checks API health, the unauthenticated session response, login validation using an empty request (no account is created), and the `/login` page fallback.
5. Sign up or sign in, refresh the page, and add a product to verify authentication and database writes.

### Which values go where?

| Value | Location | Purpose |
| --- | --- | --- |
| `VITE_API_URL=/api` | `client/.env`; optional Vercel build environment variable | Public path used by the browser. Builds reject a direct Render URL because this app uses same-origin session cookies. |
| `https://YOUR-SERVICE.onrender.com` | API rewrite in `vercel.json`, set with `npm run configure:render` | Public backend address, not a credential. Update after recreating the Render service. |
| `MONGODB_URI` | Render Environment; `server/.env` for local development | Private database connection string. Use MongoDB Atlas for Render. |
| `JWT_SECRET` | Render Environment; `server/.env` for local development | Private signing secret. Keep it stable across redeploys to preserve existing sessions. |
| `NODE_ENV=production` | Render Environment | Enables secure production cookies and serves the built frontend. |
| Render API key / deploy hook | Not required by this application | Never put these in the frontend. Git integration handles deployment. |

Anything prefixed with `VITE_` is public in the browser bundle. Do not put database credentials, JWT secrets, or Render API keys there. There is no shared key needed to link Vercel and Render: the public URL and API rewrite provide the connection.

The configuration command intentionally accepts standard Render service URLs. For a custom backend domain, edit the rewrite destination in `vercel.json` directly, keeping `/api/:path*` at the end.

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
