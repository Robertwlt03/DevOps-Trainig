## DevOps-Trainig – Docker & Neon setup

### Overview

This application uses:

- **Node.js/Express** with `@neondatabase/serverless` and `drizzle-orm`
- **Neon Cloud** for production Postgres
- **Neon Local** (Docker proxy) for development and testing, with optional ephemeral branches

Environment-specific behavior is controlled by the `DATABASE_URL` and a small Neon Local switch in `src/config/database.js`.

### Environment variables

- **Common**
  - **`DATABASE_URL`**: Postgres connection string used by `@neondatabase/serverless`.
- **Development / Neon Local**
  - **`NEON_API_KEY`**: Neon API key (for Neon Local proxy).
  - **`NEON_PROJECT_ID`**: Neon project ID.
  - **`PARENT_BRANCH_ID`**: Parent branch ID for Neon Local ephemeral branches.
  - **`NEON_LOCAL`**: When set to `true`, the app configures the Neon serverless driver to talk to the Neon Local proxy.
  - **`NEON_LOCAL_HOST`**, **`NEON_LOCAL_PORT`**: Host/port of the Neon Local container (used inside Docker network).

### How the app selects Neon Local vs Neon Cloud

In `src/config/database.js`:

- **Production (Neon Cloud)**:
  - `NEON_LOCAL` is **not** set to `true`.
  - The app calls `neon(process.env.DATABASE_URL)` directly and connects to the managed Neon Cloud endpoint.
- **Development (Neon Local)**:
  - `NEON_LOCAL=true` causes the app to:
    - Set `neonConfig.fetchEndpoint` to `http://<NEON_LOCAL_HOST>:<NEON_LOCAL_PORT>/sql`
    - Disable secure websockets and route queries over HTTP to the Neon Local proxy.
  - The app still calls `neon(process.env.DATABASE_URL)`, but that URL points at the Neon Local proxy inside the Docker network.

### Files added for Docker & environments

- **`Dockerfile`** – Builds the Node.js application image.
- **`docker-compose.dev.yml`** – Development stack:
  - Runs **Neon Local** proxy (`neon-local` service).
  - Runs the **app** container configured to use Neon Local.
- **`docker-compose.prod.yml`** – Production stack:
  - Runs only the **app** container.
  - App connects directly to **Neon Cloud** via `DATABASE_URL` (no Neon Local).
- **`.env.development`** – Example development env file for local Docker-based dev.
- **`.env.production`** – Example production env file for Neon Cloud.

### Development: run app with Neon Local

1. **Fill in `.env.development`**

   Edit `.env.development` and set:

   - **`NEON_API_KEY`** – from Neon console (API Keys).
   - **`NEON_PROJECT_ID`** – from Neon project settings.
   - **`PARENT_BRANCH_ID`** – ID of the parent branch you want ephemeral branches created from (often your default branch).
   - Ensure `DATABASE_URL` uses an existing database name in Neon (typically `neondb`).

   The important part for the app is:

   - **`DATABASE_URL=postgres://neon:npg@neon-local:5432/neondb`**

2. **Start the development stack**

   From the project root:

   ```bash
   docker compose -f docker-compose.dev.yml up --build
   ```

   This will:

   - Start `neon-local` (Neon Local proxy) on port `5432`.
   - Start `devops-training-app-dev` on port `3000`.
   - Create an **ephemeral Neon branch** (via Neon Local) when the proxy container starts, and delete it when the container stops.

3. **Access the app**

   - App: `http://localhost:3000`
   - Database: app connects to `postgres://neon:npg@neon-local:5432/neondb` inside the Docker network, which Neon Local routes to the correct Neon Cloud project/ephemeral branch.

4. **Stop the stack**

   ```bash
   docker compose -f docker-compose.dev.yml down
   ```

   The Neon Local container will stop, and any ephemeral branch it created will be cleaned up automatically (unless you configured `DELETE_BRANCH=false`).

### Production: run app with Neon Cloud

In production, you connect directly to your Neon Cloud database. **No Neon Local proxy runs in production.**

1. **Fill in `.env.production`**

   Set:

   - **`DATABASE_URL`** – your Neon Cloud connection string, for example:

     ```bash
     DATABASE_URL=postgres://user:password@ep-someid.region.aws.neon.tech/neondb?sslmode=require
     ```

   Ensure this file is **not committed** with real secrets, or use a more secure mechanism (e.g., Docker secrets, orchestration platform env vars).

2. **Start the production stack (locally or on a host)**

   ```bash
   docker compose -f docker-compose.prod.yml up --build -d
   ```

   This will:

   - Build and run the `devops-training-app-prod` container.
   - App will read `DATABASE_URL` from `.env.production` and connect directly to Neon Cloud using the serverless driver.

3. **Access the app**

   - App: `http://localhost:3000` (or the port/host mapped by your deployment environment).

### Switching `DATABASE_URL` between dev and prod

- **Development**
  - `docker-compose.dev.yml` uses `.env.development`.
  - `DATABASE_URL` is set to `postgres://neon:npg@neon-local:5432/neondb`.
- **Production**
  - `docker-compose.prod.yml` uses `.env.production`.
  - `DATABASE_URL` is set to the Neon Cloud `...neon.tech...` URL.
  - No Neon Local variables are set, so the app talks directly to Neon Cloud.

### Notes and recommendations

- **Secrets management**
  - Do not commit real values for `NEON_API_KEY`, `NEON_PROJECT_ID`, or production `DATABASE_URL`.
  - Use a secrets manager or environment variables in your orchestration platform for real deployments.
- **Running without Docker in development**
  - You can still run `npm install` and `npm run dev` locally.
  - In that case, set your local `.env` to point to either your Neon Cloud DB or a Neon Local instance you run separately, and adjust `NEON_LOCAL` / `DATABASE_URL` accordingly.

