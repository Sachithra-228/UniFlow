# Smart Campus Operations Hub

Production-style full-stack system for campus users, resources, and bookings with optional Google OAuth2 login.

## Tech Stack

Backend
- Java 17, Spring Boot, Spring Security (OAuth2 Client), Spring Data JPA
- PostgreSQL

Frontend
- React + Vite
- Tailwind CSS
- React Router, Axios
- Lucide React icons

## Project Structure

- `src/` - Spring Boot backend
- `frontend/` - React frontend

## Prerequisites

- Java 17
- Node.js 18+ (for frontend)
- Maven (optional if using `mvnw`)
- PostgreSQL running locally if you want to use the persistent database

## Database

By default the backend starts with an in-memory H2 database for local development.

To use PostgreSQL instead, set:
```powershell
$env:DB_URL="jdbc:postgresql://localhost:5432/smart_campus_db"
$env:DB_USERNAME="your_db_username"
$env:DB_PASSWORD="your_db_password"
```

## Environment Variables

Backend uses environment variables for secrets and optional integrations.

PowerShell (Windows):
```powershell
$env:GOOGLE_CLIENT_ID="your_google_client_id"
$env:GOOGLE_CLIENT_SECRET="your_google_client_secret"
```

Bash (macOS/Linux):
```bash
export GOOGLE_CLIENT_ID="your_google_client_id"
export GOOGLE_CLIENT_SECRET="your_google_client_secret"
```

## Backend (Spring Boot)

From repo root:
```bash
./mvnw spring-boot:run
```
or
```bash
mvn spring-boot:run
```

Backend runs on: `http://localhost:8081`

### OAuth2 Login

When `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set, Google sign-in is enabled and users are redirected to the frontend:
```
http://localhost:5173/dashboard
```

Profile endpoint (requires login):
```
GET /profile
```

### API Endpoints

- `GET /api/users`
- `GET /api/users/{id}`
- `GET /api/resources`
- `POST /api/resources`
- `GET /api/bookings`
- `POST /api/bookings`

## Frontend (React)

From `frontend/`:
```bash
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173`

If the backend is down, the UI shows polished fallback data.

## Notes

- Booking overlap is validated in service layer and DB constraint.
- DTOs are used for frontend-friendly responses.
- Pagination supported on list endpoints.
