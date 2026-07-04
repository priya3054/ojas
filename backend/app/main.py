from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import (
    auth,
    chat,
    cycle,
    discover,
    export,
    habits,
    integrations,
    journal,
    medicine,
    screen_time,
)

app = FastAPI(title="Ojas API")

# Allow the frontend (a different origin in production) to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(journal.router)
app.include_router(medicine.router)
app.include_router(habits.router)
app.include_router(screen_time.router)
app.include_router(cycle.router)
app.include_router(chat.router)
app.include_router(discover.router)
app.include_router(export.router)
app.include_router(integrations.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
