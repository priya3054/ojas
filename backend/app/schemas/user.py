from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str


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
