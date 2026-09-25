from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import create_indexes
from routes import auth, search, professional,bookings # Add profiles here


@asynccontextmanager
async def lifespan(app:FastAPI):
    print("Starting")
    await create_indexes()

    yield

    print("Stopping")

app = FastAPI(lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

app.include_router(auth.router,prefix="/auth",tags=["Authentication"])
app.include_router(search.router,prefix="/search",tags=["Location Services"])
app.include_router(professional.router, prefix="/profiles", tags=["Profiles"])
app.include_router(bookings.router,prefix="/bookings",tags=["Bookings"])