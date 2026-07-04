from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class HabitCreate(BaseModel):
    name: str
    goal: str
    icon: str = "target"


class HabitRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    name: str
    goal: str
    icon: str
    created_at: datetime


class HabitEntryCreate(BaseModel):
    date: date
    kept: bool
    trigger_note: str | None = None


class HabitEntryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    habit_id: int
    date: date
    kept: bool
    trigger_note: str | None
    created_at: datetime
