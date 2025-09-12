# Application Plan: Flight Tower — Next.js (Frontend) + Python/FastAPI (Backend)

This plan consolidates architecture, modules, API contracts, data models, flows, and tasks to migrate the Streamlit POC into a production web app with a Next.js/React + Tailwind CSS frontend and a Python FastAPI backend. It includes minimalistic, modern UI, localization, dark mode, clustering, heading visualization, geolocation as in the POC, and uv as the Python package manager for CLI agent and Vercel v0 usage.

## Key Decisions

- Frontend: Next.js (App Router), React, Tailwind CSS; minimal, clear UI.
- Backend: Python (FastAPI), keeps POC logic (FlightRadar API + geodesic), served as a separate service.
- Package manager (Python): uv (Astral) as the primary manager.
- Geolocation: same as POC:
    - HTML5 navigator.geolocation
    - Fallback: IP-based location via backend endpoint.
- Results limit: default 10.
- Map features: dark mode, aircraft heading visualization.
- No persistence for search history or favorites.
- Deployment provider: not mandated; include Dockerfile and local run instructions.


## System Architecture

- Frontend
    - Next.js (App Router), React, Tailwind CSS.
    - State/data: API client.
    - Map: react-google-maps/api rotated aircraft icon for heading.
    - i18n: next-intl or lightweight context with pl/en JSON dictionaries (migrated from translations.py).
- Backend
    - FastAPI with endpoints:
        - GET /health
        - POST /flights/search
        - GET /flights/{id}
        - GET /geo/ip (IP geolocation fallback)
    - Integrations: FlightRadar API, geopy.distance, geocoder.
    - Caching: in-memory TTL; optional Redis later.
    - CORS all enabled for backend
- Communication: JSON REST over HTTPS.


## API Contracts

- POST /flights/search
    - Input:
        - lat: number
        - lon: number
        - radius_km: number (5–100)
        - limit: number (default 10)
    - Output:
        - count: number
        - flights: FlightSummary[]
- FlightSummary
    - id: string | null
    - callsign: string | null
    - lat: number
    - lon: number
    - distance_km: number
    - altitude_ft: number | null
    - speed_kts: number | null
    - origin_airport_name: string | null
    - origin_airport_iata: string | null
    - destination_airport_name: string | null
    - destination_airport_iata: string | null
    - heading_deg: number | null (0–360; from data source if available)
- GET /flights/{id}
    - Output:
        - airline: string | null
        - aircraft_code: string | null
        - route: { from: string | null, to: string | null }
        - times: { scheduled_departure: number | null, scheduled_arrival: number | null, duration_readable: string | null }
        - origin_country: string | null
        - destination_country: string | null
- GET /geo/ip
    - Output: { lat: number, lon: number, source: "ip" }
- GET /health
    - Output: { status: "ok", time: ISODate }


## Mapping POC Functions to Target Modules

- get_flights(bounds) → backend/services/flightradar.py
- geodesic distance → backend/utils/geo.py
- get_flight_details → backend/services/flightradar.py
- translations.py → frontend/i18n/pl.json and en.json


## Backend (FastAPI) Structure and Details

- Directory layout
    - app/
        - main.py (FastAPI app, CORS, settings)
        - api/
            - health.py
            - flights.py
            - geo.py
        - services/
            - flightradar.py (wrapper for FlightRadar API with retries and mapping)
        - utils/
            - geo.py (geodesic distance, bounds validation)
            - cache.py (simple TTL cache)
        - models/
            - schemas.py (Pydantic: SearchRequest, FlightSummary, FlightDetail)
- Dependencies
    - fastapi, uvicorn
    - geopy
    - geocoder
    - flightradarapi (consistent with POC)
    - httpx (for outbound calls/retries)
    - pydantic, pydantic-settings
    - python-dotenv (optional)
- Behavior
    - Validate coordinates and radius.
    - Map heading/kurs to heading_deg when available.
    - Timeouts/retries on external calls.
    - Caching:
        - search: key by (lat, lon, radius_km, limit) for ~15s
        - details: 30–60s
    - Error handling: return partial/basic data when details are unavailable.


## Frontend (Next.js/React/Tailwind) Structure and Details

- Directory layout
    - app/
        - layout.tsx (theme, fonts, metadata, dark mode toggler)
        - page.tsx (main screen)
    - flights/
        - components/
            - Controls.tsx (Get My Location, Set by IP, radius slider, lat/lon inputs, Find Flights)
            - FlightsList.tsx (top 10 by distance)
            - FlightCard.tsx
            - FlightDetailDrawer.tsx
            - Map.tsx (react-google-maps/api + heading)
                - Aircraft markers with icon rotation by heading_deg
                - Tooltips: callsign, distance, altitude_ft, speed_kts
        - hooks/
            - useGeolocation.ts (HTML5 geolocation)
            - useFlights.ts (integration with backend)
        - lib/
            - api.ts (fetch helpers)
            - i18n.ts (next-intl or lightweight translator)
    - i18n/
        - pl.json
        - en.json
