from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class ScreenTimeLogCreate(BaseModel):
    date: date
    hours: float


class ScreenTimeLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    date: date
    hours: float
    created_at: datetime


class ScreenTimeGoalUpdate(BaseModel):
    goal_hours: float
