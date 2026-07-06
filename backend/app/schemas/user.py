from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str


class UserUpdate(BaseModel):
    name: str | None = None
    current_mood: str | None = None
    accent_theme: str | None = None
    ambient_motion: bool | None = None
    show_mascot: bool | None = None
    cycle_length_days: int | None = None
    screen_time_goal_hours: float | None = None


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    name: str
    current_mood: str
    accent_theme: str
    ambient_motion: bool
    show_mascot: bool
    cycle_length_days: int
    screen_time_goal_hours: float
    created_at: datetime
