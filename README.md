# Connect

Connect is a location-based marketplace that helps clients find nearby service professionals. Clients can search on a map, view professional profiles, and unlock contact details. Professionals can create a profile, set their service location, and manage availability and leads.

## Project layout

- `Backend/` — FastAPI API and MongoDB data access.
- `Connect/` — React frontend built with Vite, Material UI, and React Leaflet.

## Requirements

- Node.js 20 or newer
- Python 3.11 or newer
- MongoDB locally, or a MongoDB Atlas connection string

## Run locally

Start the backend in PowerShell:

```powershell
cd Backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Set `JWT_SECRET` in `Backend/.env` to a long random value. Start MongoDB, then run:

```powershell
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The API documentation is at `http://127.0.0.1:8000/docs`.

In a second PowerShell window, start the frontend:

```powershell
cd Connect
npm install
Copy-Item .env.example .env
npm run dev
```

Open the Vite URL printed in the terminal. Set `VITE_API_BASE_URL` in `Connect/.env` if the API runs at a different address.

## Production configuration

The frontend reads its API URL from `VITE_API_BASE_URL`. The backend reads `MONGO_URI`, `MONGO_DB_NAME`, `JWT_SECRET`, and `CORS_ORIGINS` from its environment. Set these in your hosting provider's environment settings; do not commit `.env` files or production secrets.

A straightforward split deployment is:

- Backend web service: root directory `Backend`; build command `pip install -r requirements.txt`; start command `uvicorn main:app --host 0.0.0.0 --port $PORT`.
- Frontend static site: root directory `Connect`; build command `npm ci && npm run build`; publish directory `dist`.
- Set the frontend's `VITE_API_BASE_URL` to the deployed API URL, and set the backend's `CORS_ORIGINS` to the deployed frontend URL.
- Use MongoDB Atlas for hosted data and set its connection string as `MONGO_URI`. Add the backend host to the Atlas network access list.

Keep the backend JWT secret private. Never place it in a `VITE_` variable, since Vite variables are included in the browser build.
