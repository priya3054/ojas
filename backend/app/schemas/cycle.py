from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class CycleEntryCreate(BaseModel):
    date: date
    period_start: bool = False
    symptoms: list[str] | None = None
    notes: str | None = None


class CycleEntryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    date: date
    period_start: bool
    symptoms: list[str] | None
    notes: str | None
    created_at: datetime


class CycleSettingsUpdate(BaseModel):
    cycle_length_days: int
