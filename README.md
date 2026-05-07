# EXE101

Spring Boot microservices backend + Vite React frontend (from [SRS](.guide/SRS.md) and [original schema](.guide/original.sql)).

## Structure

- **BE/** – Maven multi-module backend (Java 21, Spring Boot 3.4)
  - **common** – Shared config, security (JWT resource server), DTOs, exception handling
  - **auth** (port **8081**) – OAuth2 Authorization Server, users, JWT issuance
  - **read** (port **8083**) – Read service (documents, schedules, quizzes – to be extended)
  - **workflow** (port **8082**) – Workflow service (rooms, tasks, teams, meetings – to be extended)
- **frontend/** – Vite + React 19 + TypeScript, React Router

## Backend – Getting started

1. **PostgreSQL**: Create databases `auth`, `read`, `workflow` on `localhost:5432` (user/pass `postgres` or set in each service’s `application.yaml`).

2. **Build:**
   ```bash
   cd BE
   ./mvnw.cmd clean install -DskipTests   # Windows
   # ./mvnw clean install -DskipTests     # Linux/macOS
   ```

3. **Run services** (each in its own terminal):
   ```bash
   cd BE/auth && ../mvnw.cmd spring-boot:run      # 8081
   cd BE/read && ../mvnw.cmd spring-boot:run       # 8083
   cd BE/workflow && ../mvnw.cmd spring-boot:run   # 8082
   ```

   With `local` profile, JPA uses `ddl-auto: update` for schema.

## Frontend – Getting started

```bash
cd frontend
npm install
npm run dev
```

- App: http://localhost:5173  
- **Login** uses OAuth2 authorization code flow with auth service (8081). Redirect URIs include `http://localhost:5173/callback`.  
- **Dashboard** calls auth `/api/v1/users/me` (proxied to 8081) and health endpoints on read (8083) and workflow (8082).

## Configuration

- **Auth** – OAuth2 client `exe101-web` / `secret`; CORS allows `http://localhost:5173`.  
- **Read / Workflow** – Validate JWT via `http://localhost:8081/oauth2/jwks`.  
- Frontend proxy in `vite.config.ts`: `/api` → `http://localhost:8081`.

## Tech stack

- **Backend:** Spring Boot 3.4, Java 21, Spring Security OAuth2 (Authorization Server + Resource Server), JPA, PostgreSQL.  
- **Frontend:** Vite 6, React 19, TypeScript, React Router 7.
