# OnePay Residential Platform (MVP)

This repository is the starting point for the OnePay real-estate sales platform:

- User registration/login and profile
- Residential projects, units, and floor plans
- CAD plan metadata prepared for web viewers
- Unit purchase requests with lifecycle tracking
- Online payment flow via gateway abstraction (mock gateway included)

## Stack

- Backend: FastAPI, SQLAlchemy, SQLite (for MVP)
- Frontend: Next.js (App Router), TypeScript, custom CSS design system

## Project Structure

```text
onepay-housing/
  backend/
    app/
      core/          # settings and security
      routers/       # API routes
      services/      # payment and CAD helper services
      db.py
      models.py
      schemas.py
      seed.py
      main.py
  frontend/
    app/             # Next.js routes
    components/      # shared UI and auth provider
    lib/             # API client + types
```

## Quick Start

### 1) Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python -m app.seed
uvicorn app.main:app --reload --port 8000
```

### 2) Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend default URL: `http://localhost:3000`

## MVP Notes

- CAD viewer integration is prepared through `viewer_url` and `urn` metadata per floor plan.
- Payment integration is abstracted in backend services; replace mock logic with a real PSP gateway.
- Use HTTPS, secure cookie/session strategy, and proper KYC/verification before production launch.
