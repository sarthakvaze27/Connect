from contextlib import asynccontextmanager
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from database import create_indexes
from routes import auth, search, professional, bookings


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting")
    await create_indexes()
    yield
    print("Stopping")


app = FastAPI(lifespan=lifespan)

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:5175,http://127.0.0.1:5175",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(search.router, prefix="/search", tags=["Location Services"])
app.include_router(professional.router, prefix="/profiles", tags=["Profiles"])
app.include_router(bookings.router, prefix="/bookings", tags=["Bookings"])


@app.get("/health")
async def health():
    return {"status": "ok"}
