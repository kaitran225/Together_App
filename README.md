# EXE101

Spring Boot microservices backend + Vite React frontend (from [SRS](.guide/SRS.md) and [original schema](.guide/original.sql)).

## Structure

- **BE/** – Maven multi-module backend (Java 21, Spring Boot 3.4)
  - **common** – Shared config, security (JWT resource server), DTOs, exception handling
  - **auth** (port **8880**) – OAuth2 Authorization Server, users, JWT issuance
  - **workflow** (port **8881**) – Workflow service (rooms, tasks, teams, meetings – to be extended)
  - **read** (port **8882**) – Read service (documents, schedules, quizzes – to be extended)
- **FE/** – Vite + React 19 + TypeScript, React Router

## Backend – Getting started

1. **PostgreSQL**: Create databases `auth`, `read`, `workflow` on `localhost:5432`. Copy `.env.example` to `.env` at the repo root and set `DB_USERNAME` / `DB_PASSWORD` (and other keys; no `${VAR:default}` fallbacks).

2. **Build:**
   ```bash
   cd BE
   ./mvnw.cmd clean install -DskipTests   # Windows
   # ./mvnw clean install -DskipTests     # Linux/macOS
   ```

3. **Run services** (each in its own terminal):
   ```bash
   cd BE/auth && ../mvnw.cmd spring-boot:run      # 8880
   cd BE/workflow && ../mvnw.cmd spring-boot:run  # 8881
   cd BE/read && ../mvnw.cmd spring-boot:run      # 8882
   ```

   With `local` profile, the **read** service uses `ddl-auto: update`; auth/workflow use `validate` with Flyway where enabled.

## Frontend – Getting started

```bash
cd FE
npm install
npm run dev
```

- App: http://localhost:5173  
- **Login** uses OAuth2 authorization code flow with auth service (**8880**). Redirect URIs include `http://localhost:5173/callback`.  
- **Dashboard** calls auth `/api/v1/users/me` (proxied to **8880**) and health endpoints on workflow (**8881**) and read (**8882**).

## Configuration

- **Auth** – OAuth2 client `exe101-web` / `secret`; CORS allows `http://localhost:5173`.  
- **Read / Workflow** – Validate JWT via `http://localhost:8880/oauth2/jwks`.  
- Frontend proxy in `FE/vite.config.ts`: `/api` and `/oauth2` → `http://localhost:8880`.

## Tech stack

- **Backend:** Spring Boot 3.4, Java 21, Spring Security OAuth2 (Authorization Server + Resource Server), JPA, PostgreSQL.  
- **Frontend:** Vite 6, React 19, TypeScript, React Router 7.
