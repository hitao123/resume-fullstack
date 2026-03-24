# Resume Backend API

Go + Gin backend for the Resume Studio application.

## Prerequisites

- Go 1.21 or higher
- MySQL 8.0
- Docker (optional, for running MySQL)

## Installation

### 1. Install Go

If you haven't installed Go yet:

**macOS:**
```bash
brew install go
```

**Or download from:** https://golang.org/dl/

Verify installation:
```bash
go version
```

### 2. Install Dependencies

```bash
cd backend
go mod download
```

This will download all required packages:
- gin-gonic/gin - Web framework
- gorm.io/gorm - ORM
- gorm.io/driver/mysql - MySQL driver
- golang-jwt/jwt - JWT authentication
- golang.org/x/crypto - Password hashing
- gin-contrib/cors - CORS middleware
- joho/godotenv - Environment variables

### 3. Start MySQL Database

**Using Docker (Recommended):**
```bash
# From project root directory
docker-compose up -d mysql
```

**Or install MySQL locally:**
- macOS: `brew install mysql`
- Create database: `resume_db`
- Create user with credentials from `.env`

### 4. Configure Environment

The `.env` file is already created with development defaults:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=resume_user
DB_PASSWORD=resume_password
DB_NAME=resume_db

JWT_SECRET=dev-jwt-secret-key-12345
JWT_REFRESH_SECRET=dev-refresh-secret-key-67890
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=168h

PORT=8080
GIN_MODE=debug
```

**For production**, change the secrets!

## Running the Server

```bash
cd backend
go run cmd/server/main.go
```

The server will:
1. Load environment variables from `.env`
2. Initialize JWT configuration
3. Connect to MySQL database
4. Run database migrations (create tables)
5. Start HTTP server on port 8080

You should see:
```
Database connected successfully
Running database migrations...
Database migrations completed successfully
Server starting on port 8080...
```

## API Endpoints

### Health Check
```bash
GET http://localhost:8080/health
```

### Authentication

**Register:**
```bash
POST http://localhost:8080/api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Login:**
```bash
POST http://localhost:8080/api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Get Current User:**
```bash
GET http://localhost:8080/api/v1/auth/me
Authorization: Bearer <access_token>
```

**Refresh Token:**
```bash
POST http://localhost:8080/api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "<refresh_token>"
}
```

**Logout:**
```bash
POST http://localhost:8080/api/v1/auth/logout
Content-Type: application/json

{
  "refreshToken": "<refresh_token>"
}
```

### Resumes (Protected - requires JWT)

**List Resumes:**
```bash
GET http://localhost:8080/api/v1/resumes
Authorization: Bearer <access_token>
```

**Create Resume:**
```bash
POST http://localhost:8080/api/v1/resumes
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Software Engineer Resume",
  "templateId": 1
}
```

**Get Resume:**
```bash
GET http://localhost:8080/api/v1/resumes/:id
Authorization: Bearer <access_token>
```

**Update Resume:**
```bash
PUT http://localhost:8080/api/v1/resumes/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Updated Title"
}
```

**Delete Resume:**
```bash
DELETE http://localhost:8080/api/v1/resumes/:id
Authorization: Bearer <access_token>
```

**Update Personal Info:**
```bash
PUT http://localhost:8080/api/v1/resumes/:resumeId/personal-info
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "location": "San Francisco, CA",
  "summary": "Experienced software engineer..."
}
```

## Project Structure

```
backend/
├── cmd/
│   └── server/
│       └── main.go              # Application entry point
├── internal/
│   ├── api/
│   │   ├── handlers/            # HTTP request handlers
│   │   │   ├── auth_handler.go
│   │   │   └── resume_handler.go
│   │   ├── middleware/          # Custom middleware
│   │   │   ├── auth.go          # JWT authentication
│   │   │   └── cors.go          # CORS configuration
│   │   └── routes/
│   │       └── routes.go        # Route definitions
│   ├── domain/
│   │   └── models/
│   │       └── models.go        # GORM database models
│   └── dto/                     # Data Transfer Objects
│       ├── auth.go
│       └── resume.go
├── pkg/
│   ├── auth/                    # Authentication utilities
│   │   ├── jwt.go               # JWT token generation/validation
│   │   └── password.go          # Password hashing
│   └── database/
│       └── database.go          # Database connection & migration
├── config/
│   └── config.go                # Configuration management
├── go.mod                       # Go module dependencies
├── .env                         # Environment variables
└── Dockerfile                   # Docker image configuration
```

## Database Schema

The application will automatically create these tables:

- `users` - User accounts
- `resumes` - Resume documents
- `personal_info` - Personal information section
- `work_experiences` - Work experience entries
- `education` - Education entries
- `skills` - Skill entries
- `projects` - Project entries
- `certifications` - Certification entries
- `languages` - Language proficiency entries
- `refresh_tokens` - JWT refresh tokens

## Development

**Run with auto-reload (using air):**
```bash
go install github.com/air-verse/air@latest
air
```

**Build for production:**
```bash
go build -o resume-api cmd/server/main.go
./resume-api
```

**Run with Docker:**
```bash
# From backend directory
docker build -t resume-backend .
docker run -p 8080:8080 --env-file .env resume-backend
```

## Testing

Test the API with curl or tools like:
- Postman
- Insomnia
- Thunder Client (VS Code extension)

Example test flow:
1. Register a user
2. Login to get access token
3. Create a resume
4. Update personal info
5. Get resume with all data

## Troubleshooting

**"Failed to connect to database"**
- Check MySQL is running: `docker ps` or `mysql.server status`
- Verify credentials in `.env`
- Check port 3306 is not in use

**"command not found: go"**
- Install Go: https://golang.org/dl/
- Add to PATH: `export PATH=$PATH:/usr/local/go/bin`

**Port 8080 already in use**
- Change PORT in `.env`
- Kill process: `lsof -ti:8080 | xargs kill`

## Next Steps

- [ ] Add work experience CRUD endpoints
- [ ] Add education CRUD endpoints
- [ ] Add skills management endpoints
- [ ] Add projects endpoints
- [ ] Add rate limiting
- [ ] Add request logging
- [ ] Add unit tests
- [ ] Add API documentation (Swagger)
