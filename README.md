# Smart Campus Operations Hub

Production-style full-stack system for campus users, resources, and bookings with Google OAuth2 login.

## Tech Stack

Backend
- Java 17, Spring Boot, Spring Security (OAuth2 Client), Spring Data JPA
- PostgreSQL

Frontend
- React +  Vite
- Tailwind CSS
- React Router, Axios
- Lucide React icons

## Project Structure

- `src/` - Spring Boot backend
- `frontend/` - React frontend

## Prerequisites

- Java 17
- PostgreSQL running locally
- Node.js 18+ (for frontend)
- Maven (optional if using `mvnw`)

## Database

Database name: `smart_campus_db`

Tables already exist: `users`, `resources`, `bookings` (snake_case columns).  
DDL is not managed by Hibernate (`spring.jpa.hibernate.ddl-auto=none`).

## Environment Variables

Backend uses environment variables for secrets.

PowerShell (Windows):
```powershell
$env:DB_PASSWORD="your_db_password"
$env:GOOGLE_CLIENT_ID="your_google_client_id"
$env:GOOGLE_CLIENT_SECRET="your_google_client_secret"
```

Bash (macOS/Linux):
```bash
export DB_PASSWORD="your_db_password"
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

After Google sign-in, users are saved to the `users` table and redirected to the frontend:
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