- Styling
    - Tailwind CSS (class-based dark mode).
    - Minimal palette; high contrast and readability.
- Libraries
    - react-google-maps/api


## Geolocation Flow (as in POC)

1) HTML5 navigator.geolocation when user clicks “Get My Location.”
2) Fallback: “Set by IP” triggers GET /geo/ip and sets coordinates.
3) Manual input fields for lat/lon in the controls panel.

Show localized feedback messages (success/error) as in translations.py.

## UI/UX Guidelines

- Layout
    - Left panel: controls (language, location, radius, actions).
    - Right area: map and flights list.
- Map
    - Dark mode supported (matching app theme).
    - Heading: rotate aircraft SVG icon by heading_deg (transform-origin: center).
- States and messaging
    - Loading, empty, and error states localized.
    - Tooltips include callsign, distance_km, altitude_ft, speed_kts.


## i18n Migration

- Move all keys from translations.py to:
    - i18n/pl.json
    - i18n/en.json
- Add new keys:
    - set_by_ip
    - dark_mode
    - heading
- Keep placeholders like {radius_km}, {time}, {count} and format in UI helpers.


## Security and Limits

- CORS: allow all domains.
- Optional rate limiting on /flights endpoints (slowapi).
- External calls have timeouts and retries.
- Secrets (if any later) via environment variables; do not commit to VCS.


## Testing

- Backend
    - Unit tests: data mapping from flightradarapi; distance and heading calculation; schema validation.
    - E2E: /flights/search and /flights/{id} with stubs/mocks.
- Frontend
    - Component tests: Controls, FlightsList, FlightDetailDrawer, Map markers rotation.
    - E2E (Playwright): geolocation flow → search → map/list sync → open details.


## Deployment

- Backend
    - Containerized (Dockerfile).
    - Run on any server; TLS termination via reverse proxy if needed.
    - CORS configured for frontend domain(s).
- Frontend
    - Deploy on Vercel.
    - Env: NEXT_PUBLIC_API_BASE_URL pointing to backend.
- No specific provider required by the plan.


## Python Package Management (uv)

- Files
    - pyproject.toml (source of truth for deps)
    - uv.lock (generated)
- Commands
    - uv venv
    - uv add <package> (adds to pyproject and lock)
    - uv run uvicorn app.main:app --reload
    - uv pip install -e . (if using editable local package)
- Update README with uv-based workflows.

Backend dependencies (baseline):

- fastapi, uvicorn
- geopy
- geocoder
- flightradarapi
- httpx
- pydantic, pydantic-settings
- python-dotenv (optional)

Frontend dependencies (baseline):

- next, react, react-dom
- tailwindcss, postcss, autoprefixer
- react-google-maps/api
- next-intl (or custom i18n)
- class-variance-authority (optional)


## Implementation Tasks (Order)

1) Repositories and Setup

- Create monorepo (optional) or two repositories (frontend, backend).
- Initialize backend with uv; add pyproject.toml and uv.lock.
- Add Dockerfile for backend; set up basic CI.

2) Backend

- Scaffold FastAPI app, /health.
- /flights/search: integrate flightradarapi, geodesic distance; include heading_deg.
- /flights/{id}: map details, compute duration_readable.
- /geo/ip: implement with geocoder.ip("me").
- Add in-memory cache and logging; configure CORS.
- Unit tests for mapping, distance, heading; basic E2E with mocks.

3) Frontend

- Scaffold Next.js + Tailwind; dark mode with class strategy and toggle.
- i18n (PL/EN) with next-intl or custom.
- Controls: geolocation, IP fallback, radius slider, lat/lon inputs, search button.
- Data layer with API client.
- Map with react-google-maps/api, rotated aircraft icon; tooltips.
- Flights list and details drawer; sync with map markers.
- Component tests.

4) Integration and E2E

- End-to-end flow: geolocation → search → render map/list → open details.
- Optional auto-refresh toggle (every 10–20s) if desired.

5) Deployment

- Deploy backend to chosen host; configure CORS.
- Deploy frontend to Vercel; set NEXT_PUBLIC_API_BASE_URL.
- Smoke tests and monitoring via /health.


## Open Items to Confirm

- Heading visualization: icon rotation only, or add a small direction vector line?
- Auto-refresh feature for searches (on/off, default interval 10–20s)?

<div style="text-align: center">⁂</div>
