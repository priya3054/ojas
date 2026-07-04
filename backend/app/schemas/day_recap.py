from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class DayRecapCreate(BaseModel):
    date: date
    duration_seconds: int
    transcript_summary: str | None = None


class DayRecapRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    date: date
    duration_seconds: int
    transcript_summary: str | None
    overall_read: str | None
    confidence: float | None
    stress_score: float | None
    energy_score: float | None
    positivity_score: float | None
    themes: list[str] | None
    mood_label: str | None
    created_at: datetime
